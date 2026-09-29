const CACHE_NAME = 'triptalk-shell-v10';
const SCOPE = self.registration.scope;
const SHELL_PATHS = [
  'index.html',
  'styles.css',
  'content.js',
  'ui-copy.js',
  'app.js',
  'lucide.min.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png'
];
const SHELL_URLS = SHELL_PATHS.map(path => new URL(path, SCOPE).href);

async function isReady() {
  const cache = await caches.open(CACHE_NAME);
  const matches = await Promise.all(SHELL_URLS.map(url => cache.match(url)));
  return matches.every(Boolean);
}

async function cacheShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(SHELL_URLS);
  return isReady();
}

self.addEventListener('install', event => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith('triptalk-shell-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const port = event.ports && event.ports[0];
  if (!port) return;

  if (event.data && event.data.type === 'CACHE_STATUS') {
    event.waitUntil(isReady()
      .then(ready => port.postMessage({ ready }))
      .catch(() => port.postMessage({ ready: false })));
  }

  if (event.data && event.data.type === 'CACHE_OFFLINE') {
    event.waitUntil(cacheShell()
      .then(ok => port.postMessage({ ok }))
      .catch(async error => {
        if (await isReady().catch(() => false)) {
          port.postMessage({ ok: true });
        } else {
          port.postMessage({ ok: false, error: String(error && error.message || error) });
        }
      }));
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const fallback = await cache.match(new URL('index.html', SCOPE).href);
      return fallback || Response.error();
    }));
    return;
  }

  if (SHELL_URLS.includes(url.href)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache =>
      (await cache.match(request)) || fetch(request)));
  }
});
