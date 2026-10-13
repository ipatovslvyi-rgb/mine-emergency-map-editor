const CACHE = 'sau-v2';
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/logo.svg', '/icon-192.png', '/icon-512.png'];
const TIMEOUT = 3500;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const cacheable = url => {
  const u = new URL(url);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  if (u.hostname === 'functions.poehali.dev') return false;
  if (u.hostname.includes('yandex')) return false;
  if (u.origin === self.location.origin) return true;
  return ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.poehali.dev'].includes(u.hostname);
};

const put = async (req, res) => {
  if (!res || !(res.ok || res.type === 'opaque')) return;
  const c = await caches.open(CACHE);
  await c.put(req, res);
};

const withTimeout = (p, ms) => new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('timeout')), ms);
  p.then(r => { clearTimeout(t); resolve(r); }, err => { clearTimeout(t); reject(err); });
});

self.addEventListener('message', e => {
  if (e.data?.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  const urls = e.data.urls.filter(cacheable);
  e.waitUntil(caches.open(CACHE).then(async c => {
    for (const url of urls) {
      if (await c.match(url)) continue;
      try {
        const sameOrigin = new URL(url).origin === self.location.origin;
        const res = await fetch(url, sameOrigin ? {} : { mode: 'no-cors' });
        await put(url, res);
      } catch { /* skip */ }
    }
    const all = await self.clients.matchAll();
    all.forEach(cl => cl.postMessage({ type: 'offline-ready' }));
  }));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !cacheable(req.url)) return;

  const url = new URL(req.url);
  const immutable = url.origin === self.location.origin && url.pathname.startsWith('/assets/');
  const isFont = url.hostname === 'fonts.gstatic.com';

  if (immutable || isFont) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { put(req, res.clone()); return res; })));
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith(
      withTimeout(fetch(req), TIMEOUT)
        .then(res => { put('/index.html', res.clone()); return res; })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/')) || Response.error())
    );
    return;
  }

  e.respondWith(
    withTimeout(fetch(req), TIMEOUT)
      .then(res => { put(req, res.clone()); return res; })
      .catch(async () => (await caches.match(req)) || Response.error())
  );
});
