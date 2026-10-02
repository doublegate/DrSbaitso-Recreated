# ADR-0001: Gemini behind a server proxy

- Status: Accepted
- Date: 2026-10-01

## Context

Through v1.11 the browser called Gemini directly. `vite.config.ts` inlined
`GEMINI_API_KEY` into the bundle with `define`, so the production JavaScript
served by Vercel contained a working key that anyone could copy. The module also
threw at import time when the key was missing, which turned a missing environment
variable into a blank page, and the bundler then dropped most of the app.

Any client-side design leaks the key: a browser cannot keep a secret.

## Decision

All model traffic goes through two Vercel Node functions, `api/chat.ts` and
`api/tts.ts`, which share `api/_lib/gemini.ts` and `api/_lib/http.ts`. They are
the only code that reads `GEMINI_API_KEY`.

- The server resolves persona instructions from the persona id. A custom
  character's instruction is accepted from the client, capped and treated as
  untrusted text.
- Every input is validated and capped (message, history, body size), and a
  per-instance rate limiter answers 429 when exceeded. A Vercel Firewall rule is
  the durable limit.
- The functions are stateless. The browser keeps each persona's history and sends
  it with every turn (`src/services/geminiService.ts`).
- Overloaded, rate-limited and slow models fall back to the next model within a
  50-second budget. The model ids are environment-configurable.
- TTS audio is returned as raw PCM16 at 24 kHz; a WAV header from newer models is
  stripped on the server.
- A missing key gives a typed `NOT_CONFIGURED` error, never a crash.
- The leaked key was rotated.

## Consequences

- The key never reaches the client. `npm run check:secrets` fails the build if
  `dist/` contains anything shaped like a Google API key, and the CSP's
  `connect-src` does not allow the Gemini host at all.
- `npm run dev` needs the functions too: a dev-only Vite middleware serves `api/*`
  through `ssrLoadModule` with `.env.local` loaded.
- Each turn resends the conversation, which costs input tokens; history is capped.
- Hosting is tied to a platform with serverless functions. The handlers use the
  standard `Request`/`Response` API, so another host needs only a thin adapter.
