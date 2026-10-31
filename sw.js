/* ==========================================================================
   Tsuki — Service Worker (PWA hors-ligne)
   ========================================================================== */
const CACHE_NAME = 'tsuki-v2';
const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './scripts/config.js',
  './scripts/storage.js',
  './scripts/cache.js',
  './scripts/api/anilist.js',
  './scripts/api/frembed.js',
  './scripts/api/animedoc.js',
  './scripts/router.js',
  './scripts/ui.js',
  './scripts/app.js',
  './scripts/demo.js',
  './scripts/pages/home.js',
  './scripts/pages/discover.js',
  './scripts/pages/search.js',
  './scripts/pages/detail.js',
  './scripts/pages/player.js',
  './scripts/pages/favorites.js',
  './scripts/pages/settings.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  'https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        return response;
      }).catch(() => cached);
    })
  );
});
