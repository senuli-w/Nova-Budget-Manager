const CACHE_NAME = 'nova-budget-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First for Data, Cache First for Assets/CDNs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy for ESM.sh, Fonts, and Tailwind (Cache First, fall back to network)
  if (url.hostname === 'esm.sh' || url.hostname === 'cdn.tailwindcss.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Strategy for Firebase/API calls (Network Only/handled by SDK) 
  // We pass these through directly.
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
     return; 
  }

  // Default Strategy (Stale-While-Revalidate for app shell files)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
      return cachedResponse || fetchPromise;
    })
  );
});