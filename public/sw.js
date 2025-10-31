// Dr. Sbaitso Recreated - Service Worker
// Version 1.7.0 - Progressive Web App Implementation

const CACHE_VERSION = 'dr-sbaitso-v1.7.0';
const RUNTIME_CACHE = 'dr-sbaitso-runtime-v1.7.0';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/audio-processor.worklet.js',
  // Icons will be added during build
];

// Cache-first strategy for these patterns
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:woff|woff2|ttf|eot)$/,
  /\/icons\//,
];

// Network-first strategy for these patterns
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /generativelanguage\.googleapis\.com/,
];

// Stale-while-revalidate for these patterns
const STALE_WHILE_REVALIDATE_PATTERNS = [
  /\.(?:js|css)$/,
];

// Maximum cache age in milliseconds (7 days)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

// Maximum number of items in runtime cache
const MAX_RUNTIME_CACHE_ITEMS = 50;

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      console.log('[ServiceWorker] Precaching app shell');
      try {
        await cache.addAll(PRECACHE_ASSETS);
        // Force activation of new service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[ServiceWorker] Precaching failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      // Take control of all pages immediately
      await self.clients.claim();
      console.log('[ServiceWorker] Service worker activated');
    })()
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    // Handle Google API requests with network-first
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.href))) {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Determine caching strategy based on URL patterns
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
  } else if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
  } else if (STALE_WHILE_REVALIDATE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default: network-first for HTML and API calls
    event.respondWith(networkFirst(request));
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  if (cached) {
    // Check cache age
    const cacheDate = new Date(cached.headers.get('date') || 0);
    const age = Date.now() - cacheDate.getTime();

    if (age < MAX_CACHE_AGE) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return stale cache if network fails
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      // Trim runtime cache
      await trimCache(RUNTIME_CACHE, MAX_RUNTIME_CACHE_ITEMS);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      console.log('[ServiceWorker] Returning cached response for:', request.url);
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return createOfflineResponse();
    }

    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      cache.put(request, response.clone());
      await trimCache(RUNTIME_CACHE, MAX_RUNTIME_CACHE_ITEMS);
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Trim cache to maximum size
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Create offline fallback response
function createOfflineResponse() {
  return new Response(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dr. Sbaitso - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          background: #000080;
          color: #FFFF00;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          text-align: center;
          border: 3px solid #FFFF00;
          padding: 40px;
          background: rgba(0, 0, 0, 0.3);
        }
        h1 { font-size: 32px; margin-bottom: 20px; }
        p { font-size: 16px; line-height: 1.6; margin-bottom: 15px; }
        .ascii-art {
          font-size: 12px;
          line-height: 1.2;
          white-space: pre;
          margin: 20px 0;
        }
        button {
          background: #FFFF00;
          color: #000080;
          border: none;
          padding: 15px 30px;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover { background: #FFFF88; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>OFFLINE MODE</h1>
        <div class="ascii-art">
   _______________
  |  DR. SBAITSO  |
  |_______________|
  |  [X]  [X]  [X] |
  |_______________|
  | NETWORK ERROR |
  |_______________|
        </div>
        <p>YOU ARE CURRENTLY OFFLINE.</p>
        <p>DR. SBAITSO REQUIRES AN INTERNET CONNECTION TO FUNCTION.</p>
        <p>PLEASE CHECK YOUR NETWORK CONNECTION AND TRY AGAIN.</p>
        <button onclick="window.location.reload()">RETRY CONNECTION</button>
      </div>
    </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      },
    }
  );
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }

  if (event.data && event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Background sync event - sync data when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sessions') {
    event.waitUntil(syncSessions());
  }
});

// Sync sessions (placeholder - will be implemented with cloud sync)
async function syncSessions() {
  console.log('[ServiceWorker] Background sync: syncing sessions');
  // This will be implemented when cloud sync is added
  return Promise.resolve();
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

// Update cache periodically
async function updateCache() {
  console.log('[ServiceWorker] Periodic sync: updating cache');
  const cache = await caches.open(CACHE_VERSION);

  try {
    await cache.addAll(PRECACHE_ASSETS);
  } catch (error) {
    console.error('[ServiceWorker] Cache update failed:', error);
  }
}

console.log('[ServiceWorker] Service worker script loaded');
