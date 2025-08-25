const staticCacheName = 'alnwick-trails-static-v2';
const dynamicCacheName = 'alnwick-trails-dynamic-v2';

// An array of all the static assets to cache
const assetsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon-512.png',
    '/icon-192.png'
];

// Install event: caches the static app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            console.log('Caching shell assets');
            return cache.addAll(assetsToCache);
        })
    );
});

// Activate event: cleans up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== staticCacheName && key !== dynamicCacheName)
                .map(key => caches.delete(key))
            );
        })
    );
});

// Fetch event: serves content from cache or network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cacheRes => {
            return cacheRes || fetch(event.request).then(fetchRes => {
                return caches.open(dynamicCacheName).then(cache => {
                    // We clone the response because a response is a stream and can only be consumed once.
                    cache.put(event.request.url, fetchRes.clone());
                    return fetchRes;
                })
            });
        }).catch(() => {
            // This is a basic fallback for when there's no cache and no network.
            // You could return a custom offline page here if you wanted.
        })
    );
});