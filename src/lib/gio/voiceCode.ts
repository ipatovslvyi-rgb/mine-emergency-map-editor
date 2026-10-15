import { calcZVT, isZvtError, ZvtResult } from './zvt-calc';
import { GASES, calcGasZone, calcVgschTriangle } from './explosion-triangle-calc';
import type { OpPayload } from '@/lib/ops/types';
import { calcDa, DaInput, isDaError } from './da-calc';
import { ATMO_DEFAULT_LIMITS, AtmoRow, calcAtmo } from './atmo-calc';
import { BELT_DEFAULTS, BeltInputs, calcBeltFire, calcMachineFire, MACHINE_PRESETS, machineMaterials, Material } from './fire-load-calc';

const GAS_LETTERS: Record<string, string> = {
  methane: 'М',
  hydrogen: 'В',
  co: 'У',
  ethane: 'Э',
  propane: 'П',
  acetylene: 'А',
};

const GAS_BY_LETTER: Record<string, string> = Object.fromEntries(Object.entries(GAS_LETTERS).map(([k, v]) => [v, k]));

const LATIN_TO_CYR: Record<string, string> = {
  T: 'Т', G: 'Г', Z: 'З', L: 'Л', D: 'Д', X: 'Х', M: 'М', V: 'В', B: 'В', U: 'У', Y: 'У', E: 'Э', P: 'П', A: 'А', N: 'Н', H: 'Н', S: 'С', C: 'С',
};

const num = (n: number) => {
  const abs = Math.abs(Number(n.toPrecision(6)));
  const s = String(abs).replace('.', ',');
  return n < 0 ? `м${s}` : s;
};

export function encodeVgsch(i: { ch4: number; co: number; h2: number; o2: number }) {
  return `Т-${num(i.ch4)}-${num(i.co)}-${num(i.h2)}-${num(i.o2)}`;
}

export function encodeGas(gasKey: string, gasPct: number, o2: number) {
  return `Г-${GAS_LETTERS[gasKey] ?? '?'}-${num(gasPct)}-${num(o2)}`;
}

export function encodeZvt(r: Pick<ZvtResult, 'entryTime' | 'temp' | 'mode' | 'rescue'>) {
  return `З-${r.entryTime.replace(':', '')}-${num(r.temp)}-${r.mode === 'moving' ? 'П' : 'Н'}${r.rescue ? '-С' : ''}`;
}

const sameMat = (a: Material, b: Material) =>
  a.name === b.name && a.density === b.density && a.burnRate === b.burnRate && a.heatValue === b.heatValue;

const STD_MATS = machineMaterials({ name: '', type: '', capacity: '', rubber: 0, diesel: 0, oil: 0 });

export function encodeMachine(name: string, mats: Material[], flow: number): string | null {
  const idx = MACHINE_PRESETS.findIndex(m => m.name === name);
  if (idx >= 0) {
    const ref = machineMaterials(MACHINE_PRESETS[idx]);
    if (mats.length === ref.length && mats.every((m, i) => sameMat(m, ref[i]) && m.mass === ref[i].mass)) {
      return `ПТ-${idx + 1}-${num(flow)}`;
    }
  }
  if (mats.length !== 3 || !mats.every((m, i) => sameMat(m, STD_MATS[i]))) return null;
  return `ПТ-${mats.map(m => num(m.mass)).join('-')}-${num(flow)}`;
}

export function encodeBelt(i: BeltInputs): string {
  const d = BELT_DEFAULTS;
  const short = i.thickness === d.thickness && i.density === d.density && i.burnRate === d.burnRate && i.flameSpeed === d.flameSpeed;
  const base = `Л-${num(i.length)}-${num(i.width)}-${num(i.flowM3s)}`;
  return short ? base : `${base}-${num(i.thickness)}-${num(i.density)}-${num(i.burnRate)}-${num(i.flameSpeed)}`;
}

const hhmm = (t?: string) => (t && /^\d{1,2}:\d{2}$/.test(t) ? t.replace(':', '').padStart(4, '0') : null);

export function encodeDa(i: DaInput): string | null {
  const ps = i.members.map(m => m.pressure).filter((v): v is number => v !== null && isFinite(v));
  if (!ps.length) return null;
  const parts = ['Д', num(Math.min(...ps)), i.route === 'third' ? '3' : '2'];
  const t = hhmm(i.entryTime);
  if (t) {
    parts.push(t);
    if (i.control && isFinite(i.control.minutes) && i.control.minutes > 0 && isFinite(i.control.current)) {
      parts.push(num(i.control.minutes), num(i.control.current));
    }
  }
  if (i.transport) parts.push('Т');
  return parts.join('-');
}

const optNum = (v: number | null | undefined) => (v === null || v === undefined || !isFinite(v) ? 'Х' : num(v));

export function encodeAtmo(rows: AtmoRow[], rise5?: number | null): string | null {
  const last = rows[rows.length - 1];
  const t = hhmm(last?.time);
  if (!t) return null;
  const parts = ['А', t, optNum(last.o2), optNum(last.co), optNum(last.ch4), optNum(last.temp)];
  if (rise5 !== null && rise5 !== undefined && isFinite(rise5) && rise5 > 0) parts.push(num(Math.round(rise5 * 10) / 10));
  return parts.join('-');
}

export function encodePayload(p: OpPayload): string | null {
  if (p.type === 'da') return encodeDa(p.input);
  if (p.type === 'atmo') {
    const r = calcAtmo(p.rows, p.limits, p.rise5);
    const lastRise = r ? r.evals[r.evals.length - 1].rise5 : null;
    return encodeAtmo(p.rows, lastRise);
  }
  if (p.type === 'zvt') return encodeZvt(p.result);
  if (p.type === 'vgsch') return encodeVgsch(p.input);
  if (p.type === 'machine') return encodeMachine(p.name, p.materials, p.flow);
  if (p.type === 'belt') return encodeBelt(p.input);
  return encodeGas(p.result.gas.key, p.result.gasPct, p.result.o2Pct);
}

const SPOKEN: Record<string, string> = {
  Т: 'Тэ (треугольник)',
  Г: 'Гэ (газ)',
  З: 'Зэ (ЗВТ)',
  ПТ: 'Пэ-Тэ (пожар техники)',
  Л: 'Эл (лента)',
  Д: 'Дэ (давление ДА)',
  А: 'А (атмосфера)',
  П: 'передвижение',
  Н: 'на месте',
  С: 'спасение',
};
const GAS_SPOKEN: Record<string, string> = {
  М: 'метан', В: 'водород', У: 'угарный газ', Э: 'этан', П: 'пропан', А: 'ацетилен',
};

export function spokenCode(code: string) {
  const t = code.split('-');
  const kind = t[0];
  return t.map((tok, i) => {
    if (i === 0) return SPOKEN[tok] ?? tok;
    if (kind === 'Г' && i === 1) return GAS_SPOKEN[tok] ?? tok;
    if (kind === 'З' && i === 1 && /^\d{3,4}$/.test(tok)) {
      const p = tok.padStart(4, '0');
      return `${p.slice(0, 2)} ${p.slice(2)}`;
    }
    if (kind === 'ПТ' && i === 1 && t.length === 3) {
      const m = MACHINE_PRESETS[+tok - 1];
      return m ? `номер ${tok} (${m.name})` : tok;
    }
    if (kind === 'Д') {
      if (i === 2) return tok === '3' ? 'треть' : 'половина';
      if (i === 3 && /^\d{4}$/.test(tok)) return `${tok.slice(0, 2)} ${tok.slice(2)}`;
      if (tok === 'Т') return 'транспорт';
    }
    if (kind === 'А') {
      if (i === 1) return `${tok.slice(0, 2)} ${tok.slice(2)}`;
      if (tok === 'Х') return 'нет';
      if (i === 6) return `рост ${tok.replace(',', ' запятая ')}`;
    }
    if (kind !== 'ПТ' && kind !== 'Л' && kind !== 'Д' && kind !== 'А' && /^[ПНС]$/.test(tok)) return SPOKEN[tok];
    return tok.replace(/^м/, 'минус ').replace(',', ' запятая ');
  }).join(' — ');
}

export type DecodeResult = { ok: true; payload: OpPayload; code: string } | { ok: false; error: string };

const parseNum = (s: string): number => {
  const neg = /^[мМM]/.test(s) || s.startsWith('−');
  const v = parseFloat(s.replace(/^[мМM−]/, '').replace(',', '.'));
  if (!/^[мМM−]?\d+([.,]\d+)?$/.test(s) || isNaN(v)) return NaN;
  return neg ? -v : v;
};

export function decodeVoiceCode(raw: string): DecodeResult {
  const norm = raw.trim().toUpperCase().replace(/[A-Z]/g, ch => LATIN_TO_CYR[ch] ?? ch).replace(/М(?=\d)/g, 'м');
  const tokens = norm.split(/[\s\-–—/]+/).filter(Boolean);
  if (!tokens.length) return { ok: false, error: 'Введите код' };
  const [kind, ...rest] = tokens;

  if (kind === 'Т') {
    if (rest.length !== 4) return { ok: false, error: 'Код треугольника: Т-CH₄-CO-H₂-O₂, например Т-8-1-0,5-12' };
    const [ch4, co, h2, o2] = rest.map(parseNum);
    if ([ch4, co, h2, o2].some(v => isNaN(v) || v < 0 || v > 100)) return { ok: false, error: 'Концентрации должны быть числами от 0 до 100' };
    const input = { ch4, co, h2, o2 };
    const result = calcVgschTriangle(input);
    if (!result) return { ok: false, error: 'Сумма горючих газов равна нулю' };
    return { ok: true, payload: { type: 'vgsch', input, result, meta: {} }, code: encodeVgsch(input) };
  }

  if (kind === 'Г') {
    if (rest.length !== 3) return { ok: false, error: 'Код газа: Г-буква газа-концентрация-O₂, например Г-М-7-19' };
    const gasKey = GAS_BY_LETTER[rest[0].replace('м', 'М')];
    if (!gasKey) return { ok: false, error: 'Буква газа: М — метан, В — водород, У — угарный газ, Э — этан, П — пропан, А — ацетилен' };
    const [g, o2] = rest.slice(1).map(parseNum);
    if ([g, o2].some(v => isNaN(v) || v < 0 || v > 100)) return { ok: false, error: 'Концентрации должны быть числами от 0 до 100' };
    const result = calcGasZone(gasKey, g, o2);
    if (!result) return { ok: false, error: 'Не удалось выполнить расчёт' };
    return { ok: true, payload: { type: 'gas', result, meta: {} }, code: encodeGas(gasKey, g, o2) };
  }

  if (kind === 'З') {
    if (rest.length < 3 || rest.length > 4) return { ok: false, error: 'Код ЗВТ: З-ЧЧММ-температура-П/Н[-С], например З-1430-35-П' };
    const digits = rest[0].replace(/[:.,]/g, '');
    if (!/^\d{3,4}$/.test(digits)) return { ok: false, error: 'Время входа — 4 цифры, например 1430' };
    const hhmm = digits.padStart(4, '0');
    const h = +hhmm.slice(0, 2), m = +hhmm.slice(2);
    if (h > 23 || m > 59) return { ok: false, error: 'Неверное время входа' };
    const temp = parseNum(rest[1]);
    if (isNaN(temp)) return { ok: false, error: 'Температура должна быть числом' };
    const modeTok = rest[2];
    if (modeTok !== 'П' && modeTok !== 'Н') return { ok: false, error: 'Режим: П — передвижение, Н — на месте' };
    if (rest[3] && rest[3] !== 'С') return { ok: false, error: 'Последняя буква может быть только С — спасение людей' };
    const entryTime = `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`;
    const mode = modeTok === 'П' ? 'moving' : 'stationary';
    const rescue = rest[3] === 'С';
    const r = calcZVT(entryTime, temp, mode, rescue);
    if (isZvtError(r)) return { ok: false, error: r.message };
    return { ok: true, payload: { type: 'zvt', result: r, meta: {} }, code: encodeZvt(r) };
  }

  if (kind === 'ПТ') {
    const n = rest.map(parseNum);
    if (n.some(v => isNaN(v) || v < 0)) return { ok: false, error: 'В коде техники только неотрицательные числа' };
    let name: string;
    let materials: Material[];
    let flow: number;
    if (rest.length === 2) {
      const preset = MACHINE_PRESETS[n[0] - 1];
      if (!preset || !Number.isInteger(n[0])) return { ok: false, error: `Номер техники — от 1 до ${MACHINE_PRESETS.length}` };
      name = preset.name;
      materials = machineMaterials(preset);
      flow = n[1];
    } else if (rest.length === 4) {
      name = 'Техника (по голосовому коду)';
      materials = STD_MATS.map((m, i) => ({ ...m, mass: n[i] })).filter(m => m.mass > 0);
      flow = n[3];
    } else {
      return { ok: false, error: 'Код техники: ПТ-номер-расход (ПТ-1-39,6) или ПТ-резина-дизель-масло-расход (ПТ-780-260-160-39,6)' };
    }
    const r = calcMachineFire(materials, flow);
    if (!r || r.powerMW <= 0) return { ok: false, error: 'Нет горючих материалов для расчёта' };
    const payload: OpPayload = { type: 'machine', name, materials, flow, meta: {} };
    return { ok: true, payload, code: encodeMachine(name, materials, flow) ?? raw };
  }

  if (kind === 'Л') {
    if (rest.length !== 3 && rest.length !== 7) {
      return { ok: false, error: 'Код ленты: Л-длина-ширина-расход (Л-640-0,8-12) или полный: …-толщина-плотность-ψ-скорость пламени' };
    }
    const n = rest.map(parseNum);
    if (n.some(v => isNaN(v) || v < 0)) return { ok: false, error: 'В коде ленты только неотрицательные числа' };
    const input: BeltInputs = {
      ...BELT_DEFAULTS,
      length: n[0], width: n[1], flowM3s: n[2],
      ...(rest.length === 7 ? { thickness: n[3], density: n[4], burnRate: n[5], flameSpeed: n[6] } : {}),
      airSpeed: undefined,
    };
    if (!calcBeltFire(input)) return { ok: false, error: 'Параметры ленты должны быть больше нуля' };
    return { ok: true, payload: { type: 'belt', input, meta: {} }, code: encodeBelt(input) };
  }

  if (kind === 'Д') {
    const transport = rest[rest.length - 1] === 'Т';
    const r0 = transport ? rest.slice(0, -1) : rest;
    if (![2, 3, 5].includes(r0.length)) {
      return { ok: false, error: 'Код ДА: Д-давление-2/3[-ЧЧММ][-минуты-давление сейчас][-Т], например Д-190-2-1400-20-170' };
    }
    const pmin = parseNum(r0[0]);
    if (isNaN(pmin) || pmin <= 0) return { ok: false, error: 'Минимальное давление — число, кгс/см²' };
    if (r0[1] !== '2' && r0[1] !== '3') return { ok: false, error: 'Вторая цифра: 2 — половина запаса вперёд, 3 — треть (спуск более 10°)' };
    let entryTime: string | undefined;
    if (r0.length >= 3) {
      const d = r0[2].replace(/[:.,]/g, '');
      if (!/^\d{3,4}$/.test(d)) return { ok: false, error: 'Время включения — 4 цифры, например 1400' };
      const p = d.padStart(4, '0');
      if (+p.slice(0, 2) > 23 || +p.slice(2) > 59) return { ok: false, error: 'Неверное время включения' };
      entryTime = `${p.slice(0, 2)}:${p.slice(2)}`;
    }
    let control: DaInput['control'] = null;
    if (r0.length === 5) {
      const minutes = parseNum(r0[3]), current = parseNum(r0[4]);
      if (isNaN(minutes) || isNaN(current) || minutes <= 0) return { ok: false, error: 'Контроль: минуты с включения и текущее давление' };
      control = { minutes, current, start: pmin };
    }
    const input: DaInput = { members: [{ label: 'мин. манометр', pressure: pmin }], route: r0[1] === '3' ? 'third' : 'half', transport, entryTime, control };
    const r = calcDa(input);
    if (isDaError(r)) return { ok: false, error: r.error };
    return { ok: true, payload: { type: 'da', input, meta: {} }, code: encodeDa(input) ?? raw };
  }

  if (kind === 'А') {
    if (rest.length !== 5 && rest.length !== 6) {
      return { ok: false, error: 'Код атмосферы: А-ЧЧММ-O₂-CO-CH₄-t[-рост t за 5 мин], нет замера — Х. Пример: А-1408-19,5-0,006-1,2-29,5-3,5' };
    }
    const d = rest[0].replace(/[:.,]/g, '');
    if (!/^\d{3,4}$/.test(d)) return { ok: false, error: 'Время замера — 4 цифры, например 1408' };
    const p = d.padStart(4, '0');
    if (+p.slice(0, 2) > 23 || +p.slice(2) > 59) return { ok: false, error: 'Неверное время замера' };
    const vals = rest.slice(1, 5).map(t => (t === 'Х' || t === 'X' ? null : parseNum(t)));
    if (vals.some(v => v !== null && isNaN(v))) return { ok: false, error: 'Значения — числа, нет замера — буква Х' };
    const [o2, co, ch4, temp] = vals;
    if ([o2, co, ch4].some(v => v !== null && (v < 0 || v > 100))) return { ok: false, error: 'Концентрации — от 0 до 100%' };
    const rise5 = rest[5] ? parseNum(rest[5]) : null;
    if (rise5 !== null && isNaN(rise5)) return { ok: false, error: 'Рост температуры — число, °C за 5 мин' };
    const rows: AtmoRow[] = [{ time: `${p.slice(0, 2)}:${p.slice(2)}`, o2, co, ch4, temp }];
    return { ok: true, payload: { type: 'atmo', rows, limits: ATMO_DEFAULT_LIMITS, rise5, meta: {} }, code: encodeAtmo(rows, rise5) ?? raw };
  }

  return { ok: false, error: 'Код должен начинаться с Т, Г, З, ПТ, Л, Д (давление ДА) или А (атмосфера)' };
}

export const VOICE_FORMATS = [
  { code: 'Т-8-1-0,5-12', desc: 'Треугольник: CH₄ – CO – H₂ – O₂, %' },
  { code: 'Г-М-7-19', desc: 'Один газ: буква газа – концентрация – O₂, %' },
  { code: 'З-1430-35-П', desc: 'ЗВТ: время входа – температура – П (передвижение) / Н (на месте), в конце -С при спасении людей' },
  { code: 'ПТ-1-39,6', desc: 'Пожар техники: номер в справочнике – расход воздуха, м³/с (или ПТ-резина-дизель-масло-расход, кг)' },
  { code: 'Л-640-0,8-12', desc: 'Пожар ленты: длина, м – ширина, м – расход воздуха, м³/с' },
  { code: 'Д-190-2-1400-20-170', desc: 'Давление ДА: мин. давление – 2 (½ вперёд) / 3 (⅓, спуск >10°) – время включения – минут прошло – давление сейчас; -Т на транспорте' },
  { code: 'А-1408-19,5-0,006-1,2-29,5', desc: 'Атмосфера: время – O₂ – CO – CH₄, % – t, °C – [рост t за 5 мин]; нет замера — Х' },
];

export const GAS_LETTER_HINT = GASES.map(g => `${GAS_LETTERS[g.key]} — ${g.name.toLowerCase()}`).join(', ');
