<!-- Managed by Master-Claude. Universal rules come from the imported/inlined core.
     Edit only inside the MC-PROJECT block; mc-sync overwrites everything else. -->
<!-- mc-core: 0.2.0 | mode=import | lang=typescript -->
# AGENTS.md — DrSbaitso-Recreated

@/home/parobek/.claude/master-core/AGENTS.base.md
@/home/parobek/.claude/master-core/lang/typescript.md
@/home/parobek/.claude/master-core/modules/10-commits-and-versioning.md
@/home/parobek/.claude/master-core/modules/20-testing-and-accuracy.md
@/home/parobek/.claude/master-core/modules/30-quality-gates.md
@/home/parobek/.claude/master-core/modules/40-docs-and-adrs.md
@/home/parobek/.claude/master-core/modules/50-architecture-patterns.md
@/home/parobek/.claude/master-core/modules/60-security.md
@/home/parobek/.claude/master-core/modules/70-release-ceremony.md
@/home/parobek/.claude/master-core/modules/80-phase-sprint-workflow.md
@/home/parobek/.claude/master-core/modules/90-multi-language-integration.md
@/home/parobek/.claude/master-core/modules/91-agent-system-architecture.md
@/home/parobek/.claude/master-core/modules/95-named-pattern-library.md

<<< MC-PROJECT-START >>>
## Project: DrSbaitso-Recreated

Web recreation of the 1991 Sound Blaster "Dr. Sbaitso" AI therapist: React 19 + TypeScript 7
(strict) + Vite 8 (Rolldown) + Tailwind v4, with Gemini for chat and TTS behind Vercel Functions.
Vercel project `dr-sbaitso-recreated`, team `doublegate-projects`. Five personas (Dr. Sbaitso,
ELIZA, HAL 9000, JOSHUA/WOPR, PARRY) plus user-created custom characters.

**Status:** v2.0.0 remediation in progress on `fix/v2-audit-remediation`.
- Plan: `~/.claude/plans/ethereal-popping-beaver.md`.
- Done: Phases 0-2, plus the audio/chat part of Phase 3.
- Run `git log fab0992..HEAD` for the detail.

### Commands

```bash
npm ci                 # Node >= 22.12 (24 recommended)
npm run dev            # http://localhost:3000; serves api/* too; needs GEMINI_API_KEY in .env.local
npm run build          # vite build -> dist/ (never contains the key)
npm run check:secrets  # fails if dist/ holds anything shaped like a Google API key
npm run typecheck      # tsc: tsconfig.json (browser), .node (api/configs), .test, .sw (service worker)
npm run lint           # oxlint (.oxlintrc.json); hooks rules are errors
npm run test:run       # vitest (jsdom); `npm test` is watch mode; enforces perf budgets
npm run test:coverage  # COVERAGE=1: thresholds ratchet in vitest.config.ts; perf budgets skipped
npm run test:e2e       # Playwright (chromium); builds + previews on :4173; /api mocked (e2e/fixtures.ts)
npm run analyze        # bundle report -> reports/ (gitignored)
```

### Layout

- `api/chat.ts`, `api/tts.ts` + `api/_lib/{gemini,http}.ts`: the only code that holds the key.
  - Personas are resolved server-side.
  - Inputs are validated and capped.
  - Model fallback on 503/429/timeout within a 50 s budget.
  - TTS WAV is converted to raw PCM16.
- `src/services/geminiService.ts`: browser fetch client. It keeps per-character history, because the
  proxy is stateless.
- `src/App.tsx`: the app shell (classic or enhanced mode). `src/EnhancedApp.tsx` composes the
  enhanced UI from hooks and `src/components/enhanced/`.
  - `src/hooks/useChatPipeline.ts`: `sendMessage()` is the single turn pipeline (engines,
    typewriter, speech while typing, errors); the greeting is one async sequence started from
    name submit. Dependencies come in as arguments.
  - `src/hooks/usePanels.ts`: open/closed state of every panel. `src/hooks/useGlobalShortcuts.ts`:
    the Alt+Shift listener.
  - `src/components/enhanced/`: `NameEntry`, `EnhancedHeader` (persona, menus), `ChatLog`,
    `InputBar`, `StatusBar`, `VoiceControlIndicator`, and `EnhancedPanels` (the lazy panels and
    `VoiceHelpDialog`). Tour targets (`data-tour-id`) live here; the onboarding test reads them.
- `src/hooks/useSpeechPlayer.ts`: plays TTS through `src/utils/sharedAudio.ts`, the one AudioContext for
  the page.
- `src/constants.ts`: `CHARACTERS`, `VOICE_PROFILES`, `THEMES`, `AUDIO_MODES`. Shortcuts: `src/utils/shortcuts.ts`.
- `src/sw.ts`: the service worker (vite-plugin-pwa `injectManifest`), served as `/sw.js`.
  - It precaches the build and never caches `/api`.
  - `src/components/UpdatePrompt.tsx` offers updates; the page never reloads on its own.
  - `public/service-worker.js` is a kill switch for browsers that installed the v1.x worker.
  - See `docs/PWA.md`.
- `ref-docs/`: sourced research on the original program (history, voice, UI). Use it before
  changing personas, voice or visuals.

### Facts that bite

- **Gemini quotas are per model** on this key, and `gemini-3.8-flash` often returns 429/503. Don't
  "fix" fallbacks away. Verify ids with ListModels: the dev middleware reads `.env.local`, and
  `node --env-file=.env.local` works for probes.
- **TypeScript 7 has no JS API** (`createSourceFile` is undefined), so typescript-eslint cannot
  run. That is why lint is oxlint.
- **Use `useEffectEvent` (React 19.2)** for listeners and effects that need the latest
  state/handlers. A new inline-callback dependency in an effect is how production broke (render
  loop in `useVoiceControl`).
- **Audio modes:**
  - `decodeAudioData` applies the vintage processing (`src/utils/vintageAudioProcessing.ts`):
    8475 Hz unsigned 8-bit, sample-and-hold, and LPC pitch flattening (`src/utils/lpcMonotone.ts`)
    in Authentic/Ultra. Values come from `ref-docs/02-voice-and-audio.md`; change them only
    against that.
  - `getPlaybackSettings` is 1.0x with no extra crush in every mode: a rate above 1 raises the
    pitch, and the original is full 8-bit.
  - Never re-add a global 64-level crush.
  - The vintage chain and the audio mode apply to the `sbaitso` processing route only. Each
    persona has a `processing` route (`CHARACTERS`): HAL and JOSHUA have their own chains in
    `src/utils/personaVoices.ts`, ELIZA and PARRY play clean. See `docs/AUDIO_SYSTEM.md`.
- **Vercel previews sit behind SSO.** Smoke-test with the Vercel MCP `get_access_to_vercel_url`
  plus a curl cookie jar.
- **`test/setup.ts`** defines `SpeechRecognition` as writable but non-configurable: assign it, do
  not `vi.stubGlobal` it.
- **Known open debt (planned phases):**
  - Lint categories at "warn" are promoted as they are cleared.
- **e2e:** classic readiness is `main[data-phase="chat"]` checked as an attribute (`<main>` has
  no box, and the hidden transcript holds the whole greeting at once). Enhanced messages carry a
  hidden speaker label: assert on the `Conversation messages` log, not exact `getByText`.
  Playwright's `pressed: false` also matches elements with no `aria-pressed`.
- **CI** (`.github/workflows/ci.yml`) mirrors the gates above plus `npm audit`; actions are
  pinned by SHA.

### Personas (behavioural contract for the system prompts)

- **Dr. Sbaitso (1990; v2.20, 1992):** ALL CAPS only; knowledge cutoff 1992; short, cheeky,
  keyword-matcher register built from the original's real lines (ref-docs/01); initialisms spelled
  with spaces ("C P U"); no emojis, modern slang, or breaking character. The model never emits
  glitches: commands, canned input handling and the scripted PARITY ERR sequence belong to the
  local engine in `src/engine/sbaitso/` (hybrid design). "PARITY CHECKING" and "IRQ CONFLICT"
  were invented and must not come back.
- **ELIZA (1966):** Rogerian pattern-matching; reflects questions back; mechanical and repetitive.
- **HAL 9000 (ref-docs/07):** sentence case, NOT caps (HAL is spoken); courteous, uses the
  user's first name, 1-3 sentences, never admits error, apologises before refusing, gentler
  under stress. Pod-bay refusal and the shutdown/"Daisy Bell" ending are local
  (`src/engine/hal/`).
- **JOSHUA/WOPR (1983, ref-docs/08):** ALL CAPS terminal; calls the user PROFESSOR FALKEN;
  games, chess over war, which side, simulation = real. Logon, game list, war menu,
  tic-tac-toe and the lesson are local (`src/engine/joshua/`). "The only winning move" is
  allowed only once the session tag says `LESSON=LEARNED`.
- **PARRY (1972):** suspicious, hostile when questioned, conspiracy thinking, bookies/mafia
  backstory.
- All personas except HAL answer in ALL CAPS by design (the retro terminal look).
- Engines prepend a `[SESSION: ...]` line to the model message (`modelMessage`); the HAL and
  JOSHUA prompts read its field names, and tests pin the two together.

### Docs

- `README.md` is a landing page only; history goes in `CHANGELOG.md` under `[Unreleased]`.
- Update both in the same push as the change.
- Also: `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`, `docs/FEATURES.md`.
<<< MC-PROJECT-END >>>

