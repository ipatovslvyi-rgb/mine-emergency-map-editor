/**
 * Удержание экрана включённым (пока работает таймер командира).
 * 1) Screen Wake Lock API — Chrome/Android, Safari iOS 16.4+, десктоп.
 * 2) Запасной вариант для старых браузеров — беззвучное зацикленное видео.
 * Браузер снимает блокировку при сворачивании — восстанавливаем при возврате.
 */
import { useSyncExternalStore } from 'react';

type Mode = 'off' | 'native' | 'video' | 'failed';

const VIDEO_SRC = 'data:video/mp4;base64,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';

let wanted = false;
let mode: Mode = 'off';
let sentinel: WakeLockSentinel | null = null;
let video: HTMLVideoElement | null = null;
const listeners = new Set<() => void>();

const setMode = (m: Mode) => {
  if (mode === m) return;
  mode = m;
  listeners.forEach(l => l());
};

export const wakeLockSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

async function tryNative(): Promise<boolean> {
  if (!wakeLockSupported()) return false;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
      if (wanted && !document.hidden) acquire();
      else if (!wanted) setMode('off');
    });
    setMode('native');
    return true;
  } catch {
    return false;
  }
}

async function tryVideo(): Promise<boolean> {
  try {
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.muted = true;
      video.loop = true;
      video.src = VIDEO_SRC;
      Object.assign(video.style, { position: 'fixed', width: '1px', height: '1px', opacity: '0.01', pointerEvents: 'none', left: '0', bottom: '0' });
      document.body.appendChild(video);
    }
    await video.play();
    setMode('video');
    return true;
  } catch {
    return false;
  }
}

async function acquire() {
  if (!wanted || typeof document === 'undefined' || document.hidden) return;
  if (sentinel) return setMode('native');
  if (await tryNative()) return;
  if (await tryVideo()) return;
  setMode('failed');
}

function release() {
  sentinel?.release().catch(() => {});
  sentinel = null;
  if (video) {
    video.pause();
    video.remove();
    video = null;
  }
  setMode('off');
}

let bound = false;
function bind() {
  if (bound || typeof document === 'undefined') return;
  bound = true;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) acquire(); });
  const retry = () => { if (wanted && (mode === 'failed' || mode === 'off')) acquire(); };
  window.addEventListener('pointerdown', retry, { passive: true });
}

/** Включить/выключить удержание экрана. Вызывать лучше из обработчика нажатия. */
export function keepAwake(on: boolean) {
  bind();
  if (on === wanted && (on ? mode !== 'off' && mode !== 'failed' : mode === 'off')) return;
  wanted = on;
  if (on) acquire();
  else release();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useWakeLockMode = () => useSyncExternalStore(subscribe, () => mode, () => 'off' as Mode);
