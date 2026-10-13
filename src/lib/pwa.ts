import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let deferred: BeforeInstallPromptEvent | null = null;
let offlineReady = typeof localStorage !== 'undefined' && localStorage.getItem('sau-offline-ready') === '1';

const emit = () => listeners.forEach(l => l());

export const isDesktopApp = () =>
  import.meta.env.MODE === 'desktop' || typeof (window as unknown as { electronAPI?: unknown }).electronAPI !== 'undefined' || location.protocol === 'file:';

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const collectUrls = () => {
  const urls = new Set<string>(['/', '/index.html']);
  performance.getEntriesByType('resource').forEach(e => urls.add((e as PerformanceResourceTiming).name));
  document.querySelectorAll<HTMLScriptElement>('script[src]').forEach(s => urls.add(s.src));
  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href], link[rel="modulepreload"][href]').forEach(l => urls.add(l.href));
  return [...urls];
};

export function initPwa() {
  if (isDesktopApp() || !('serviceWorker' in navigator)) return;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });

  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'offline-ready') {
      offlineReady = true;
      localStorage.setItem('sau-offline-ready', '1');
      emit();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(reg => {
      setTimeout(() => reg.active?.postMessage({ type: 'precache', urls: collectUrls() }), 1500);
    }).catch(() => {});
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}

export function usePwa() {
  const [, setTick] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const l = () => setTick(t => t + 1);
    listeners.add(l);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      listeners.delete(l);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const desktop = isDesktopApp();
  return {
    desktop,
    online,
    offlineReady,
    installed: !desktop && isStandalone(),
    canPrompt: !!deferred,
    ios: isIOS(),
  };
}
