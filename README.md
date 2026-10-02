# Dr. Sbaitso Recreated

> The 1991 Sound Blaster "AI therapist", rebuilt for the web with Google Gemini for conversation and speech.

[![Live demo](https://img.shields.io/badge/demo-dr--sbaitso--recreated.vercel.app-000080)](https://dr-sbaitso-recreated.vercel.app)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-7%20(strict)-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)

Type your name, and DOCTOR SBAITSO greets you in ALL CAPS with a crunchy, synthesised
voice, then asks about your problems — just like the DOS original that shipped with
Creative Labs sound cards. Four other classic computer personalities (ELIZA, HAL 9000,
JOSHUA/WOPR and PARRY) are also built in.

**Try it:** <https://dr-sbaitso-recreated.vercel.app>

> **Status (October 2026):** version 2.0 is in progress on
> `fix/v2-audit-remediation`. It fixes the crash that broke the live site, moves the
> Gemini key server-side, and reconnects several features that existed in the code
> but could not be reached from the UI. Items marked *(2.0)* below are still being
> wired up. See [CHANGELOG.md](CHANGELOG.md).

## Features

- **Five vintage personalities** with period-accurate system prompts, plus a character
  creator for your own *(2.0: persona selector)*.
- **Authentic voice**: Gemini text-to-speech run through Sound Blaster-style processing
  (11 kHz, 8-bit, band-limited), with four audio modes from *Modern* to *Ultra
  Authentic*, and three voice profiles *(2.0: profile selector)*.
- **Retro terminal UI**: five themes plus a theme customiser, a typewriter effect, and
  glitches such as `PARITY CHECKING...`.
- **Conversation tools**: emotion and topic visualisations and templates, plus
  search, replay, an insights dashboard and export to Markdown, text, JSON, HTML,
  CSV and print *(2.0: session saving, which these depend on)*.
- **Voice**: speech input and hands-free voice commands (Web Speech API).
- **Sound**: retro UI sound effects, procedural chiptune music and custom sound packs.
- **Accessible and installable**: keyboard shortcuts, screen-reader support, high
  contrast and font scaling; installs as a PWA.

See [docs/FEATURES.md](docs/FEATURES.md) for the full guide and
[docs/KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md) for shortcuts.

## Quick start

Requires Node.js 22.12+ (24 recommended) and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/doublegate/DrSbaitso-Recreated.git
cd DrSbaitso-Recreated
npm ci
cp .env.example .env.local   # then set GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server, including the `/api` functions |
| `npm run build` / `npm run preview` | Production build and local preview |
| `npm run test:run` | Unit and integration tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, Chromium) |
| `npm run typecheck` / `npm run lint` | TypeScript (strict) and oxlint |
| `npm run analyze` | Bundle size report in `reports/` |

## How it works

```
Browser (React SPA)                     Vercel Functions                Google Gemini
 chat UI, typewriter, audio  ── POST /api/chat ──▶ validate, rate-limit ──▶ gemini-3.8-flash
 Web Audio vintage pipeline  ── POST /api/tts ───▶ persona voice + style ─▶ gemini-3.8-flash-tts
                                                   (model fallback on 503/429)
```

The browser never holds the API key. The functions in [`api/`](api) look up each
persona's system prompt on the server, keep requests within size limits, and convert
the TTS output to raw PCM. The client then plays that PCM through a bit-crushing
Web Audio pipeline.
Architecture details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deployment

Deploy to Vercel with the included `vercel.json`, and set `GEMINI_API_KEY` under
**Project → Settings → Environment Variables** for Production and Preview. Optional
model overrides are listed in [`.env.example`](.env.example). See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for other hosts and for rate-limit settings.

## Documentation

- [CHANGELOG.md](CHANGELOG.md): release history
- [docs/TESTING.md](docs/TESTING.md): test strategy and how to run each suite
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): common problems
- [CONTRIBUTING.md](CONTRIBUTING.md): how to contribute
- [ROADMAP.md](ROADMAP.md): what's next

## Credits

The original Dr. Sbaitso was created by Creative Labs (1991) for MS-DOS and Sound
Blaster cards. This is an unofficial fan recreation and is not affiliated with Creative
Technology. It started as a Google AI Studio app and is built with React, Vite and
Google Gemini.

<div align="center">

**TELL ME ABOUT YOUR PROBLEMS.**

</div>
