/**
 * Давление поворота дыхательного аппарата (ДА)
 * Устав ВГСЧ (приказ МЧС России № 251), п. 22–23.
 *
 *  - резерв в баллоне — 5 МПа (50 кгс/см²), не расходуется;
 *  - рабочий запас = Pmin − 50, где Pmin — минимальное показание манометров в отделении;
 *  - горизонтальные выработки, подъём, спуск до 10° — 1/2 рабочего запаса вперёд;
 *  - спуск по выработкам с углом наклона более 10° — 1/3 вперёд, 2/3 на возвращение;
 *  - при движении на транспорте запас на обратный путь — из расчёта возвращения пешком.
 */

export const DA_RESERVE = 50
export const DA_NOMINAL_PRESSURE = 200
export const DA_NOMINAL_MIN = 240
export const DA_NOMINAL_RATE = DA_NOMINAL_PRESSURE / DA_NOMINAL_MIN

export type DaRoute = 'half' | 'third'

export const DA_ROUTES: Record<DaRoute, { label: string; short: string; share: number; text: string }> = {
  half: {
    label: 'Горизонтально / вверх / вниз до 10°',
    short: '½ вперёд',
    share: 1 / 2,
    text: 'половина рабочего запаса — на передвижение вперёд, половина — на возвращение',
  },
  third: {
    label: 'Вниз под уклон более 10°',
    short: '⅓ вперёд',
    share: 1 / 3,
    text: 'одна треть рабочего запаса — на передвижение вперёд, две трети — на возвращение',
  },
}

export interface DaMember {
  label: string
  pressure: number | null
}

export interface DaControl {
  minutes: number
  current: number
  start?: number | null
  member?: string
}

export interface DaInput {
  members: DaMember[]
  route: DaRoute
  transport: boolean
  entryTime?: string
  control?: DaControl | null
}

export interface DaControlResult {
  member: string
  start: number
  current: number
  minutes: number
  rate: number
  used: number
  mustReturn: boolean
  toTurnMin: number
  returnMin: number
  turnClock: string | null
  exitClock: string | null
  nowClock: string | null
}

export interface DaResult {
  pmin: number
  pminMember: string
  working: number
  share: number
  forwardUse: number
  backUse: number
  turnPressure: number
  estForwardMin: number
  estBackMin: number
  estTurnClock: string | null
  estExitClock: string | null
  control: DaControlResult | null
  danger: boolean
  verdict: string
  advice: string[]
}

export type DaError = { error: string }
export const isDaError = (r: DaResult | DaError): r is DaError => 'error' in r

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')
export function addMin(time: string | undefined, mins: number): string | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time) || !isFinite(mins)) return null
  const [h, m] = time.split(':').map(Number)
  const t = (((h * 60 + m + Math.round(mins)) % 1440) + 1440) % 1440
  return `${pad(t / 60)}:${pad(t % 60)}`
}

export const toMPa = (kgs: number) => kgs / 10

export function calcDa(input: DaInput): DaResult | DaError {
  const valid = input.members.filter(m => m.pressure !== null && isFinite(m.pressure as number)) as { label: string; pressure: number }[]
  if (!valid.length) return { error: 'Введите показания манометров' }
  if (valid.some(m => m.pressure < 0 || m.pressure > 300)) return { error: 'Давление должно быть от 0 до 300 кгс/см²' }

  const minM = valid.reduce((a, b) => (b.pressure < a.pressure ? b : a))
  const pmin = minM.pressure
  if (pmin <= DA_RESERVE) {
    return { error: `Минимальное давление ${pmin} кгс/см² не превышает резерв ${DA_RESERVE} кгс/см² — включение в ДА и выполнение задания недопустимы` }
  }

  const route = DA_ROUTES[input.route]
  const working = pmin - DA_RESERVE
  const forwardUse = working * route.share
  const backUse = working - forwardUse
  const turnPressure = pmin - forwardUse

  const estForwardMin = forwardUse / DA_NOMINAL_RATE
  const estBackMin = backUse / DA_NOMINAL_RATE

  let control: DaControlResult | null = null
  const advice: string[] = []
  const c = input.control
  if (c && isFinite(c.minutes) && c.minutes > 0 && isFinite(c.current)) {
    const start = c.start !== null && c.start !== undefined && isFinite(c.start) ? c.start : pmin
    const used = start - c.current
    const rate = used > 0 ? used / c.minutes : 0
    const mustReturn = c.current <= turnPressure
    const toTurnMin = rate > 0 ? Math.max(0, (c.current - turnPressure) / rate) : Infinity
    const fromP = mustReturn ? c.current : turnPressure
    const returnMin = rate > 0 ? Math.max(0, (fromP - DA_RESERVE) / rate) : Infinity
    const nowClock = addMin(input.entryTime, c.minutes)
    control = {
      member: c.member || 'респираторщик',
      start,
      current: c.current,
      minutes: c.minutes,
      rate,
      used,
      mustReturn,
      toTurnMin,
      returnMin,
      nowClock,
      turnClock: mustReturn ? nowClock : addMin(input.entryTime, c.minutes + toTurnMin),
      exitClock: addMin(input.entryTime, c.minutes + (mustReturn ? 0 : toTurnMin) + returnMin),
    }
    if (c.current <= DA_RESERVE) advice.push('Давление достигло резерва — немедленный выход на ПБ, доклад на КП (Код 2, сообщение 2).')
    if (rate > DA_NOMINAL_RATE * 1.5) advice.push(`Фактический расход ${rate.toFixed(2).replace('.', ',')} кгс/см²/мин заметно выше среднего — уточняйте давление чаще.`)
  }

  if (input.transport) advice.push('Отделение движется на транспорте: запас на обратный путь рассчитан из условия возвращения пешком (п. 22).')
  advice.push(`Контроль ведётся по манометру респираторщика с максимальным расходом дыхательной смеси (п. 23).`)

  const danger = !!control?.mustReturn
  const verdict = danger
    ? `ПОВОРОТ НАЗАД: давление ${control!.current} кгс/см² не выше давления поворота ${round1(turnPressure)} кгс/см²`
    : `Движение вперёд прекращается при давлении ${round1(turnPressure)} кгс/см² (${round1(toMPa(turnPressure))} МПа)`

  return {
    pmin,
    pminMember: minM.label,
    working,
    share: route.share,
    forwardUse,
    backUse,
    turnPressure,
    estForwardMin,
    estBackMin,
    estTurnClock: addMin(input.entryTime, estForwardMin),
    estExitClock: addMin(input.entryTime, estForwardMin + estBackMin),
    control,
    danger,
    verdict,
    advice,
  }
}

export const round1 = (n: number) => Math.round(n * 10) / 10
export const fmt1 = (n: number) => (isFinite(n) ? String(round1(n)).replace('.', ',') : '—')
export const fmtMin = (n: number) => (isFinite(n) ? `${Math.round(n)} мин` : '—')

export function daReport(input: DaInput, r: DaResult): string {
  const lines: (string | null)[] = [
    'РАСЧЁТ ДАВЛЕНИЯ ПОВОРОТА ДЫХАТЕЛЬНОГО АППАРАТА',
    'Устав ВГСЧ, п. 22–23',
    '',
    `Показания манометров: ${input.members.filter(m => m.pressure !== null).map(m => `${m.label} — ${m.pressure}`).join('; ')} кгс/см²`,
    `Минимальное давление: ${r.pmin} кгс/см² (${r.pminMember})`,
    `Резерв: ${DA_RESERVE} кгс/см²; рабочий запас: ${fmt1(r.working)} кгс/см²`,
    `Маршрут: ${DA_ROUTES[input.route].label} — ${DA_ROUTES[input.route].text}`,
    input.transport ? 'Передвижение на транспорте — обратный путь из расчёта пешком' : null,
    `Расход вперёд: ${fmt1(r.forwardUse)} кгс/см²; на возвращение: ${fmt1(r.backUse)} кгс/см²`,
    `ДАВЛЕНИЕ ПОВОРОТА: ${fmt1(r.turnPressure)} кгс/см² (${fmt1(toMPa(r.turnPressure))} МПа)`,
    input.entryTime ? `Включение в ДА: ${input.entryTime}` : null,
  ]
  if (r.control) {
    const c = r.control
    lines.push(
      '',
      `Контроль (${c.member}): через ${c.minutes} мин давление ${c.current} кгс/см² (было ${c.start})`,
      `Фактический расход: ${c.rate.toFixed(2).replace('.', ',')} кгс/см²/мин`,
      c.mustReturn ? 'ТРЕБУЕТСЯ ВОЗВРАЩЕНИЕ' : `До поворота: ${fmtMin(c.toTurnMin)}${c.turnClock ? ` (в ${c.turnClock})` : ''}`,
      `Время на возвращение до резерва: ${fmtMin(c.returnMin)}${c.exitClock ? `, выход не позднее ${c.exitClock}` : ''}`,
    )
  }
  lines.push('', r.verdict)
  return lines.filter(l => l !== null).join('\n')
}
