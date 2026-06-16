const CACHE_NAME = 'matchzone26-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/header.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // API calls - network first
  if (url.pathname.includes('.netlify/functions')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cache_copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cache_copy);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const cache_copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, cache_copy);
        });
        return response;
      })
      .catch(() => {
        return caches.match('/')
      })
  );
});

// Background sync for notifications
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(
      fetch('/.netlify/functions/scores')
        .then(res => res.json())
        .then(data => {
          if (data.count > 0) {
            self.registration.showNotification('🏆 MatchZone26', {
              body: `${data.count} jogo(s) em atualização!`,
              badge: '⚽',
              tag: 'scores'
            });
          }
        })
    );
  }
});
