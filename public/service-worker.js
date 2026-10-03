/**
 * Retired service worker (kill switch).
 *
 * Releases up to 1.11 registered this file. It cached assets cache-first under
 * a version string that never changed, so browsers that installed it could
 * keep serving stale code. The app now uses /sw.js (vite-plugin-pwa). Any
 * browser still running this worker picks up this version, deletes the old
 * caches and unregisters itself. It does not reload open pages.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('dr-sbaitso-')).map((n) => caches.delete(n)));
      await self.registration.unregister();
    })(),
  );
});
