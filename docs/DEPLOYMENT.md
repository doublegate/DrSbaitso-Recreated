# Deployment Guide

Dr. Sbaitso Recreated is a Vite single-page app plus two small server functions
(`api/chat.ts`, `api/tts.ts`) that call Google Gemini. The functions hold the API key;
the browser never sees it. **Vercel is the supported host**, and `vercel.json` in the
repository configures everything below.

## Requirements

- Node.js 22.12 or newer (24 recommended; Vercel builds on 24.x via `engines`)
- A Gemini API key from <https://aistudio.google.com/apikey>

## Environment variables

These are read only by the server functions (and by the dev server's `/api`
middleware locally). They are never bundled into client code.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | yes | none | Gemini API key |
| `GEMINI_CHAT_MODEL` | no | `gemini-3.8-flash` | Chat model |
| `GEMINI_TTS_MODEL` | no | `gemini-3.8-flash-tts` | Speech model |
| `GEMINI_CHAT_FALLBACK_MODELS` | no | `gemini-3.7-flash,gemini-3.5-flash,gemini-flash-latest` | Tried in order on overload (503), quota (429) or timeout |
| `GEMINI_TTS_FALLBACK_MODELS` | no | `gemini-3.8-flash-lite-tts` | Same, for speech |

Set a fallback list to an empty value to disable fallbacks. Quotas on Gemini keys
apply per model, so fallbacks keep the app answering when one model's quota is used
up.

Locally: `cp .env.example .env.local` and fill in `GEMINI_API_KEY`.

## Vercel

1. Import the GitHub repository in Vercel. The framework is detected as Vite, and
   `vercel.json` sets the build command, the output directory, the function
   settings and the headers.
2. Under **Project → Settings → Environment Variables**, add `GEMINI_API_KEY` for
   **Production** and **Preview**.
3. Deploy. Every push to a branch gets a Preview deployment; `main` deploys to
   production.

What `vercel.json` configures:

- `api/*.ts` run as Node.js functions with a 60-second limit. The proxy keeps all
  model attempts inside a 50-second budget.
- All non-`/api` paths rewrite to `index.html` (SPA routing).
- Security headers on every response: HSTS, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy` and a `Permissions-Policy` that allows only the microphone.
- `no-cache` for the service worker, the audio worklet and the manifest, so updates
  arrive promptly. Hashed `assets/` are cached as immutable.

### Rate limiting

Each function instance applies a best-effort limit of 20 requests per minute per
client IP. Instances do not share state, so for a durable limit add a Vercel
Firewall rule: **Project → Firewall → Rate Limiting**, path `/api/`, for example 30
requests per minute per IP. Usage is also bounded by your Gemini key's own quota.

### Verifying a deployment

```bash
URL=https://<your-deployment>.vercel.app
# Valid request: 200 with {"text": "..."}
curl -s -X POST $URL/api/chat -H 'content-type: application/json' \
  -d '{"characterId":"sbaitso","history":[],"message":"Hello"}'
# Invalid persona: 400 BAD_REQUEST
curl -s -X POST $URL/api/chat -H 'content-type: application/json' \
  -d '{"characterId":"nope","message":"hi"}'
# No key in any served script: should print nothing
for a in $(curl -s $URL/ | grep -oE '/assets/[^"]+\.js'); do curl -s $URL$a | grep -l AIza; done
```

Preview deployments are behind Vercel Authentication by default. Use a shareable
link from the Vercel dashboard (or the Vercel CLI) to test them.

Error codes returned by the API: `BAD_REQUEST` (400), `METHOD_NOT_ALLOWED` (405),
`PAYLOAD_TOO_LARGE` (413), `RATE_LIMITED` (429), `EMPTY_RESPONSE` and
`UPSTREAM_ERROR` (502), `UNAVAILABLE` and `NOT_CONFIGURED` (503). The UI shows an
in-character message for each.

## Other hosts

Purely static hosting (GitHub Pages, S3, a plain nginx container) is **not enough
on its own**, because chat and speech need the `/api` functions. The handlers use
the Web-standard `Request`/`Response` API (`export function POST(request)`), so
they can be adapted to Netlify Functions, Cloudflare Workers or a small Node server
with a thin wrapper. This repository does not ship such adapters yet. Whatever the
host, keep `GEMINI_API_KEY` server-side only.

## Local production preview

```bash
npm run build && npm run preview   # http://localhost:4173 (static only: no /api)
npm run dev                        # http://localhost:3000 (includes /api)
```

`vite preview` serves only the static build. Use `npm run dev`, or `vercel dev`
with the Vercel CLI, to exercise the functions locally.

## Rollback

In the Vercel dashboard, open **Deployments**, choose an earlier production
deployment, and select **Promote to Production** (or **Instant Rollback**).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Replies say "SYSTEM NOT CONFIGURED" | `GEMINI_API_KEY` is missing from this environment (check Preview vs Production) |
| Replies say "SYSTEM OVERLOAD" or "PROCESSOR IS BUSY" | Gemini quota or overload on every configured model; wait, or add fallback models |
| Text but no voice | Speech is degrading on purpose: TTS failed (quota) or audio could not play; the text is kept |
| Build warns about Node | Use Node 22.12+; Vercel follows `engines` in `package.json` |
