# Performance

How the app keeps its first load small, what it costs at run time, and how to measure
it. Numbers are from a production build (`vite build`) of the 2.0.0 branch; re-measure
before relying on them.

## What loads when

| Stage | Files | Size (raw / gzip) |
|---|---|---|
| Classic screen (the default) | `index` (app shell, classic screen, Sbaitso engine, services), `react-vendor`, CSS, the VGA font | about 65 + 219 + 37 + 10 KB / about 25 + 68 + 8 KB |
| Enhanced mode | `EnhancedApp` plus shared constants, loaded on switch | about 124 + 18 KB / about 42 + 8 KB |
| Each Enhanced panel | One lazy chunk per panel (`React.lazy` in `src/components/enhanced/EnhancedPanels.tsx`) | 3-64 KB; the largest are the topic diagram (64 KB) and insights (45 KB) |
| Cloud sync | `CloudSyncPanel` when the panel opens; the Firebase SDK (about 715 KB in three chunks) only when it connects | |
| Profiler | `performanceProfiler` (5 KB) only in development or with `?profile=1` | |

Vendor splitting is configured in `vite.config.ts`
(`build.rolldownOptions.output.codeSplitting.groups`): React, React DOM and the scheduler
form `react-vendor`. Everything else is split by dynamic imports. The build warns for
chunks over 300 KB (`chunkSizeWarningLimit`); only the lazily loaded Firestore chunk
exceeds it.

The service worker precaches every hashed file, including the lazy chunks and Firebase
(about 1.5 MB in 51 entries), so later visits and offline starts need no network for the
app itself. See [PWA.md](PWA.md).

Inspect the bundle with:

```bash
npm run analyze    # writes reports/bundle-stats.html (gitignored, never into dist/)
```

## Network per turn

- `/api/chat`: the message plus the persona's history. The proxy is stateless, so the
  history is resent each turn; the server forwards the last 40 turns to the model and
  rejects request bodies over 64 KiB. A few KB early in a conversation, growing with it.
- `/api/tts`: raw PCM16 at 24 kHz, about 48 KB per second of speech, base64-encoded in
  JSON. Muting speech skips it.
- ELIZA answers locally with no request; local engine turns of the other personas (Dr.
  Sbaitso's commands, JOSHUA's games, HAL's scripted lines) need only the speech request.

Speech synthesis runs while the reply is typed out, so its latency is mostly hidden.

## Audio processing cost

The voice chains run once per utterance on the decoded buffer, in the main thread, before
playback. Measured in Node on 5 s of 24 kHz audio (`docs/AUDIO_SYSTEM.md`):

| Chain | Time |
|---|---|
| Dr. Sbaitso, Authentic | about 28 ms |
| HAL | about 27 ms |
| WOPR | about 76 ms |

Unit tests enforce CPU-time budgets on these chains (`perfIt` and `bestCpuMs` in
`test/helpers/cpuTime.ts`, used by the `lpcMonotone`, `vintageAudioProcessing` and
`personaVoices` tests). The budgets are skipped under `npm run test:coverage`, whose
instrumentation distorts timing, and enforced by `npm run test:run`.

## Run-time notes

- One shared `AudioContext` for speech, sound effects, sound packs and music
  (`src/utils/sharedAudio.ts`).
- The reply typewriter sets the visible prefix each tick (40 ms per character; 4 ms for
  replies over 400 characters), and the chat log is not a live region, so typing does not
  trigger screen-reader announcements.
- Global listeners (shortcuts, swipe, voice control) are registered once and read the
  latest handlers through `useEffectEvent` or refs, so re-renders do not re-register them.
- Saved history (when SAVE HISTORY is on) lives in localStorage; sound packs live in
  IndexedDB because a single pack can approach the localStorage quota.

## Profiling

`src/utils/performanceProfiler.ts` is loaded only in development builds or with
`?profile=1` in production (`src/index.tsx`):

- It observes Core Web Vitals (LCP, CLS, INP, FCP, TTFB) with `PerformanceObserver`.
- It prints a console report five seconds after load and whenever the page is hidden.
- `window.sbaitsoProfiler.report()` prints the report on demand; `.vitals()` returns the
  current values.
- With `?profile=1`, a small on-screen overlay shows live vitals and heap size.
- `measureFn`, `measureAsyncFn` and the `@profile` decorator record named timings
  (count, average, min, max), mirrored to the User Timing API so they appear in the
  browser's Performance panel. No app code is instrumented with them yet.

For deeper work, use the browser's Performance panel and the React DevTools profiler.
