import { useSyncExternalStore } from 'react';
import { calcDa, DaInput, DaRoute, isDaError } from './da-calc';
import { playSignal } from '@/lib/ops/store';
import { keepAwake } from '@/lib/wakeLock';

export interface DaReading {
  at: number;
  pressure: number;
}

export interface DaTimerState {
  running: boolean;
  startedAt: number;
  pmin: number;
  route: DaRoute;
  transport: boolean;
  intervalMin: number;
  warnMin: number;
  readings: DaReading[];
  lastRemindAt: number;
  warned: boolean;
  turned: boolean;
  returning: boolean;
  returnAt: number | null;
  member: string;
}

export type DaTimerAlert = { kind: 'remind' | 'warn' | 'turn' | 'reserve'; at: number } | null;

const LS = 'sau-da-timer';

let state: DaTimerState | null = load();
let alert: DaTimerAlert = null;
let now = Date.now();
const listeners = new Set<() => void>();
let snap: { state: DaTimerState | null; alert: DaTimerAlert; now: number } = { state, alert, now };

function load(): DaTimerState | null {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    return s && s.running ? s : null;
  } catch {
    return null;
  }
}

function emit() {
  snap = { state, alert, now };
  keepAwake(!!state);
  if (state) localStorage.setItem(LS, JSON.stringify(state));
  else localStorage.removeItem(LS);
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDaTimer = () => useSyncExternalStore(subscribe, () => snap);

const hhmm = (t: number) => new Date(t).toTimeString().slice(0, 5);

/** Вход для расчёта давления поворота на основе таймера */
export function timerInput(s: DaTimerState): DaInput {
  const last = s.readings[s.readings.length - 1];
  const minutes = last ? (last.at - s.startedAt) / 60000 : 0;
  return {
    members: [{ label: s.member || 'мин. манометр', pressure: s.pmin }],
    route: s.route,
    transport: s.transport,
    entryTime: hhmm(s.startedAt),
    control: last && minutes > 0 ? { minutes: Math.round(minutes * 10) / 10, current: last.pressure, start: s.pmin, member: s.member || undefined } : null,
  };
}

export interface DaTimerCalc {
  turnPressure: number;
  turnAt: number;
  exitAt: number;
  rate: number;
  rateKnown: boolean;
  nextRemindAt: number;
  current: number;
  estNow: number;
  mustReturn: boolean;
}

/** Прогноз по таймеру: время поворота и выхода по фактическому (или среднему) расходу */
export function timerCalc(s: DaTimerState, at = Date.now()): DaTimerCalc | null {
  const r = calcDa(timerInput(s));
  if (isDaError(r)) return null;
  const last = s.readings[s.readings.length - 1];
  const rateKnown = !!(r.control && r.control.rate > 0);
  const rate = rateKnown ? r.control!.rate : r.forwardUse / r.estForwardMin;
  const base = last ?? { at: s.startedAt, pressure: s.pmin };
  const minsFromBase = (at - base.at) / 60000;
  const estNow = Math.max(0, base.pressure - rate * minsFromBase);
  const turnAt = base.pressure <= r.turnPressure ? base.at : base.at + ((base.pressure - r.turnPressure) / rate) * 60000;
  const exitFrom = s.returning && s.returnAt ? s.returnAt : turnAt;
  const pAtExitFrom = s.returning && s.returnAt ? Math.max(0, base.pressure - rate * ((s.returnAt - base.at) / 60000)) : Math.min(base.pressure, r.turnPressure);
  const exitAt = exitFrom + (Math.max(0, pAtExitFrom - 50) / rate) * 60000;
  const nextRemindAt = Math.max(s.lastRemindAt, last?.at ?? s.startedAt) + s.intervalMin * 60000;
  return {
    turnPressure: r.turnPressure,
    turnAt,
    exitAt,
    rate,
    rateKnown,
    nextRemindAt,
    current: base.pressure,
    estNow,
    mustReturn: !!r.control?.mustReturn,
  };
}

export function startTimer(p: { pmin: number; route: DaRoute; transport: boolean; intervalMin: number; warnMin: number; member?: string; startedAt?: number }) {
  const startedAt = p.startedAt ?? Date.now();
  state = {
    running: true,
    startedAt,
    pmin: p.pmin,
    route: p.route,
    transport: p.transport,
    intervalMin: p.intervalMin,
    warnMin: p.warnMin,
    readings: [],
    lastRemindAt: startedAt,
    warned: false,
    turned: false,
    returning: false,
    returnAt: null,
    member: p.member || '',
  };
  alert = null;
  ensureTick();
  emit();
}

export function addReading(pressure: number) {
  if (!state) return;
  const at = Date.now();
  state = { ...state, readings: [...state.readings, { at, pressure }], lastRemindAt: at };
  if (alert?.kind === 'remind') alert = null;
  const c = timerCalc(state, at);
  if (c && !c.mustReturn && c.turnAt - at > state.warnMin * 60000) state.warned = false;
  if (c && !c.mustReturn && state.turned && !state.returning) state.turned = false;
  if (pressure <= 50) {
    alert = { kind: 'reserve', at };
    playSignal(true);
  } else if (c?.mustReturn && !state.turned) {
    state.turned = true;
    alert = { kind: 'turn', at };
    playSignal(true);
  }
  emit();
}

export function updateTimer(patch: Partial<Pick<DaTimerState, 'intervalMin' | 'warnMin'>>) {
  if (!state) return;
  state = { ...state, ...patch };
  emit();
}

export function markReturning() {
  if (!state) return;
  state = { ...state, returning: true, returnAt: Date.now(), turned: true, warned: true };
  alert = null;
  emit();
}

export function dismissAlert() {
  if (!state) return;
  if (alert?.kind === 'remind') state = { ...state, lastRemindAt: Date.now() };
  alert = null;
  emit();
}

export function stopTimer() {
  state = null;
  alert = null;
  emit();
}

function vibrateRemind() {
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch { /* ignore */ }
}

function tick() {
  now = Date.now();
  if (!state) {
    snap = { state, alert, now };
    listeners.forEach(l => l());
    return;
  }
  const c = timerCalc(state, now);
  let changed = false;
  if (c) {
    if (!state.returning && !state.turned && now >= c.turnAt) {
      state = { ...state, turned: true, warned: true };
      alert = { kind: 'turn', at: now };
      playSignal(true);
      changed = true;
    } else if (!state.returning && !state.warned && now >= c.turnAt - state.warnMin * 60000) {
      state = { ...state, warned: true };
      alert = { kind: 'warn', at: now };
      playSignal(true);
      changed = true;
    } else if (now >= c.nextRemindAt && (!alert || alert.kind === 'remind')) {
      state = { ...state, lastRemindAt: now };
      alert = { kind: 'remind', at: now };
      playSignal(false);
      vibrateRemind();
      changed = true;
    }
  }
  if (changed) emit();
  else {
    snap = { state, alert, now };
    listeners.forEach(l => l());
  }
}

let ticking = false;
function ensureTick() {
  if (ticking || typeof window === 'undefined') return;
  ticking = true;
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}

if (state) {
  ensureTick();
  keepAwake(true);
}

export const fmtClock = (t: number) => hhmm(t);
export function fmtLeft(ms: number) {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const body = h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  return neg ? `−${body}` : body;
}
