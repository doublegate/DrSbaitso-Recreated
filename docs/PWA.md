# Progressive Web App

Dr. Sbaitso Recreated can be installed as an app and works offline once it has
loaded once. Replies and speech need the network, because they come from
`/api`.

## How it is built

| Piece | Where | Notes |
|---|---|---|
| Service worker | `src/sw.ts` → `dist/sw.js` | Built by [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (`injectManifest`) |
| Precache list | generated at build time | Every hashed file in `dist/` (JS, CSS, HTML, icons, worklet, manifest) |
| Registration and updates | `src/components/UpdatePrompt.tsx` | `useRegisterSW` from `virtual:pwa-register/react` |
| Install banner | `src/hooks/useInstallPrompt.ts` + `src/components/InstallPrompt.tsx` | Shown only when the browser fires `beforeinstallprompt` |
| Web app manifest | `public/manifest.json` | Icons, shortcuts and the share target |
| Retired worker | `public/service-worker.js` | A kill switch for browsers that installed the v1.x worker (see below) |

## Caching rules

- **App shell**: precached. A new deploy has new hashed file names, and
  `cleanupOutdatedCaches()` removes the previous precache.
- **Navigations**: any path serves the precached `index.html`, so deep links work
  offline. `/api/*` is excluded.
- **`/api/*`**: never cached; conversations are per user and per turn.
- **Other same-origin images**: cache-first, at most 60 entries for 30 days.

## Updates

When a deploy changes the worker, the new worker installs and **waits**. The page
shows "A NEW VERSION IS AVAILABLE" with RELOAD and LATER buttons. RELOAD
activates the new worker and reloads. LATER keeps the current session; the update
applies the next time the app is opened. Long-lived tabs check for updates
hourly. The page never reloads on its own (v1.x did, which lost the
conversation).

## Migrating from v1.x

Versions up to 1.11 registered `/service-worker.js`, which cached assets
cache-first under a version string that never changed. That file is now a kill
switch: browsers that still run it fetch the new version, which deletes the old
`dr-sbaitso-*` caches and unregisters itself. The next visit registers `/sw.js`.

## Checking it

```bash
npm run build && npm run preview     # http://localhost:4173
```

In DevTools, open **Application → Service workers**. The active worker should be
`/sw.js`, and **Cache storage** should show one `workbox-precache-v2-…` cache.
Tick **Offline** and reload: the name screen should still appear.

The development server does not register a worker (`devOptions.enabled: false`),
so stale caches never get in the way while developing.
