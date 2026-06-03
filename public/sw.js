// PorkChop Service Worker
const PRECACHE = 'porkchop-precache-v4';
const RUNTIME  = 'porkchop-runtime-v4';

const PRECACHE_URLS = [
  '/manifest.json',
  '/logo.png',
  '/offline.html'
];

// Install — precache shell assets and offline fallback
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Activate — purge old caches
self.addEventListener('activate', event => {
  const keep = new Set([PRECACHE, RUNTIME]);
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(names =>
        Promise.all(names.filter(n => !keep.has(n)).map(n => caches.delete(n)))
      )
    ])
  );
});

// Fetch — strategy per request type
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never cache API calls, auth endpoints, or Supabase requests
  if (url.pathname.startsWith('/.netlify/') ||
      url.pathname.startsWith('/auth') ||
      url.pathname.startsWith('/rest/') ||
      url.pathname.includes('supabase')) {
    return;
  }

  // Navigation requests (HTML pages) — network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) — stale-while-revalidate
  if (url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico')) {
    event.respondWith(
      caches.open(RUNTIME).then(cache =>
        cache.match(request).then(cached => {
          const fetched = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Precached assets — cache-first
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
