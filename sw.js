// Service Worker for TC Explorer
const CACHE_NAME = 'tc-explorer-v1';
const urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/app.js',
  '/js/data-manager.js',
  '/js/map-manager.js',
  '/js/ui-controller.js',
  '/js/utils.js',
  '/js/device-manager.js',
  '/js/visualization-renderer.js',
  '/js/config-constants.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.error('Fetch failed:', error);
        throw error;
      })
  );
});