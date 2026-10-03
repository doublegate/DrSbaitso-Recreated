/// <reference lib="webworker" />
/**
 * Service worker, built by vite-plugin-pwa (injectManifest).
 *
 * - Precaches the hashed build output listed in self.__WB_MANIFEST, so the
 *   app shell works offline and every deploy replaces stale files.
 * - Never touches /api: replies and speech are per-conversation and must not
 *   be cached.
 * - Updates wait for the user. The page shows a prompt, which posts
 *   SKIP_WAITING; nothing reloads mid-conversation on its own.
 */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigations get the precached shell (offline support); /api is excluded.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }));

// Same-origin images outside the precache: cache-first, bounded.
registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
