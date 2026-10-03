# Troubleshooting

Start with the browser console (F12) for client problems, and with the terminal running
`npm run dev` (or the Vercel function logs) for `/api` problems. Deployment-specific
problems are also covered in [DEPLOYMENT.md](DEPLOYMENT.md).

## Replies

A failed reply prints an in-character message. The known ones tell you the cause:

| Message | Cause | Fix |
|---|---|---|
| `SYSTEM NOT CONFIGURED. THE OPERATOR MUST INSTALL AN API KEY.` | The server has no `GEMINI_API_KEY` (`NOT_CONFIGURED`, 503) | Locally: `cp .env.example .env.local`, set the key, restart `npm run dev`. On Vercel: set it for the environment you are using (Preview and Production are separate) and redeploy. |
| `SYSTEM OVERLOAD. TOO MANY REQUESTS. ...` | Rate limit (`RATE_LIMITED`, 429): the proxy's 20 requests per minute per client, or the Gemini quota on every configured model | Wait a minute. Quotas are per model; check `GEMINI_CHAT_FALLBACK_MODELS`. |
| `MY PROCESSOR IS BUSY. ...` | Every model was overloaded or timed out within the 50-second budget (`UNAVAILABLE`, 503) | Try again; Gemini overloads are usually brief. |
| `CARRIER LOST. PLEASE CHECK YOUR CONNECTION.` | The browser could not reach `/api` | Check the connection. Enhanced mode shows OFFLINE in the status bar. |
| A random DOS-style fault (`INTERNAL PROCESSOR FAULT`, `GENERAL FAILURE READING DRIVE C`, ...) | Anything else: a bad request, an upstream error, an empty model response | See the console and the server log for the error code. |

Other cases:

- **`npm run preview` gives no replies**: `vite preview` serves only static files. Use
  `npm run dev` (which serves `api/*` through a dev middleware) or `vercel dev`.
- **ELIZA answers but the others do not**: ELIZA runs entirely in the browser; the others
  need `/api` for open conversation. Their scripted parts (Dr. Sbaitso's commands,
  JOSHUA's games, HAL's pod bay refusal) still work offline.
- **PARRY answers but sounds generic**: when the model call fails, PARRY uses a written
  fallback line for the move its engine chose.
- **Very long conversations start failing**: each request resends the persona's history,
  and the server rejects bodies over 64 KiB (`PAYLOAD_TOO_LARGE`). Clear the
  conversation (CONVERSATION menu) to start fresh.

## Speech

- **Text appears but nothing is spoken**: speech degrades on purpose. If TTS fails
  (quota, overload) or audio cannot play, the reply text is kept and the session
  continues. Check the console for "speech unavailable".
- **No sound at all at first**: browsers keep audio locked until you click or type. On
  the classic screen the very first start is silent; type to unlock it. Enhanced mode
  unlocks audio when you submit your name.
- **SPEECH MUTED in the status bar**: unmute from the SOUND menu or say "unmute".
- **The voice sounds clean, not 8-bit**: the audio mode is Modern, or the persona is not
  Dr. Sbaitso. The vintage chain applies to Dr. Sbaitso (and custom characters) only;
  ELIZA and PARRY play clean, HAL and JOSHUA have their own chains. See
  [AUDIO_SYSTEM.md](AUDIO_SYSTEM.md).
- **iOS is silent**: check the ring/silent switch, which mutes Web Audio.

## Classic screen

- **I see the blue DOS screen but want the old interface**: press **Alt+Shift+X**, open
  `/?mode=enhanced`, or Tab to the "Switch to the enhanced interface" link. The choice is
  remembered (`sbaitso_ui_mode` in localStorage).
- **Typing does nothing**: click the screen to refocus the hidden input. Input is ignored
  while the program starts; an Enter pressed while the doctor speaks is kept and taken as
  the next line.
- **The name is rejected**: as in the original, names take letters and spaces only, and
  there is a length limit (`NAME TOO LONG`).
- **The text is small on a phone**: below 720x400 the screen shrinks to fit the whole
  80x25 grid. Turn the phone to landscape or use Enhanced mode.

## Enhanced mode

- **Search, replay and insights are empty**: history is off by default. Tick SAVE
  HISTORY in the status bar; only conversations from then on are kept. Turning it off
  erases them.
- **Shortcuts do nothing**: they are Alt+Shift+&lt;key&gt; (Option+Shift on macOS), not
  Ctrl or Cmd. See [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md).
- **The voice profile selector is missing**: it shows only while Dr. Sbaitso is the
  persona.
- **The tutorial keeps appearing**: it shows until it is completed or skipped once
  (`sbaitso_onboarding_completed`).
- **Voice input or hands-free control is unavailable**: Firefox has no Web Speech API.
  See [VOICE_INPUT.md](VOICE_INPUT.md) and [VOICE_CONTROL.md](VOICE_CONTROL.md).
- **A sound pack does not save**: the creator stays open and shows the reason; the usual
  ones are the per-sound (500 KB) or pack (5 MB) limit. See
  [SOUND_PACKS_GUIDE.md](SOUND_PACKS_GUIDE.md).
- **Cloud sync does not connect or sync**: see the table in [CLOUD_SYNC.md](CLOUD_SYNC.md).

## Updates and offline

- **"A NEW VERSION IS AVAILABLE"**: a deploy changed the app. RELOAD applies it now;
  LATER keeps the current conversation and applies it next time.
- **An old version keeps loading**: browsers that installed the v1.x service worker are
  moved to the new one automatically. If something is stuck, open DevTools >
  Application > Service workers, unregister, and reload. See [PWA.md](PWA.md).
- **Offline**: the app shell loads offline after one visit; replies and speech need the
  network.

## Development

| Problem | Fix |
|---|---|
| `npm ci` fails or tests crash on startup | Use Node 22.12 or newer (24 recommended); jsdom 30 needs it |
| Port 3000 in use | `npm run dev -- --port 3001` |
| The dev server is not reachable from another device | It binds to `localhost`; use `npm run dev -- --host` |
| The dev server logs CSP violations | The dev CSP matches production (relaxed only for hot reloading); new external hosts must be added in `src/utils/security.ts` and `vercel.json` |
| `npm run check:secrets` fails | Something shaped like a Google API key is in `dist/`; keys belong only in server environment variables |
| A test about `SpeechRecognition` fails after `vi.stubGlobal` | `test/setup.ts` defines it as writable but non-configurable; assign it instead |
| e2e tests fail to start | `npx playwright install chromium`; the suite builds and serves on port 4173 |

The gates are listed in [TESTING.md](TESTING.md).
