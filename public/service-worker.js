/**
 * Service Worker for Dr. Sbaitso Recreated
 * Version: 1.11.0 (Option B1)
 *
 * Provides:
 * - Offline support via cache-first strategy for static assets
 * - Network-first strategy for API calls
 * - Runtime caching for dynamic content
 * - Background sync hooks for failed requests
 * - Push notification infrastructure
 */

const CACHE_VERSION = 'v1.11.0';
const STATIC_CACHE = `dr-sbaitso-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `dr-sbaitso-runtime-${CACHE_VERSION}`;
const API_CACHE = `dr-sbaitso-api-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Icons will be cached on-demand
];

// Cache duration limits (in seconds)
const CACHE_DURATIONS = {
  api: 60 * 5,        // 5 minutes for API responses
  runtime: 60 * 60,   // 1 hour for runtime assets
  static: Infinity    // Static assets cached indefinitely
};

/**
 * Install Event
 * Pre-cache critical static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[ServiceWorker] Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate Event
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete caches that don't match current version
              return cacheName.startsWith('dr-sbaitso-') &&
                     !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event
 * Route requests to appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Route based on request type
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
  }
});

/**
 * Cache-First Strategy
 * Try cache first, fallback to network
 * Best for: Static assets that rarely change
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[ServiceWorker] Cache hit:', request.url);
      return cachedResponse;
    }

    // Fallback to network
    console.log('[ServiceWorker] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first error:', error);

    // Return offline fallback for HTML pages
    if (request.headers.get('accept').includes('text/html')) {
      return getOfflineFallback();
    }

    throw error;
  }
}

/**
 * Network-First Strategy
 * Try network first, fallback to cache
 * Best for: API calls and dynamic content
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[ServiceWorker] Cached from network:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[ServiceWorker] Served from cache:', request.url);
      return cachedResponse;
    }

    console.error('[ServiceWorker] Network-first error:', error);

    // Return offline fallback for HTML pages
    if (request.headers.get('accept')?.includes('text/html')) {
      return getOfflineFallback();
    }

    throw error;
  }
}

/**
 * Network-Only Strategy
 * Always fetch from network, never cache
 * Best for: Time-sensitive data
 */
async function networkOnlyStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[ServiceWorker] Network-only error:', error);
    throw error;
  }
}

/**
 * Request Type Detectors
 */
function isApiRequest(url) {
  // Gemini API calls
  return url.hostname.includes('generativelanguage.googleapis.com');
}

function isStaticAsset(url) {
  // JS, CSS, fonts, images
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf',
                           '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Offline Fallback Page
 */
function getOfflineFallback() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dr. Sbaitso - Offline</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #000080;
          color: #FFFF00;
          font-family: 'Courier New', monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          text-align: center;
          padding: 2rem;
          border: 4px solid #FFFF00;
          background: #000080;
          max-width: 600px;
        }
        h1 {
          font-size: 2rem;
          margin: 0 0 1rem 0;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        p {
          font-size: 1rem;
          line-height: 1.6;
          margin: 1rem 0;
        }
        button {
          background: #FFFF00;
          color: #000080;
          border: 2px solid #FFFF00;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          margin-top: 1rem;
        }
        button:hover {
          background: #000080;
          color: #FFFF00;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ OFFLINE MODE ⚠️</h1>
        <p>NETWORK CONNECTION ERROR</p>
        <p>Dr. Sbaitso requires an internet connection to function.</p>
        <p>Please check your network and try again.</p>
        <button onclick="location.reload()">🔄 RETRY CONNECTION</button>
      </div>
    </body>
    </html>`,
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  );
}

/**
 * Background Sync Event
 * Retry failed requests when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  console.log('[ServiceWorker] Syncing messages...');

  try {
    // Get pending messages from IndexedDB (if implemented)
    // This is a placeholder for future implementation
    const pendingMessages = []; // await getPendingMessages();

    if (pendingMessages.length === 0) {
      console.log('[ServiceWorker] No pending messages to sync');
      return;
    }

    // Send pending messages
    const results = await Promise.allSettled(
      pendingMessages.map(msg => fetch(msg.url, msg.options))
    );

    console.log('[ServiceWorker] Sync completed:', results);
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
    throw error; // Retry sync
  }
}

/**
 * Push Notification Event
 * Handle incoming push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Dr. Sbaitso', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'New message from Dr. Sbaitso',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open App', icon: '/icon-192.png' },
      { action: 'close', title: 'Dismiss', icon: '/icon-192.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dr. Sbaitso', options)
  );
});

/**
 * Notification Click Event
 * Handle notification interactions
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data || '/');
        }
      })
  );
});

/**
 * Message Event
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('dr-sbaitso-')) {
              console.log('[ServiceWorker] Clearing cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});

console.log('[ServiceWorker] Loaded successfully');
