/**
 * Журнал замеров рудничной атмосферы с тревогами
 * Устав ВГСЧ (приказ МЧС России № 251): п. 18–19 (замеры при входе), п. 41 (ЗВТ: рост 3 °C за 5 мин),
 * п. 64 (контроль метана), Приложение № 4 (таблица изменения состава рудничной атмосферы).
 */
import { calcVgschTriangle } from './explosion-triangle-calc'

export interface AtmoRow {
  time: string        // ЧЧ:ММ
  co2?: number | null
  o2?: number | null
  co?: number | null
  h2?: number | null
  ch4?: number | null
  other?: string
  temp?: number | null
}

export interface AtmoLimits {
  o2Min: number
  coMax: number
  co2Max: number
  ch4Warn: number
  ch4Stop: number
  h2Max: number
  tempZvt: number
  tempRise: number
}

export const ATMO_DEFAULT_LIMITS: AtmoLimits = {
  o2Min: 20,
  coMax: 0.0017,
  co2Max: 0.5,
  ch4Warn: 1,
  ch4Stop: 2,
  h2Max: 0.5,
  tempZvt: 27,
  tempRise: 3,
}

export const ATMO_LIMIT_LABELS: Record<keyof AtmoLimits, string> = {
  o2Min: 'O₂ не менее, %',
  coMax: 'ПДК CO, %',
  co2Max: 'CO₂ не более, %',
  ch4Warn: 'CH₄ — внимание, %',
  ch4Stop: 'CH₄ — опасно, %',
  h2Max: 'H₂ не более, %',
  tempZvt: 'Граница ЗВТ, °C',
  tempRise: 'Рост t за 5 мин, °C',
}

export type AlarmLevel = 'danger' | 'warn' | 'info'

export interface AtmoAlarm {
  level: AlarmLevel
  title: string
  text: string
  rowIndex: number
}

export interface AtmoRowEval {
  minutes: number
  levels: Partial<Record<'co2' | 'o2' | 'co' | 'h2' | 'ch4' | 'temp', AlarmLevel>>
  explosive: boolean | null
  rise5: number | null
}

export interface AtmoResult {
  rows: AtmoRow[]
  evals: AtmoRowEval[]
  alarms: AtmoAlarm[]
  danger: boolean
  status: AlarmLevel | 'ok'
  verdict: string
  last: AtmoRow
  maxRise5: number | null
  trend: { ch4: number | null; co: number | null; temp: number | null }
}

const has = (v: number | null | undefined): v is number => v !== null && v !== undefined && isFinite(v)

export function timeToMin(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  if (!m) return null
  const h = +m[1], mm = +m[2]
  if (h > 23 || mm > 59) return null
  return h * 60 + mm
}

/** Абсолютные минуты с учётом перехода через полночь */
function absMinutes(rows: AtmoRow[]): number[] {
  let day = 0
  let prev = -1
  return rows.map(r => {
    const m = timeToMin(r.time) ?? 0
    if (prev >= 0 && m < prev - 60) day += 1440
    prev = m
    return m + day
  })
}

const pct = (n: number) => {
  const s = Math.abs(n) < 0.01 ? n.toPrecision(2) : String(Math.round(n * 1000) / 1000)
  return String(Number(s)).replace('.', ',')
}

export function calcAtmo(input: AtmoRow[], limits: AtmoLimits = ATMO_DEFAULT_LIMITS, lastRise5?: number | null): AtmoResult | null {
  const rows = input.filter(r => timeToMin(r.time) !== null)
  if (!rows.length) return null
  const mins = absMinutes(rows)
  const alarms: AtmoAlarm[] = []
  const L = limits

  const evals: AtmoRowEval[] = rows.map((r, i) => {
    const levels: AtmoRowEval['levels'] = {}
    if (has(r.o2) && r.o2 < L.o2Min) levels.o2 = r.o2 < 17 ? 'danger' : 'warn'
    if (has(r.co) && r.co > L.coMax) levels.co = r.co >= 0.1 ? 'danger' : 'warn'
    if (has(r.co2) && r.co2 > L.co2Max) levels.co2 = r.co2 >= 3 ? 'danger' : 'warn'
    if (has(r.h2) && r.h2 > L.h2Max) levels.h2 = 'warn'
    if (has(r.ch4) && r.ch4 >= L.ch4Warn) levels.ch4 = r.ch4 >= L.ch4Stop ? 'danger' : 'warn'
    if (has(r.temp) && r.temp > L.tempZvt) levels.temp = 'warn'

    let explosive: boolean | null = null
    const ch4 = r.ch4 ?? 0, co = r.co ?? 0, h2 = r.h2 ?? 0
    if (ch4 + co + h2 > 0 && has(r.o2)) {
      const t = calcVgschTriangle({ ch4, co, h2, o2: r.o2 })
      explosive = t ? t.isExplosive : null
    }

    let rise5: number | null = null
    if (has(r.temp)) {
      for (let j = i - 1; j >= 0; j--) {
        const dt = mins[i] - mins[j]
        if (dt <= 0) continue
        const pt = rows[j].temp
        if (!has(pt)) continue
        const rise = dt <= 5 ? r.temp - pt : ((r.temp - pt) / dt) * 5
        if (rise5 === null || rise > rise5) rise5 = rise
        if (dt > 5) break
      }
      if (i === rows.length - 1 && has(lastRise5) && (rise5 === null || lastRise5 > rise5)) rise5 = lastRise5
      if (rise5 !== null && rise5 >= L.tempRise) levels.temp = 'danger'
    }

    return { minutes: mins[i], levels, explosive, rise5 }
  })

  rows.forEach((r, i) => {
    const e = evals[i]
    const at = `${r.time}`
    if (e.rise5 !== null && e.rise5 >= L.tempRise) {
      alarms.push({ level: 'danger', rowIndex: i, title: 'Температура нарастает', text: `${at}: рост ${pct(e.rise5)} °C за 5 мин (норма — менее ${L.tempRise} °C). Прекратить задание, сообщить на ПБ и выйти на ПБ (п. 41 Устава).` })
    }
    if (e.explosive) {
      alarms.push({ level: 'danger', rowIndex: i, title: 'Взрывоопасная смесь', text: `${at}: смесь CH₄ ${pct(r.ch4 ?? 0)}%, CO ${pct(r.co ?? 0)}%, H₂ ${pct(r.h2 ?? 0)}%, O₂ ${pct(r.o2 ?? 0)}% попадает в треугольник взрываемости.` })
    }
    if (e.levels.ch4 === 'danger') alarms.push({ level: 'danger', rowIndex: i, title: 'Метан', text: `${at}: CH₄ ${pct(r.ch4!)}% — не ниже ${pct(L.ch4Stop)}%. Доложить на КП (п. 64).` })
    else if (e.levels.ch4 === 'warn') alarms.push({ level: 'warn', rowIndex: i, title: 'Метан', text: `${at}: CH₄ ${pct(r.ch4!)}% — не ниже ${pct(L.ch4Warn)}%.` })
    if (e.levels.co) alarms.push({ level: e.levels.co, rowIndex: i, title: 'Оксид углерода', text: `${at}: CO ${pct(r.co!)}% — выше ПДК ${pct(L.coMax)}%. Атмосфера непригодна для дыхания.` })
    if (e.levels.o2) alarms.push({ level: e.levels.o2, rowIndex: i, title: 'Кислород', text: `${at}: O₂ ${pct(r.o2!)}% — ниже ${pct(L.o2Min)}%. Атмосфера непригодна для дыхания.` })
    if (e.levels.co2) alarms.push({ level: e.levels.co2, rowIndex: i, title: 'Диоксид углерода', text: `${at}: CO₂ ${pct(r.co2!)}% — выше ${pct(L.co2Max)}%.` })
    if (e.levels.h2) alarms.push({ level: 'warn', rowIndex: i, title: 'Водород', text: `${at}: H₂ ${pct(r.h2!)}% — выше ${pct(L.h2Max)}%.` })
    if (e.levels.temp === 'warn') alarms.push({ level: 'warn', rowIndex: i, title: 'Зона высоких температур', text: `${at}: t = ${pct(r.temp!)} °C — выше ${L.tempZvt} °C. Рассчитать допустимое время пребывания (ЗВТ, п. 38).` })
  })

  const n = rows.length
  const delta = (k: 'ch4' | 'co' | 'temp') => {
    if (n < 2) return null
    const a = rows[n - 2][k], b = rows[n - 1][k]
    return has(a) && has(b) ? b - a : null
  }
  const trend = { ch4: delta('ch4'), co: delta('co'), temp: delta('temp') }
  if (trend.ch4 !== null && trend.ch4 > 0 && has(rows[n - 1].ch4) && rows[n - 1].ch4! >= L.ch4Warn / 2) {
    alarms.push({ level: 'warn', rowIndex: n - 1, title: 'Метан растёт', text: `Концентрация метана выросла на ${pct(trend.ch4)}% с предыдущего замера (карта-код № 1, сообщение 3).` })
  }
  if (trend.co !== null && trend.co > 0 && rows[n - 1].co! > L.coMax) {
    alarms.push({ level: 'warn', rowIndex: n - 1, title: 'CO растёт', text: `Концентрация CO выросла на ${pct(trend.co)}% с предыдущего замера (карта-код № 1, сообщение 4).` })
  }

  const lastIdx = n - 1
  const lastAlarms = alarms.filter(a => a.rowIndex === lastIdx)
  const status: AtmoResult['status'] = lastAlarms.some(a => a.level === 'danger') ? 'danger' : lastAlarms.some(a => a.level === 'warn') ? 'warn' : 'ok'
  const rises = evals.map(e => e.rise5).filter(has)
  const maxRise5 = rises.length ? Math.max(...rises) : null

  const verdict = status === 'danger'
    ? lastAlarms.find(a => a.level === 'danger')!.title.toUpperCase()
    : status === 'warn' ? 'Есть отклонения от нормы' : 'Отклонений не выявлено'

  return { rows, evals, alarms, danger: status === 'danger', status, verdict, last: rows[lastIdx], maxRise5, trend }
}

export const fmtPct = (n: number | null | undefined) => (has(n) ? pct(n) : '—')

export function atmoReport(place: string, r: AtmoResult): string {
  const lines = [
    'ТАБЛИЦА ИЗМЕНЕНИЯ СОСТАВА РУДНИЧНОЙ АТМОСФЕРЫ',
    'Устав ВГСЧ, Приложение № 4',
    `Место отбора проб воздуха: ${place || '________________'}`,
    '',
    'Время | CO₂, % | O₂, % | CO, % | H₂, % | CH₄, % | Другие | t, °C',
    ...r.rows.map(x => [x.time, fmtPct(x.co2), fmtPct(x.o2), fmtPct(x.co), fmtPct(x.h2), fmtPct(x.ch4), x.other || '—', fmtPct(x.temp)].join(' | ')),
    '',
    `Вывод: ${r.verdict}`,
    ...r.alarms.map(a => `• ${a.text}`),
  ]
  return lines.join('\n')
}
