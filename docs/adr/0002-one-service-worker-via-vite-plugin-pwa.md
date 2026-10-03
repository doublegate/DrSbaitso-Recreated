# ADR-0002: One service worker, built by vite-plugin-pwa

- Status: Accepted
- Date: 2026-10-02

## Context

v1.x shipped two service workers. The registered one, `public/service-worker.js`,
cached assets cache-first under a version string that never changed, did not
exclude `/api`, called `skipWaiting()` and `clients.claim()`, and forced a page
reload on update, which wiped the conversation in progress. The documentation
described the other worker, which was never registered.

## Decision

- A single worker, `src/sw.ts`, is built by vite-plugin-pwa with the
  `injectManifest` strategy and served as `/sw.js`. The build injects a precache
  list of every hashed file, and `cleanupOutdatedCaches()` removes old ones.
- Navigations are served from the precached `index.html`. `/api/*` is never cached.
  Other same-origin images are cache-first with a size and age cap.
- Updates wait. `src/components/UpdatePrompt.tsx` offers RELOAD or LATER; the page
  never reloads on its own.
- `public/service-worker.js` becomes a kill switch: it deletes the old caches and
  unregisters itself, so browsers that installed v1.x move to `/sw.js`.
- The development server registers no worker.

## Consequences

- Deploys are picked up reliably, and a conversation is never lost to an update.
- `injectManifest` keeps custom worker code (navigation fallback, image cache,
  `SKIP_WAITING` message) under our control, at the cost of writing it.
- `vercel.json` serves the worker files with `no-cache`, so update checks see new
  versions promptly.
- The kill switch must stay deployed for as long as v1.x installs may exist.
