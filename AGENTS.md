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

Web recreation of the 1991 Sound Blaster "Dr. Sbaitso" AI therapist: React 19 + TypeScript + Vite 8
(Rolldown), Gemini for chat and text-to-speech, deployed as a Vite SPA on Vercel
(project `dr-sbaitso-recreated`, team `doublegate-projects`). Five personas (Dr. Sbaitso, ELIZA,
HAL 9000, JOSHUA/WOPR, PARRY) plus user-created custom characters.

**Status (2026-10-02):** v2.0.0 remediation in progress on `fix/v2-audit-remediation`; the plan
lives at `~/.claude/plans/ethereal-popping-beaver.md`. Until it lands, treat the README's feature
and metric claims as unverified. The audit found the production crash, the key exposure and many
half-wired features.

### Commands

```bash
npm ci                 # Node >= 22.12 (Vercel builds on Node 24.x)
npm run dev            # http://localhost:3000; needs GEMINI_API_KEY in .env.local
npm run build          # vite build -> dist/
npm run typecheck      # tsc --noEmit
npm run test:run       # vitest (jsdom); `npm test` is watch mode
npm run test:coverage  # v8 coverage with thresholds
npm run test:e2e       # Playwright (chromium); builds + previews on :4173
```

### Layout

- `App.tsx`: the whole app shell (state, chat pipeline, audio, shortcuts, lazy modal panels). It is
  slated to be split up.
- `constants.ts`: `CHARACTERS` (systemInstruction + voicePrompt per persona), `THEMES`, audio
  presets, `KEYBOARD_SHORTCUTS`, onboarding steps.
- `services/geminiService.ts`: the only module that talks to Gemini (chat + TTS).
- `components/`: lazy-loaded panels (insights, exporter, creator, templates, sound packs, music,
  voice input, emotion/topic visualizers, accessibility, error boundary).
- `hooks/`, `utils/`: voice control/recognition, sessions (`sessionManager`), export, audio
  processing, sound packs, music engine, analytics, cloud sync (Firebase, lazy).
- `public/`: `service-worker.js` (the registered one, via an inline script in `index.html`),
  `sw.js` (legacy, not registered), `audio-processor.worklet.js` (bit-crusher), `manifest.json`.
- `test/` + `components/*.test.tsx`: vitest unit tests. `e2e/`: Playwright specs.

### Gemini integration (facts that bite)

- TTS output is PCM16 LE, 24 kHz, mono, base64. `utils/audio.ts` decodes it as raw PCM with no
  header. Gemini 3.8 TTS models return WAV (a 44-byte RIFF header) by default, so either request
  L16 or strip the header.
- Pronunciation rewrites happen before TTS: SBAITSO -> SUH-BAIT-SO, HAL -> H-A-L, WOPR -> WHOPPER.
- The key must never reach the client bundle. The current `vite.config.ts` `define` inlines it, and
  this already leaked once (rotated 2026-10-01). The fix is a Vercel Function proxy under `api/`.
- The original app came from Google AI Studio (Build). A newer AI Studio copy (app
  `85ea9fa6-f303-4e80-9256-81c22e0f3fbf`) has three features that never reached git: voice
  profiles, a `HELP` command, and a richer Sbaitso prompt. They are scheduled to be ported.

### Personas (behavioural contract for the system prompts)

- **Dr. Sbaitso (1991):** ALL CAPS only; knowledge cutoff 1991; short, robotic, probing questions;
  random "glitches" (PARITY CHECKING, IRQ CONFLICT AT ADDRESS 220H); no emojis, modern slang, or
  breaking character.
- **ELIZA (1966):** Rogerian pattern-matching; reflects questions back; mechanical and repetitive.
- **HAL 9000:** calm, polite, subtly unsettling; over-confident; references the mission and the
  AE-35 unit.
- **JOSHUA/WOPR (1983):** frames everything as games/simulations; childlike curiosity; Global
  Thermonuclear War, tic-tac-toe.
- **PARRY (1972):** suspicious, hostile when questioned, conspiracy thinking, bookies/mafia
  backstory.

### Gotchas

- `vite.config.ts` uses rollup-plugin-visualizer with `open: true`. A plain `vite build` launches a
  browser, and `dist/stats.html` gets deployed. Build with `BROWSER=none` until this is fixed.
- `tsconfig.json` has `strict: false` (pinned by PR #7 because TS 7 defaults to strict on), and
  `tsc` was never clean (64 errors at fab0992).
- Vite 8 rejects object-form `manualChunks`; use `build.rolldownOptions.output.codeSplitting`.
- Coverage thresholds pass only because `coverage.include` is unset, so untested files aren't
  counted.
- E2E specs contain `if (await x.isVisible())` guards that make tests pass vacuously, and they call
  the real API.
- Two service workers exist; only `public/service-worker.js` registers.

### Docs

`README.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`,
`docs/FEATURES.md`, `docs/KEYBOARD_SHORTCUTS.md`. Version reports from v1.x sit in the repo root.
<<< MC-PROJECT-END >>>

