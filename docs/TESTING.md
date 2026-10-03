# Testing

There are two suites: **Vitest** unit, component and integration tests in jsdom, and **Playwright**
end-to-end tests against the production build with `/api` mocked. Neither suite needs a Gemini
key or network access.

## Commands

| Command | What it runs |
| --- | --- |
| `npm test` | Vitest in watch mode |
| `npm run test:run` | Vitest once. Enforces the performance budgets |
| `npm run test:coverage` | `COVERAGE=1 vitest run --coverage`. Enforces the coverage thresholds and skips the performance budgets |
| `npm run test:ui` | Vitest UI |
| `npm run test:e2e` | Playwright (Chromium). Builds, then serves `vite preview` on port 4173 |
| `npm run test:e2e:ui` / `test:e2e:headed` | Playwright UI / visible browser |
| `npm run test:all` | `test:run`, then `test:e2e` |
| `npm run test:ci` | `test:coverage`, then `test:e2e` |
| `npm run typecheck` | `tsc --noEmit` on `tsconfig.json`, `tsconfig.node.json`, `tsconfig.test.json` and `tsconfig.sw.json` (test and e2e files are covered by `tsconfig.test.json`) |
| `npm run lint` | oxlint (`.oxlintrc.json`) |

One-time setup for e2e: `npx playwright install chromium`. On Linux CI, add `--with-deps`.

Size at release v2.0.0 (2026-10-03), from `npx vitest run`: 96 test files, 1,415 tests (4
skipped). Coverage 72.9% lines, 72.3% statements, 63.1% functions, 66.5% branches; the
thresholds sit just below that. The e2e suite has 15 tests in 3 spec files.

### Running a subset

```bash
npx vitest run test/api/gemini.test.ts            # one file
npx vitest run test/engine                        # one directory
npx vitest run -t "rejects non-POST"              # tests whose name matches
npx vitest run test/api/http.test.ts -t "no-store"

npx playwright test e2e/classic.spec.ts           # one spec (still builds and previews first)
npx playwright test -g "ELIZA answers locally"    # by title
```

## Vitest

Configuration: [`vitest.config.ts`](../vitest.config.ts).

| Setting | Value |
| --- | --- |
| Environment | `jsdom`, `globals: true`, `css: true` |
| Setup file | [`test/setup.ts`](../test/setup.ts) |
| Discovery | Vitest's default include, excluding `node_modules`, `dist`, `build`, `e2e` and `.claude/**` (agent worktrees). This also picks up the two tests under `src/components/` |
| Aliases | `@` points to `src/`. `virtual:pwa-register/react` points to [`test/stubs/pwa-register-react.ts`](../test/stubs/pwa-register-react.ts) |

### Layout

| Path | Contents |
| --- | --- |
| `test/api/` | The server proxy: `serve`, validation, fallback, WAV parsing, rate limiter. Uses an injected fake client and `env` |
| `test/services/` | `geminiService` against a stubbed `fetch` |
| `test/engine/` | The local persona engines (`sbaitso`, `eliza`, `hal`, `joshua`, `parry`) and `personaTurn` |
| `test/hooks/` | React hooks via `renderHook` |
| `test/components/` | Component tests with Testing Library |
| `test/integration/` | The app shell end to end in jsdom (`App.test.tsx`) and the persona voice routing |
| `test/utils/` | Pure utilities: audio DSP, storage, export, analysis, CSP |
| `test/helpers/cpuTime.ts` | `bestCpuMs` and `perfIt` for performance budgets |
| `test/stubs/` | Module stubs wired in through aliases |
| `test/setup.ts` | Global mocks (see below) |
| `test/constants.test.ts` | Persona and constant invariants |

### Global setup (`test/setup.ts`)

The setup file:

- Registers the jest-dom matchers.
- After every test, runs Testing Library `cleanup()`, `vi.clearAllMocks()` and clears both
  storages.
- Stubs `AudioContext`, `OfflineAudioContext` and `audioWorklet.addModule`.
- Stubs `SpeechRecognition` / `webkitSpeechRecognition`, `matchMedia`, `IntersectionObserver`,
  `ResizeObserver`, `requestAnimationFrame` and `navigator.serviceWorker`, and sets
  `navigator.onLine`.
- Replaces `localStorage` and `sessionStorage` with an in-memory store. Both point at the **same**
  store object.
- Stubs `HTMLCanvasElement.getContext('2d')`.

The stubbed `AudioContext.createBufferSource().start()` fires `onended` on the next tick, so
playback promises resolve.

IndexedDB is not stubbed globally. Tests that need it import `fake-indexeddb`
(see [`test/utils/soundPackStore.test.ts`](../test/utils/soundPackStore.test.ts)).

### Coverage

`npm run test:coverage` uses the v8 provider. Reports go to `coverage/` (text-summary,
json-summary, html, lcov).

- **Include:** `src/**/*.{ts,tsx}` and `api/**/*.ts`. Every source file counts, imported or not.
- **Exclude:** `src/sw.ts`, test files, `.d.ts`.
- **Thresholds** are a ratchet set just below measured coverage: lines 67, statements 66,
  functions 57, branches 60.
- Raise the thresholds when coverage grows. Never lower them to make a change pass.

### Performance budgets

Budget tests use `perfIt` from [`test/helpers/cpuTime.ts`](../test/helpers/cpuTime.ts) together
with `bestCpuMs(fn, runs = 3)`. `bestCpuMs` measures the best CPU time of the process, so parallel
workers do not skew it.

`perfIt` is `it` normally and `it.skip` when `COVERAGE` is set. Coverage instrumentation makes the
timings meaningless, so the budgets are enforced by `npm run test:run` only. oxlint treats `perfIt`
as a test block (`vitest/no-standalone-expect`).

```ts
import { bestCpuMs, perfIt } from '../helpers/cpuTime';

perfIt('processes five seconds of speech-rate audio quickly', () => {
  expect(bestCpuMs(() => lpcMonotone(fiveSeconds, { sampleRate: FS, endPunctuation: '.' }))).toBeLessThan(300);
});
```

### Patterns and gotchas

- **Server code:** call `serve(request, handler, { env, createClient, limiter })` or the
  `handleChat`/`handleTts` functions with a fake `{ models: { generateContent } }`. Never use the
  network. `Models.now` injects the clock for the time budget.
- **Browser client:** stub `fetch` (`vi.stubGlobal('fetch', ...)`) and call `resetAllChats()`
  between tests. Histories are module state.
- **`SpeechRecognition`** is defined writable but **not configurable**. Assign it directly and
  restore it afterwards (as in
  [`test/hooks/voiceHooksStability.test.ts`](../test/hooks/voiceHooksStability.test.ts)). Do not
  use `vi.stubGlobal`.
- **Shared audio context:** call `__resetSharedAudioForTests()` when a test needs a fresh context.
  Likewise `resetSoundPackStoreForTests()` and `CloudSync.resetForTests()`.
- **Hooks:** effects that need the latest props use `useEffectEvent`. Re-rendering with new inline
  callbacks must not re-run the effect or loop.
  [`voiceHooksStability.test.ts`](../test/hooks/voiceHooksStability.test.ts) guards this for the
  voice hooks.
- **Do not mock `@google/genai` in new tests.** The server code takes an injected client. The
  `vi.mock('@google/genai')` in `test/setup.ts` is a leftover and does not export `GoogleGenAI`.

## Playwright (end to end)

Configuration: [`playwright.config.ts`](../playwright.config.ts).

| Setting | Value |
| --- | --- |
| Tests | `e2e/*.spec.ts` |
| Browser | Chromium (`Desktop Chrome`) only |
| Server | `npm run build && npm run preview` at `http://localhost:4173`, 120 s start timeout. An already running server is reused locally but not on CI |
| Parallelism | `fullyParallel`. CI uses 1 worker |
| Retries | 2 on CI, 0 locally |
| `test.only` | Fails the run on CI (`forbidOnly`) |
| Reporters | CI: `github` annotations plus an `html` report (`playwright-report/`, not opened). Locally: `list` |
| Artifacts | Trace on first retry. Screenshot on failure (`test-results/`) |

### Mocked `/api`

`vite preview` serves no `/api`, so every test mocks it with [`e2e/fixtures.ts`](../e2e/fixtures.ts).
Tests are deterministic, free and keyless.

| Helper | Purpose |
| --- | --- |
| `mockApi(page, reply?)` | Routes `**/api/chat` to `{ text: reply }` (default `WHY DO YOU FEEL THAT WAY?`) and `**/api/tts` to 2 silent PCM16 samples. Returns `{ chat, tts }`: the recorded chat request bodies and a TTS call count, so a test can assert what reached the "model" |
| `openApp(page, mode)` | Marks onboarding as seen and opens `/?mode=classic` or `/?mode=enhanced` |
| `startEnhanced(page, name?)` | Opens Enhanced mode, enters a name, and waits for `#chat-input` to be enabled |
| `send(page, text)` | Enhanced: types a line and waits for the turn to finish |
| `expectNoPageScroll(page)` | Asserts the document never scrolls (the app is a fixed-height shell) |
| `conversationLog(page)` | The Enhanced `log` region named `Conversation messages` |

Call `mockApi` before the first navigation.

### Specs

| File | Covers |
| --- | --- |
| [`e2e/classic.spec.ts`](../e2e/classic.spec.ts) | The default classic screen: v2.20 banner and greeting, model round trip, local `CALC`, `SAY PARITY` flood and recovery, `BYE` exit menu |
| [`e2e/enhanced.spec.ts`](../e2e/enhanced.spec.ts) | Enhanced mode: layout, Tailwind output present, single-typed reply, menus and Escape, panels, templates through the send pipeline, ELIZA and JOSHUA answering locally, switch to classic |
| [`e2e/csp.spec.ts`](../e2e/csp.spec.ts) | Reads the production Content-Security-Policy from `vercel.json` and attaches it to the document (the preview sends no headers). Drives both screens and fails on any `securitypolicyviolation`. `upgrade-insecure-requests` is removed for the `http://localhost` preview |

### Gotchas

- **Classic readiness** is the screen's phase attribute:
  `expect(page.locator('main[aria-label="Doctor Sbaitso"]')).toHaveAttribute('data-phase', 'chat')`.
  Check the attribute, not visibility: `<main>` has no box of its own. Do not wait for text either:
  the hidden screen-reader transcript holds the whole greeting at once. The exit menu is
  `data-phase="menu"`.
- **Enhanced messages carry a hidden speaker label.** Assert on `conversationLog(page)` with
  `toContainText`, not an exact `getByText`.
- **`getByRole(..., { pressed: false })` also matches elements with no `aria-pressed`.** To target
  "not pressed" specifically, use `[aria-pressed="false"]`, as the templates test does.
- **The persona selector** is `page.getByLabel('PERSONA:')`.
- To assert that something stayed local, record `calls.chat.length` before the action and compare
  it after.

### Adding an e2e test

1. Put it in the spec for the screen it exercises, or in a new `e2e/<area>.spec.ts`.
2. Start with `const calls = await mockApi(page, '<model reply>')`, then `openApp`,
   `startEnhanced` or the classic `startClassic` helper in `classic.spec.ts`.
3. Find elements by role and accessible name. Wait on state (attributes, enabled inputs,
   `expect.poll`), never on timers.
4. Run it with `npx playwright test e2e/<file>.spec.ts`. Use `--headed` or `--ui` to watch it.

```ts
import { test, expect } from '@playwright/test';
import { mockApi, startEnhanced, send, conversationLog } from './fixtures';

test('HAL refuses the pod bay doors locally', async ({ page }) => {
  const calls = await mockApi(page);
  await startEnhanced(page);
  await page.getByLabel('PERSONA:').selectOption('hal9000');
  const before = calls.chat.length;
  await send(page, 'Open the pod bay doors, HAL.');
  await expect(conversationLog(page)).toContainText("I'm afraid I can't do that.");
  expect(calls.chat.length).toBe(before);
});
```

## Continuous integration

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on pushes to `main`, on pull
requests, and on manual dispatch. It uses Node 24 with `npm ci`, and every action is pinned by SHA.

| Job | Steps |
| --- | --- |
| `checks` (Lint, types, unit tests, build) | `npm run lint`, `npm run typecheck`, `npm run test:run` (budgets), `npm run test:coverage` (thresholds), `npm run build`, `npm run check:secrets` (no Google API key shape in `dist/`), `npm audit --omit=dev --audit-level=high` |
| `e2e` (Chromium, mocked /api) | `npx playwright install --with-deps chromium`, then `npm run test:e2e`. On failure it uploads `playwright-report/` for 7 days |

To reproduce CI locally, run the `checks` steps in the same order, then `npm run test:e2e`.
