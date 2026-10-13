import { calcZVT, isZvtError, ZvtResult } from './zvt-calc';
import { GASES, calcGasZone, calcVgschTriangle } from './explosion-triangle-calc';
import type { OpPayload } from '@/lib/ops/types';

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
  T: 'Т', G: 'Г', Z: 'З', M: 'М', V: 'В', B: 'В', U: 'У', Y: 'У', E: 'Э', P: 'П', A: 'А', N: 'Н', H: 'Н', S: 'С', C: 'С',
};

const num = (n: number) => {
  const abs = Math.abs(Math.round(n * 100) / 100);
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

export function encodePayload(p: OpPayload) {
  if (p.type === 'zvt') return encodeZvt(p.result);
  if (p.type === 'vgsch') return encodeVgsch(p.input);
  return encodeGas(p.result.gas.key, p.result.gasPct, p.result.o2Pct);
}

const SPOKEN: Record<string, string> = {
  Т: 'Тэ (треугольник)',
  Г: 'Гэ (газ)',
  З: 'Зэ (ЗВТ)',
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
    if (/^[ПНС]$/.test(tok)) return SPOKEN[tok];
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

  return { ok: false, error: 'Код должен начинаться с буквы Т (треугольник), Г (газ) или З (ЗВТ)' };
}

export const VOICE_FORMATS = [
  { code: 'Т-8-1-0,5-12', desc: 'Треугольник: CH₄ – CO – H₂ – O₂, %' },
  { code: 'Г-М-7-19', desc: 'Один газ: буква газа – концентрация – O₂, %' },
  { code: 'З-1430-35-П', desc: 'ЗВТ: время входа – температура – П (передвижение) / Н (на месте), в конце -С при спасении людей' },
];

export const GAS_LETTER_HINT = GASES.map(g => `${GAS_LETTERS[g.key]} — ${g.name.toLowerCase()}`).join(', ');
