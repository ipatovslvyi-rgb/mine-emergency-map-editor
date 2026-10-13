import { useSyncExternalStore } from 'react';
import func2url from '../../../backend/func2url.json';
import { OpEvent, OpPayload, OpRole, OpSession } from './types';
import { describePayload } from './describe';

const API = (func2url as Record<string, string>).operations || '';
const LS_SESSION = 'sau-op-session';
const LS_EVENTS = 'sau-op-events';
const POLL_MS = 3000;

interface State {
  session: OpSession | null;
  events: OpEvent[];
  online: boolean;
  syncing: boolean;
  lastSync: string | null;
  error: string | null;
  lastDanger: OpEvent | null;
}

const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};

let state: State = {
  session: read<OpSession | null>(LS_SESSION, null),
  events: read<OpEvent[]>(LS_EVENTS, []),
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  lastSync: null,
  error: null,
  lastDanger: null,
};

const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  if ('session' in patch) localStorage.setItem(LS_SESSION, JSON.stringify(state.session));
  if ('events' in patch) localStorage.setItem(LS_EVENTS, JSON.stringify(state.events));
  listeners.forEach(l => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useOps = () => useSyncExternalStore(subscribe, () => state);
export const getOps = () => state;
export const apiReady = () => !!API;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

async function call<T>(method: 'GET' | 'POST', params: Record<string, string> | null, body?: unknown): Promise<T> {
  if (!API) throw new Error('Сервер связи ещё не подключён');
  const url = params ? `${API}?${new URLSearchParams(params)}` : API;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (state.session?.token) headers['X-Commander-Token'] = state.session.token;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Ошибка ${res.status}`) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return data as T;
  } finally {
    clearTimeout(t);
  }
}

export async function createOperation(title: string) {
  const r = await call<{ code: string; title: string; token: string; active: boolean }>('POST', null, { action: 'create', title });
  set({
    session: { code: r.code, title: r.title, role: 'commander', token: r.token, active: true, joinedAt: new Date().toISOString() },
    events: [],
    error: null,
    lastDanger: null,
  });
  kick();
  return r.code;
}

export async function joinOperation(code: string, role: Exclude<OpRole, 'commander'>) {
  const r = await call<{ code: string; title: string; active: boolean }>('GET', { action: 'info', code });
  set({
    session: { code: r.code, title: r.title, role, active: r.active, joinedAt: new Date().toISOString() },
    events: [],
    error: null,
    lastDanger: null,
  });
  kick();
}

export async function closeOperation() {
  const s = state.session;
  if (!s) return;
  if (s.role === 'commander' && s.token) {
    await flush();
    await call('POST', null, { action: 'close', code: s.code });
  }
  leaveOperation();
}

export function leaveOperation() {
  set({ session: null, events: [], error: null, lastDanger: null, lastSync: null });
}

export function publish(payload: OpPayload) {
  const s = state.session;
  if (!s || s.role !== 'commander') return false;
  const d = describePayload(payload);
  const ev: OpEvent = {
    client_id: uid(),
    kind: payload.type,
    danger: d.danger,
    summary: d.summary,
    payload,
    created_at: new Date().toISOString(),
    sent: false,
  };
  set({ events: [...state.events, ev] });
  flush();
  return true;
}

let flushing = false;
async function flush() {
  const s = state.session;
  if (!s || s.role !== 'commander' || flushing) return;
  const pending = state.events.filter(e => !e.sent);
  if (!pending.length) return;
  flushing = true;
  set({ syncing: true });
  try {
    const r = await call<{ accepted: string[] }>('POST', null, {
      action: 'push',
      code: s.code,
      events: pending.map(({ client_id, kind, danger, summary, payload, created_at }) => ({ client_id, kind, danger, summary, payload, created_at })),
    });
    const ok = new Set(r.accepted);
    set({ events: state.events.map(e => (ok.has(e.client_id) ? { ...e, sent: true } : e)), lastSync: new Date().toISOString(), error: null });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 409 && state.session) set({ session: { ...state.session, active: false } });
    set({ error: err.message });
  } finally {
    flushing = false;
    set({ syncing: false });
  }
}

let polling = false;
async function poll() {
  const s = state.session;
  if (!s || s.role === 'commander' || polling) return;
  polling = true;
  set({ syncing: true });
  try {
    const after = state.events.reduce((m, e) => Math.max(m, e.id || 0), 0);
    const r = await call<{ active: boolean; title: string; events: OpEvent[] }>('GET', { action: 'events', code: s.code, after: String(after) });
    const known = new Set(state.events.map(e => e.client_id));
    const fresh = r.events.filter(e => !known.has(e.client_id)).map(e => ({ ...e, sent: true }));
    const patch: Partial<State> = { lastSync: new Date().toISOString(), error: null };
    if (fresh.length) {
      patch.events = [...state.events, ...fresh];
      const danger = [...fresh].reverse().find(e => e.danger);
      if (danger && after > 0) patch.lastDanger = danger;
      if (after > 0) signal(!!danger);
    }
    if (r.active !== s.active || r.title !== s.title) patch.session = { ...s, active: r.active, title: r.title };
    set(patch);
  } catch (e) {
    set({ error: (e as Error).message });
  } finally {
    polling = false;
    set({ syncing: false });
  }
}

export function dismissDanger() {
  set({ lastDanger: null });
}

let audio: AudioContext | null = null;
function signal(danger: boolean) {
  try {
    navigator.vibrate?.(danger ? [400, 150, 400, 150, 600] : [150]);
    audio = audio || new AudioContext();
    const beeps = danger ? 3 : 1;
    for (let i = 0; i < beeps; i++) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = danger ? 1100 : 750;
      o.type = danger ? 'square' : 'sine';
      g.gain.value = 0.25;
      o.connect(g).connect(audio.destination);
      const t = audio.currentTime + i * 0.35;
      o.start(t);
      o.stop(t + 0.22);
    }
  } catch { /* ignore */ }
}

export function unlockAudio() {
  try {
    audio = audio || new AudioContext();
    audio.resume();
  } catch { /* ignore */ }
}

function kick() {
  if (!state.session) return;
  if (state.session.role === 'commander') flush();
  else poll();
}

let started = false;
export function startOpsSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => { set({ online: true }); kick(); });
  window.addEventListener('offline', () => set({ online: false }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  setInterval(() => {
    if (!state.session || document.hidden) return;
    kick();
  }, POLL_MS);
  kick();
}
