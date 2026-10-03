// MARQUEE Service Worker (sw.js)
// Precaches App Shell with versioned cache, excludes audio streams & auth, SWR for catalog & lyrics

const CACHE_VERSION = 'marquee-shell-v1';
const CATALOG_CACHE = 'marquee-catalog-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] App shell precache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION && key !== CATALOG_CACHE) {
            console.log('[ServiceWorker] Deleting legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never cache non-GET requests
  if (req.method !== 'GET') return;

  // 2. EXPLICITLY BYPASS AUDIO STREAMS & MEDIA CHUNKS
  // Audio playback must never be intercepted or stored in full shell cache
  if (
    req.destination === 'audio' ||
    req.destination === 'video' ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.aac') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('ytimg.com') ||
    url.hostname.includes('apple.com/apple-assets') ||
    url.hostname.includes('lrclib.net')
  ) {
    return; // Pass through directly to browser network
  }

  // 3. EXPLICITLY BYPASS AUTH & FRESH USER APIS
  if (
    url.pathname.includes('/auth') ||
    url.pathname.includes('/login') ||
    url.pathname.includes('/user') ||
    url.pathname.includes('/api/session')
  ) {
    return;
  }

  // 4. STALE-WHILE-REVALIDATE FOR CATALOG & LYRICS APIS
  if (
    url.hostname.includes('itunes.apple.com') ||
    url.pathname.includes('/lyrics') ||
    url.pathname.includes('lrclib')
  ) {
    event.respondWith(
      caches.open(CATALOG_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(req);

        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. CACHE-FIRST / NETWORK FALLBACK FOR APP SHELL & STATIC ASSETS
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache static js, css, and images
        if (
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.svg') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.woff2')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, responseToCache));
        }

        return networkResponse;
      });
    })
  );
});
