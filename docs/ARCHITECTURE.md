# Architecture

Dr. Sbaitso Recreated is a single-page React 19 app (TypeScript, strict; Vite 8; Tailwind
v4) plus two Vercel Functions that call Google Gemini. The decisions behind the shape are
recorded as ADRs in [`docs/adr/`](adr/README.md); this page describes the result and
links to them rather than restating the reasoning.

```
 browser                                                         Vercel
 ┌──────────────────────────────────────────────────────┐       ┌──────────────────────────┐
 │ App.tsx: mode switch (classic default, Alt+Shift+X)  │       │ api/chat.ts  api/tts.ts  │
 │  ├─ ClassicApp ──── engine/sbaitso                   │ fetch │  └─ api/_lib/http.ts      │
 │  └─ EnhancedApp ─── engine/personaTurn ─ engines     │──────>│     body cap, rate limit │
 │        hooks (useChatPipeline, usePanels, ...)       │ /api  │  └─ api/_lib/gemini.ts    │──> Gemini
 │  services/geminiService.ts (history per persona)     │<──────│     personas, validation,│
 │  useSpeechPlayer ─ utils/audio ─ voice routes        │ JSON  │     model fallback, PCM  │
 │  sharedAudio (one AudioContext)                      │       └──────────────────────────┘
 │  localStorage / IndexedDB      sw.js (precache)      │
 └──────────────────────────────────────────────────────┘
```

## Two screens

`src/App.tsx` reads the mode (`?mode=classic|enhanced`, else `localStorage`
`sbaitso_ui_mode`, else classic; `src/utils/uiMode.ts`) and renders one of two apps. It
also owns the Alt+Shift+X listener and reads shared text once
(`src/utils/shareTarget.ts`). Enhanced mode is a lazy chunk. See
[ADR-0004](adr/0004-classic-screen-by-default.md).

**Classic** (`src/components/classic/`):

- `ClassicApp.tsx` is the controller. It holds a phase (`intro`, `name`, `busy`, `chat`,
  `menu`, `dos`), the screen model and the engine state.
- Every input goes to `processInput()` from `src/engine/sbaitso`; only results of kind
  `model` call `/api/chat`.
- Doctor lines are queued as cues. One TTS request covers a whole reply, and each line is
  shown at its estimated offset in the clip (`src/utils/speechCues.ts`).
- `src/utils/dosScreen.ts` is a pure 80x25 (or 40x25) text model: printing, scrolling
  under the pinned five-row banner, and colour segments.
- `DosScreen.tsx` renders the model in 9x16 cells with the bundled VGA font, scaled by
  whole numbers. It is `aria-hidden`; the controller renders a hidden transcript and a
  real input.

**Enhanced** (`src/EnhancedApp.tsx`) composes hooks and components:

| Piece | Role |
|---|---|
| `src/hooks/useChatPipeline.ts` | Name entry and greeting (one async sequence), `sendMessage()` (the single turn pipeline), templates, clearing and persona switching. Dependencies come in as arguments. |
| `src/hooks/usePersona.ts` | Active persona (built-in or custom), request options, voice profile, processing route |
| `src/hooks/usePanels.ts` | Open/closed state of every panel; `closeLatest()` for the swipe-back gesture |
| `src/hooks/useGlobalShortcuts.ts` | The Alt+Shift+&lt;key&gt; listener (`src/utils/shortcuts.ts` is the source of truth) |
| `src/hooks/useSessionHistory.ts` | Opt-in history (SAVE HISTORY) |
| `src/hooks/useThemeChoice.ts`, `useAccessibility.ts`, `useVoiceControl.ts`, `useOnlineStatus.ts`, `useTouchGestures.ts` | Themes, accessibility settings, hands-free voice control, OFFLINE, swipe |
| `src/components/enhanced/` | `NameEntry`, `EnhancedHeader` (persona, menus), `ChatLog`, `InputBar`, `StatusBar`, `VoiceControlIndicator`, `EnhancedPanels` (every lazy panel and `VoiceHelpDialog`) |

Global listeners register once and read the latest handlers through `useEffectEvent`
(React 19.2) or refs.

## The turn pipeline (Enhanced)

`sendMessage(text)` in `useChatPipeline`:

1. Guard one turn at a time (`busyRef`); unlock audio; log the user message.
2. `personaTurn(personaId, engines, text, ctx)` returns new engine state and a plan:
   - `local`: lines to print and the text to speak;
   - `model`: a message (with the engine's `[SESSION: ...]` line), a history key, a
     `finalize` step and an optional fallback;
   - `ignore`: HAL after shutdown;
   - `default`: no engine (custom characters); plain model call.
3. On a model plan, call `getAIResponse()`. On failure, use the fallback (PARRY) or print
   an in-character error (`src/utils/retroErrors.ts`).
4. Start TTS for the spoken text, type the reply out (40 ms per character, 4 ms for
   printouts over 400 characters), then play the speech. A speech failure never removes
   text.
5. Fire sound effects and sound-pack events; announce the reply to screen readers.

## Local engines

Each persona's mechanical behaviour lives in a pure, seeded engine under `src/engine/`.
The model handles only open conversation. See
[ADR-0003](adr/0003-hybrid-local-engines.md).

| Engine | Contents |
|---|---|
| `sbaitso/` | `engine.ts` (`processInput`, pending prompts, input checks, profanity strikes), `dotCommands.ts`, `calc.ts` (safe evaluator), `screens.ts` (banner, greeting, HELP pages, exit menu, name rules), `phrases.ts` (v2.20 strings) |
| `eliza/` | Weizenbaum's algorithm and the 1965 DOCTOR script (`doctorScript1965.ts`), SLIP hash for MEMORY |
| `parry/` | Affect model (`affect.ts`), move choice (`engine.ts`), prompt for phrasing one line (`prompt.ts`), fallback lines |
| `hal/` | Pod bay refusal, disconnect refusals, shutdown and "Daisy Bell" |
| `joshua/` | Logon, game list, war menu, tic-tac-toe (`tictactoe.ts`, minimax), self-play lesson |
| `personaTurn.ts` | The Enhanced-mode router from persona id to engine and plan |

The HAL and JOSHUA prompts read field names from the `[SESSION: ...]` line; tests pin the
two together.

## Server proxy

`api/chat.ts` and `api/tts.ts` are Node functions with a `POST(request)` handler. They
are the only code that reads `GEMINI_API_KEY`. See
[ADR-0001](adr/0001-gemini-behind-a-server-proxy.md) and [API.md](API.md) for the
contract.

- `api/_lib/http.ts`: method check, a 64 KiB streamed body cap, a per-instance limit of
  20 requests per minute per client, JSON parsing, client construction, and typed errors
  that never echo upstream details.
- `api/_lib/gemini.ts`:
  - resolves built-in personas from `src/constants.ts` by id (a custom character's
    instruction is accepted, capped, as untrusted text);
  - validates and caps every field, and forwards the last 40 history turns;
  - tries the fallback models on 503, 429 or timeout within a 50-second budget;
  - for speech, applies the persona's voice, style, casing and pronunciation, strips a
    WAV header and resamples to 24 kHz PCM16.
- `src/services/geminiService.ts`: the browser client. The proxy is stateless, so it keeps
  each persona's history in memory and sends it with every turn. `resetChat(id)` forgets
  one persona.
- Development: a Vite middleware (`devApiPlugin` in `vite.config.ts`) serves `api/*`
  through `ssrLoadModule` with `.env.local` loaded, so `npm run dev` behaves like
  production.

## Audio

See [AUDIO_SYSTEM.md](AUDIO_SYSTEM.md) and
[ADR-0005](adr/0005-measured-voice-pipeline.md).

```
/api/tts (base64 PCM16, 24 kHz)
  -> decodeAudioData(..., mode, endPunctuation, { processing, text })   src/utils/audio.ts
       resolveVoiceRoute(processing, mode)                              src/utils/voiceRoutes.ts
         sbaitso + mode != modern -> vintage chain    src/utils/vintageAudioProcessing.ts, lpcMonotone.ts
         hal  -> processHalVoice                      src/utils/personaVoices.ts, timeStretch.ts
         wopr -> processWoprVoice                     src/utils/personaVoices.ts
         clean / modern -> unchanged
  -> playAudio() at 1.0x on the shared AudioContext   src/utils/sharedAudio.ts
```

- `useSpeechPlayer(mode)` wraps this and exposes the playing source (stop, visualizer).
- Each persona's route comes from `CHARACTERS[].processing` in `src/constants.ts`. The
  audio modes are `AUDIO_MODES`, and the classic screen is fixed to Authentic.
- Sound effects (`soundEffects.ts`), sound packs (`soundPackPlayer.ts`) and music
  (`musicEngine.ts`) use the same context.

## Storage

Nothing leaves the browser except `/api` requests and, if configured, cloud sync.

| Store | Contents |
|---|---|
| localStorage | UI mode, persona, voice profile (`drSbaitsoVoice`), theme and custom themes, accessibility settings, custom characters, tutorial state, sound settings, active sound pack name, install-banner dismissal |
| localStorage, opt-in | Saved conversations and the current session (`sbaitso_sessions`, `sbaitso_current_session`), written only while SAVE HISTORY is on (`sbaitso_keep_history`); turning it off erases them. See [ADR-0006](adr/0006-opt-in-history-and-content-boundaries.md). |
| IndexedDB | Sound packs (`DrSbaitsoSoundPacks`), migrated from localStorage |
| Memory only | Model history per persona, engine state, music settings |
| Firebase (optional) | Saved conversations, in the user's own project ([CLOUD_SYNC.md](CLOUD_SYNC.md)) |

## Service worker and PWA

`src/sw.ts` is built by vite-plugin-pwa (`injectManifest`) and served as `/sw.js`:

- It precaches the hashed build and serves navigations from the precached `index.html`.
- It never caches `/api`, and caches other same-origin images cache-first with a cap.
- `src/components/UpdatePrompt.tsx` registers it and offers RELOAD or LATER; the page
  never reloads on its own.
- `public/service-worker.js` is a kill switch for v1.x installs.
- `public/manifest.json` declares the icons, the two shortcuts and the share target.

See [PWA.md](PWA.md) and [ADR-0002](adr/0002-one-service-worker-via-vite-plugin-pwa.md).

## Security

- **CSP**: defined once in `getCSPDirectives()` (`src/utils/security.ts`) and deployed by
  `vercel.json`; `test/utils/csp.test.ts` keeps the two equal, and `e2e/csp.spec.ts` runs
  both screens under the policy. Scripts only from the site (no inline code, no eval),
  connections only to the site and the Firebase hosts, no framing. The dev server sends
  the same policy, relaxed only for hot reloading.
- **Headers** (`vercel.json`): HSTS, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, and a `Permissions-Policy` that allows only the microphone.
- **Secrets**: the key exists only in server environment variables. `npm run
  check:secrets` fails the build if `dist/` contains anything shaped like a Google API
  key.
- **Untrusted data**: imported sound packs, themes, cloud data and custom characters are
  schema-checked and size-capped before use; exports HTML-escape every interpolated field.

## Errors and lazy loading

- `src/components/ErrorBoundary.tsx` wraps the app in `src/index.tsx`.
- Every Enhanced panel is `React.lazy`, as is Firebase. The profiler loads only in
  development or with `?profile=1`. See [PERFORMANCE.md](PERFORMANCE.md).

## Tests

Unit and integration tests (Vitest, jsdom) live under `test/` and mirror `src/` and
`api/`. End-to-end tests (Playwright) live in `e2e/`, with `/api` mocked. See
[TESTING.md](TESTING.md).
