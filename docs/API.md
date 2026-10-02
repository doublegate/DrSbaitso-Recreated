# API Reference

The single reference for the server API, the browser client and the in-repo module APIs. Source
files are the authority: when this page and the code disagree, the code wins and this page is wrong.

Contents:

1. [HTTP API](#1-http-api) — `POST /api/chat`, `POST /api/tts`
2. [Server internals](#2-server-internals) — limits, models, fallback, voices, pronunciation
3. [Browser client](#3-browser-client-srcservicesgeminiservicets) — `src/services/geminiService.ts`
4. [Local persona engines](#4-local-persona-engines) — `src/engine/*`
5. [Audio](#5-audio) — decoding, voice routes, playback
6. [Storage](#6-storage) — sessions, history, sound packs, cloud sync
7. [UI components](#7-ui-components) — `MenuGroup`

---

## 1. HTTP API

Two Vercel Functions proxy Google Gemini. The API key stays on the server; the browser sends a
persona id (or a size-capped custom character), the visible history and the new text.

| Route | Entry | Handler |
| --- | --- | --- |
| `POST /api/chat` | [`api/chat.ts`](../api/chat.ts) | `handleChat` in [`api/_lib/gemini.ts`](../api/_lib/gemini.ts) |
| `POST /api/tts` | [`api/tts.ts`](../api/tts.ts) | `handleTts` in [`api/_lib/gemini.ts`](../api/_lib/gemini.ts) |

Both entries export only `POST(request: Request): Promise<Response>` and delegate to
`serve(request, handler)` in [`api/_lib/http.ts`](../api/_lib/http.ts). In development the Vite
plugin `dev-api` ([`vite.config.ts`](../vite.config.ts)) serves the same modules at the same paths.

### 1.1 Request pipeline (`serve`)

Checks run in this order; the first failure is returned.

| Step | Failure | Status | `code` |
| --- | --- | --- | --- |
| Method is `POST` | other method (response also sets `Allow: POST`) | 405 | `METHOD_NOT_ALLOWED` |
| `GEMINI_API_KEY` is set | key missing or empty | 503 | `NOT_CONFIGURED` |
| Rate limiter allows the client | over 20 requests in the window (also sets `Retry-After: 60`) | 429 | `RATE_LIMITED` |
| `Content-Length` header <= 65536 | declared size too large | 413 | `PAYLOAD_TOO_LARGE` |
| Body text length <= 65536 | body too large | 413 | `PAYLOAD_TOO_LARGE` |
| Body parses as JSON | invalid JSON | 400 | `BAD_REQUEST` |
| Handler validation and model call | see sections 1.3 and 1.4 | | |

On Vercel a non-POST request may be answered by the platform before `serve` runs, so the 405 JSON
body is guaranteed only in development and tests.

Every response is JSON with these headers: `content-type: application/json; charset=utf-8`,
`cache-control: no-store`, `x-content-type-options: nosniff`.

**Error body** (every non-200 response):

```json
{ "code": "BAD_REQUEST", "error": "message must be 1-2000 characters." }
```

The `error` text is safe to show. Upstream error details are logged on the server and never
returned to the client.

### 1.2 Error codes

| `code` | Status | Cause |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | Invalid JSON, wrong shape, unknown persona or voice profile, a limit exceeded |
| `METHOD_NOT_ALLOWED` | 405 | Not a POST |
| `PAYLOAD_TOO_LARGE` | 413 | Body over 64 KiB |
| `RATE_LIMITED` | 429 | Per-client limiter tripped, or Gemini quota (`429`, `RESOURCE_EXHAUSTED`, "quota") on the last model tried |
| `EMPTY_RESPONSE` | 502 | The model returned no text or no audio |
| `UPSTREAM_ERROR` | 502 | Any other Gemini failure, or TTS returned WAV the server could not parse |
| `NOT_CONFIGURED` | 503 | No `GEMINI_API_KEY` |
| `UNAVAILABLE` | 503 | Gemini overloaded (`503`, `UNAVAILABLE`, "overloaded", "high demand") or timed out on the last model tried |

### 1.3 `POST /api/chat`

One conversational turn with a persona.

**Request**

```ts
{
  characterId?: string;                 // a built-in persona id (see section 2.4)
  customCharacter?: {                   // takes precedence over characterId
    name: string;                       // 1-60 characters
    systemInstruction: string;          // 1-4000 characters
  };
  history?: Array<{ role: 'user' | 'model'; text: string }>;  // default []
  message: string;                      // 1-2000 characters
}
```

**Validation**

| Field | Rule | Error message |
| --- | --- | --- |
| body | a JSON object (not an array or null) | `Request body must be a JSON object.` |
| `message` | string, not blank after trimming, length <= 2000 | `message must be 1-2000 characters.` |
| `customCharacter` | if present: object with non-blank `name` (<= 60) and `systemInstruction` (<= 4000) | `customCharacter needs a name (<= 60) and systemInstruction (<= 4000).` |
| `characterId` | used only if `customCharacter` is absent; must match a `CHARACTERS` id | `Unknown character.` |
| either | one of `customCharacter` or `characterId` is required | `Either characterId or customCharacter is required.` |
| `history` | an array | `history must be an array.` |
| `history[i]` | object, `role` is `user` or `model`, `text` is a string of <= 4000 characters (empty allowed) | `history entries must be { role: "user" \| "model", text } within size limits.` |

Lengths are JavaScript string lengths (UTF-16 code units). Every history entry is validated, then
only the last 40 are forwarded. Entries with empty `text` are dropped before the call.

The system instruction is resolved on the server: `customCharacter.systemInstruction`, or the
`systemInstruction` of the matching entry in `CHARACTERS` ([`src/constants.ts`](../src/constants.ts)).
The browser never sends a built-in prompt.

**Model call**: `generateContent` with `systemInstruction`, `thinkingConfig: { thinkingLevel: 'LOW' }`
and a per-attempt `httpOptions.timeout` (section 2.3).

**Response 200**

```json
{ "text": "WHY DO YOU FEEL THAT WAY?" }
```

`text` is the model reply, trimmed. An empty reply is `502 EMPTY_RESPONSE`.

### 1.4 `POST /api/tts`

Synthesises one line as raw PCM16.

**Request**

```ts
{
  text: string;                          // 1-1500 characters
  characterId?: string;                  // a built-in persona id
  voicePrompt?: string;                  // 1-300 characters; used only if characterId is absent
  voiceProfile?: 'classic' | 'deep' | 'glitchy';   // default 'classic'
}
```

**Validation**

| Field | Rule | Error message |
| --- | --- | --- |
| body | a JSON object | `Request body must be a JSON object.` |
| `text` | string, not blank, length <= 1500 | `text must be 1-1500 characters.` |
| `voiceProfile` | a key of `VOICE_PROFILES` (checked even when it will be ignored) | `Unknown voiceProfile.` |
| `characterId` | if present, must match a `CHARACTERS` id | `Unknown character.` |
| `voicePrompt` | if used: string, not blank, length <= 300 | `voicePrompt must be 1-300 characters.` |
| either | one of `characterId` or `voicePrompt` is required | `Either characterId or voicePrompt is required.` |

**Voice selection**

| Request | Prebuilt voice | Style direction | Text sent |
| --- | --- | --- | --- |
| `characterId` with `processing: 'sbaitso'` (Dr. Sbaitso) | `VOICE_PROFILES[voiceProfile].voiceName` | persona `voiceStyle` + `; ` + profile `style` (empty parts dropped) | text after `ttsCase` and pronunciation (section 2.5) |
| `characterId`, any other persona | persona `voiceName` (profile ignored) | persona `voiceStyle` | as above |
| `voicePrompt` only (custom characters) | `DEFAULT_CUSTOM_VOICE` (`Charon`) | `voicePrompt` with a leading `Say in ` and trailing colons or spaces removed | `text` unchanged |

How the style reaches the model depends on the model id:

| Model | Request part |
| --- | --- |
| id starts with `gemini-2.` | `{ text: "Say in <style>: <text>" }` (inline prompt) |
| any other (Gemini 3.x TTS) | `{ text, speechMetadata: { style } }` |

The config is `responseModalities: ['AUDIO']` and
`speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName`.

**Response 200**

```json
{ "audio": "<base64 PCM16 little-endian mono>", "sampleRate": 24000, "mimeType": "audio/L16;rate=24000" }
```

- `sampleRate` comes from the WAV `fmt ` chunk when Gemini returns WAV, otherwise from `rate=` in
  the upstream MIME type, otherwise 24000.
- WAV is unwrapped with `pcmFromWav` (section 2.6). Unparseable WAV is `502 UPSTREAM_ERROR`.
- No audio in the first candidate's first part is `502 EMPTY_RESPONSE`.

### 1.5 Example

```bash
curl -s http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"characterId":"sbaitso","history":[],"message":"I feel sad"}'
```

---

## 2. Server internals

All in [`api/_lib/gemini.ts`](../api/_lib/gemini.ts) unless noted. Everything is a plain function
over an injected `GeminiClient` (`{ models: { generateContent(request): Promise<any> } }`), which is
how [`test/api/gemini.test.ts`](../test/api/gemini.test.ts) runs without network access.

### 2.1 `LIMITS`

| Key | Value | Applies to |
| --- | --- | --- |
| `message` | 2000 | `/api/chat` `message` |
| `historyText` | 4000 | each history `text` |
| `historyTurns` | 40 | history entries forwarded (oldest dropped) |
| `customInstruction` | 4000 | `customCharacter.systemInstruction` |
| `customName` | 60 | `customCharacter.name` |
| `ttsText` | 1500 | `/api/tts` `text` |
| `voicePrompt` | 300 | `/api/tts` `voicePrompt` |
| `bodyBytes` | 65536 (64 KiB) | raw request body (`api/_lib/http.ts`) |
| `attemptTimeoutMs` | 25000 | one model attempt |
| `totalBudgetMs` | 50000 | all attempts together; Vercel `maxDuration` is 60 s ([`vercel.json`](../vercel.json)) |

### 2.2 Environment variables

Read by `serve` from `process.env` (on Vercel) or from `.env.local` via the `dev-api` plugin, which
copies these five keys into `process.env` unless they are already set.

| Variable | Default | Parsing |
| --- | --- | --- |
| `GEMINI_API_KEY` | none | Required; unset or empty gives `503 NOT_CONFIGURED` |
| `GEMINI_CHAT_MODEL` | `gemini-3.8-flash` | Used as-is; empty string means default |
| `GEMINI_TTS_MODEL` | `gemini-3.8-flash-tts` | Used as-is; empty string means default |
| `GEMINI_CHAT_FALLBACK_MODELS` | `gemini-3.7-flash,gemini-3.5-flash,gemini-flash-latest` | Comma-separated, entries trimmed, blanks removed. **Unset** means the defaults; **set but empty** means no fallbacks |
| `GEMINI_TTS_FALLBACK_MODELS` | `gemini-3.8-flash-lite-tts` | Same as above |

Defaults live in `DEFAULT_MODELS`. Gemini quotas are per model; check ids with ListModels before
changing them.

### 2.3 Model fallback and time budget

`withFallbacks(modelIds, now, attempt)` tries `[primary, ...fallbacks]` in order:

- Each attempt gets `min(25000, remaining budget)` ms as `httpOptions.timeout`.
- No attempt starts once 1000 ms or less of the 50000 ms budget remains.
- Overload (`503`, `UNAVAILABLE`, "overloaded", "high demand"), timeout (`TimeoutError`,
  `AbortError`, "timed out", "aborted") and quota (`429`, `RESOURCE_EXHAUSTED`, "quota") errors
  move to the next model, with a `console.warn`.
- Any other error stops at once.
- The last error is mapped by `mapUpstreamError`: quota gives 429 `RATE_LIMITED`, overload or
  timeout gives 503 `UNAVAILABLE`, anything else gives 502 `UPSTREAM_ERROR`.

`Models.now` makes the clock injectable for tests.

### 2.4 Personas, voices and profiles

Built-in personas are `CHARACTERS` in [`src/constants.ts`](../src/constants.ts):

| `id` | `voiceName` | `ttsCase` | `processing` |
| --- | --- | --- | --- |
| `sbaitso` | `Charon` (replaced by the profile's voice) | `upper` | `sbaitso` |
| `eliza` | `Kore` | `sentence` | `clean` |
| `hal9000` | `Algieba` | `sentence` | `hal` |
| `joshua` | `Iapetus` | `sentence` | `wopr` |
| `parry` | `Orus` | `sentence` | `clean` |

Each entry also has `systemInstruction`, `voiceStyle` (sent as the style direction) and a deprecated
`voicePrompt` (`Say in <voiceStyle>`). `voiceProcessingFor(id)` returns the persona's `processing`,
or `'sbaitso'` for custom or unknown ids.

`VOICE_PROFILES` apply to Dr. Sbaitso only (`DEFAULT_VOICE_PROFILE = 'classic'`):

| Profile | `voiceName` | Added style |
| --- | --- | --- |
| `classic` | `Charon` | none |
| `deep` | `Fenrir` | `incredibly deep, resonant and slow` |
| `glitchy` | `Puck` | `slightly unstable, glitchy and robotic, with occasional pitch shifts` |

### 2.5 `toSentenceCase` and `applyPronunciation`

`toSentenceCase(text)`, applied when the persona's `ttsCase` is `'sentence'`:

- Text that already contains a lower-case letter is returned unchanged.
- Otherwise the text is lower-cased, then each sentence starts with a capital and the pronoun "I"
  is capitalised.
- These stay upper case: `AI CPU RAM DOS PC PCS OK TV FBI CIA USA UK IBM ID`, and runs of single
  spelled-out letters such as `C P U`.

`applyPronunciation(characterId, text)` runs after casing:

| Persona | Rewrite |
| --- | --- |
| `sbaitso` | `DR` / `DR.` becomes `DOCTOR`; `SBAITSO` becomes `SBAYT-SO` (case-insensitive) |
| `hal9000` | `HAL` becomes `Hal`; `AE-35` becomes `A E thirty-five` |
| `joshua` | `WOPR` becomes `WHOPPER` in all-caps text, otherwise `Whopper` |
| others | unchanged |

### 2.6 `pcmFromWav(bytes)`

```ts
pcmFromWav(bytes: Uint8Array): { pcm: Uint8Array; sampleRate: number } | null
```

Walks RIFF chunks (word-aligned). It takes the sample rate from `fmt ` (default 24000) and returns
the `data` chunk, clamped to the buffer length. It returns `null` when the input is not
`RIFF....WAVE` or has no `data` chunk.

### 2.7 Rate limiter

`createRateLimiter({ limit, windowMs, now? })` returns `{ check(key): boolean }`, a fixed-window
counter per key. `serve` uses `limit: 20, windowMs: 60_000`.

- The key comes from `clientKey(request)`: the first entry of `x-forwarded-for`, else `x-real-ip`,
  else `'unknown'`.
- When the map passes 10,000 keys, expired windows are swept.
- The state is per function instance, so this is a best-effort first line. The durable limit is a
  Vercel Firewall rule on `/api/*` ([DEPLOYMENT.md](DEPLOYMENT.md)).

`serve(request, handler, { env?, limiter?, createClient? })` accepts these three overrides for tests
([`test/api/http.test.ts`](../test/api/http.test.ts)). The default client factory caches one
`GoogleGenAI` per key.

---

## 3. Browser client (`src/services/geminiService.ts`)

A thin `fetch` wrapper over the two routes. The proxy is stateless, so this module keeps each
history in memory (a module-level `Map`, lost on reload) and sends it with every turn.

### 3.1 Exports

| Export | Signature | Notes |
| --- | --- | --- |
| `getAIResponse` | `(message: string, characterId: string, options?: { customCharacter?: CustomCharacterInput }) => Promise<string>` | Posts `{ characterId \| customCharacter, history, message }` to `/api/chat`. On success it appends the user and model turns to the history stored under `characterId`. With `customCharacter`, `characterId` is only the history key |
| `synthesizeSpeech` | `(text: string, characterId: string, options?: { voiceProfile?: VoiceProfileId; voicePrompt?: string }) => Promise<string>` | Returns base64 PCM16, or `''` for blank text (no request). With `voicePrompt`, sends `voicePrompt` instead of `characterId`. `voiceProfile` is sent only when given. `sampleRate` from the response is discarded |
| `getHistory` | `(characterId: string) => ChatTurn[]` | A copy of the stored history |
| `resetChat` | `(characterId: string) => void` | Forgets one history |
| `resetAllChats` | `() => void` | Forgets all histories |
| `getDrSbaitsoResponse` | `(message: string) => Promise<string>` | Legacy: `getAIResponse(message, 'sbaitso')` |
| `GeminiServiceError` | `class extends Error { code: ServiceErrorCode; status: number }` | Thrown for every failure |
| types | `ChatTurn`, `CustomCharacterInput`, `ServiceErrorCode` | |

History keys in use: persona ids, `parry-engine` (PARRY's directive history, section 4.6) and
`preview_<ms>` keys in `CharacterCreator`, which are reset straight after the preview.

### 3.2 `GeminiServiceError`

| `code` | `status` | When |
| --- | --- | --- |
| `NETWORK_ERROR` | 0 | `fetch` rejected |
| server `code` | HTTP status | non-2xx with a JSON error body (section 1.2) |
| `UNKNOWN` | HTTP status | non-2xx without a parseable `code` (for example a platform HTML error page) |

`message` is `"<status> <code>: <detail>"`, where `detail` is the server `error` or the HTTP status
text. For `RATE_LIMITED` the code is followed by ` RESOURCE_EXHAUSTED`, because older callers detect
rate limiting by matching that string.

The `ServiceErrorCode` union lists `BAD_REQUEST`, `RATE_LIMITED`, `EMPTY_RESPONSE`, `UPSTREAM_ERROR`,
`UNAVAILABLE`, `NOT_CONFIGURED`, `NETWORK_ERROR` and `UNKNOWN`. At runtime `code` can also be
`PAYLOAD_TOO_LARGE` or `METHOD_NOT_ALLOWED`, passed through from the server.

---

## 4. Local persona engines

The hybrid design: a deterministic local engine handles each persona's scripted behaviour, and
Gemini only phrases open conversation. Engines are pure (no React, DOM, network, clock or global
randomness). Every call takes a state and returns a new one, which the caller stores.

### 4.1 Router: `src/engine/personaTurn.ts`

[Source](../src/engine/personaTurn.ts). It routes one Enhanced-mode turn for `eliza`, `parry`,
`hal9000` and `joshua`. Dr. Sbaitso is driven directly by the classic screen
([`ClassicApp.tsx`](../src/components/classic/ClassicApp.tsx)), not by this router.

```ts
personaTurn(personaId: string, engines: PersonaEngines, input: string, ctx: TurnContext)
  : { engines: PersonaEngines; plan: TurnPlan }

interface PersonaEngines { eliza?: ElizaState; parry?: ParryState; hal?: HalState; joshua?: JoshuaState }
interface TurnContext { userName: string; seed: number }   // seed feeds PARRY
```

| `TurnPlan.kind` | Fields | Caller does |
| --- | --- | --- |
| `local` | `lines`, `speak` (joined string, empty means print only), `endsSession?` | Print `lines`, speak `speak` |
| `model` | `message`, `historyKey`, `customCharacter?`, `finalize(text)`, `fallback` | Call `getAIResponse(message, historyKey, { customCharacter })`, show `finalize(reply)`, or `fallback` on failure |
| `ignore` | none | Drop the input (HAL after shutdown) |
| `default` | none | No engine: use the plain model pipeline |

Other exports:

| Export | Description |
| --- | --- |
| `hasEngine(id)` | True for the four personas above |
| `personaOpening(id)` | `[ELIZA_OPENER]` for ELIZA, `[LOGON_PROMPT]` for JOSHUA, else `null` |
| `resetPersona(engines, id)` | Drops one persona's state |
| `hasStarted(engines, id)` | True once that engine has a state |

### 4.2 Dr. Sbaitso: `src/engine/sbaitso`

[Source](../src/engine/sbaitso/index.ts).

```ts
createSbaitsoState(name: string, seed = DEFAULT_SEED): SbaitsoState
processInput(state, rawInput: string): { state; result: EngineResult }
recordReply(state, text: string | readonly string[]): SbaitsoState   // after a model reply
```

| `EngineResult.kind` | Meaning |
| --- | --- |
| `reply` | Local answer: print `lines`, speak `speak`; optional `settings`, `stopSpeech` |
| `model` | Send `message` to the model |
| `parity` | Parity-error routine: `lead`/`leadSpeak`, then `flood` (`PARITY_FLOOD_LENGTH` = 250 lines) with the buzz tone, then `lines`/`speak` |
| `help` | Help `page` 1-3, `more` if `M` shows another; printed only |
| `setting` | Dot command: apply `settings`, print `lines` |
| `repeat` | `R`: speak `lines` again |
| `say` | `SAY <text>`: speak `text` verbatim |
| `exit` | Print and speak `lines`, then show `exitMenuText()` and resolve C/N/Q with `resolveExitChoice(key)` |
| `noop` | Nothing to do |

Also exported:

- Screens: `validateName` (`MAX_NAME_LENGTH` = 20), `greetingLines`, `greetingSpeech`,
  `helpPages`, `exitMenuText`, `isNameCharAllowed`.
- Dot commands: `DEFAULT_SETTINGS`, `DOT_MESSAGES`.
- `CALC`: `evaluateArithmetic`, `calcReply`, `looksArithmetic`.
- Phrase tables: `isParityText`, `parityFlood`.

### 4.3 ELIZA: `src/engine/eliza`

[Source](../src/engine/eliza/index.ts). Weizenbaum's algorithm with the 1965 DOCTOR script. No
model call.

```ts
createElizaState(): ElizaState
elizaRespond(state, input: string): { state; reply: string }        // ALL CAPS, never contains '?'
respondWithScript(script: ElizaScript, state, input): ElizaStep
```

Also exported: `ELIZA_OPENER`, `ELIZA_NOMATCH_REPLIES`, `DOCTOR_SCRIPT_1965`, `parseElizaScript`,
the matcher (`tokenise`, `matchPattern`, `reassemble`) and `elizaHash`.

### 4.4 HAL 9000: `src/engine/hal`

[Source](../src/engine/hal/index.ts).

```ts
createHalState(name: string): HalState         // name sentence-cased
halRespond(state, input: string): { state; result: HalResult }
halSessionTag(state): string   // "[SESSION: CREW MEMBER'S NAME=...; DISCONNECT ATTEMPTS=n]"
```

| `HalResult.kind` | Meaning |
| --- | --- |
| `reply` | Local line (pod-bay refusal, disconnect refusals) |
| `model` | Send `modelMessage` (session tag plus `message`) |
| `shutdown` | Deactivation ending; apply the slow-down from `lines[slowdownFrom]` (the `song`); HAL is then offline |
| `offline` | HAL says nothing |

Also exported: `isDoorRequest`, `isDisconnectRequest`, `DEFAULT_NAME` (`Dave`), and the phrase
tables (`SHUTDOWN_AFTER = DISCONNECT_REFUSALS.length + 1`).

### 4.5 JOSHUA / WOPR: `src/engine/joshua`

[Source](../src/engine/joshua/index.ts).

```ts
createJoshuaState(seed = 1983): JoshuaState
joshuaRespond(state, input: string): { state; result: JoshuaResult }
joshuaSessionTag(flags): string   // "[SESSION: USER=...; LESSON=LEARNED|NOT LEARNED; GAME=...; SIDE=...]"
joshuaFlags(state): JoshuaFlags
```

| `JoshuaResult.kind` | Meaning |
| --- | --- |
| `logon` | Not logged on yet; print, do not speak |
| `list` | Game list or help; print, do not speak |
| `reply` | Local line; print `lines`, speak `speak` |
| `board` | Tic-tac-toe turn: `board`, `outcome`, `lines`, `speak` |
| `lesson` | Zero-player lesson: `games`, `lines`; speak `conclusion` |
| `model` | Send `modelMessage` (session tag plus `message`); `flags` included |

Also exported: tic-tac-toe (`play`, `chooseMove`, `bestMoves`, `legalMoves`, `outcome`, `winner`,
`renderBoard`, `selfPlay`, `EMPTY_BOARD`) and the phrase tables (`LOGON_PROMPT`, `GAME_LIST`,
`CONCLUSION`, and others).

### 4.6 PARRY: `src/engine/parry`

[Source](../src/engine/parry/index.ts). The engine decides the action locally; Gemini only phrases
it.

```ts
createParryState({ strength?: 'WEAK' | 'MILD' | 'STRONG', seed?: number }): ParryState   // default MILD
parryRespond(state, input: string): { state; action: ParryAction }
buildParryPrompt(action, state): { customCharacter: { name; systemInstruction }; message }
finalizeParryLine(text, action): string   // first line, no stage directions, ALL CAPS, <= 160 chars
```

- `ParryAction.kind` is one of `answer`, `flare`, `story`, `delusion`, `evade`, `refuse`,
  `suspicious-query`, `draw-in`, `counter-attack`, `sensitive`, `soften`, `defend`,
  `noncommittal`, `silence`, `bye` or `ended` ([`types.ts`](../src/engine/parry/types.ts)).
- `bye`, `silence` and `ended` stay local.
- Every action carries `fallbackLine`, used offline or when the model fails.
- The prompt is sent as a custom character under history key `parry-engine`. It fits the proxy
  limits (name <= 60, instruction <= 4000, message <= 2000).
- Also exported: `affectTrace` (bars for an emotion panel), the affect model constants, and
  `PARRY_OPENER` (`null`: PARRY waits for the interviewer).

---

## 5. Audio

### 5.1 `src/utils/audio.ts`

[Source](../src/utils/audio.ts).

| Export | Signature | Description |
| --- | --- | --- |
| `decode` | `(base64: string) => Uint8Array` | Base64 to bytes (`atob`) |
| `decodeAudioData` | see below | PCM16 bytes to `AudioBuffer`, then the persona's processing route |
| `getPlaybackSettings` | `(mode: AudioModeId) => { bitDepth: number; playbackRate: number }` | `{ bitDepth: 0, playbackRate: 1 }` in every mode |
| `playAudio` | `(buffer, ctx, bitDepth = 0, playbackRate = 1, useWorklet = true, onStart?) => Promise<void>` | Resolves when playback ends or the source is stopped. `bitDepth` 0 connects straight to the destination; otherwise it uses the `bit-crusher-processor` worklet, falling back to a `ScriptProcessorNode`. `onStart(source)` receives the playing node |
| `playParityTone` | `(ctx, seconds = 4) => void` | Square wave falling from 1 kHz to 700 Hz; never throws |
| `playGlitchSound`, `playErrorBeep` | `(ctx) => void` | Short noise burst; 300 Hz square beep |
| `AuthenticityLevel`, `AudioModeId` | re-exports | |

```ts
decodeAudioData(
  data: Uint8Array,               // PCM16 LE; a RIFF/WAVE header is stripped if present
  ctx: AudioContext,
  sampleRate: number,             // useSpeechPlayer passes 24000
  numChannels: number,            // interleaved channels; useSpeechPlayer passes 1
  audioMode?: AudioModeId,        // 'modern' | 'subtle' | 'authentic' | 'ultra'
  endPunctuation: EndPunctuation = null,  // final pitch contour for the vintage chain
  options: DecodeOptions = {},    // { processing?: VoiceProcessing (default 'sbaitso'); text?: string }
): Promise<AudioBuffer>
```

A trailing odd byte is ignored. The route comes from `resolveVoiceRoute(processing, audioMode)`:

- `vintage` runs `applyVintageProcessing` with the preset for the mode
  ([`vintageAudioProcessing.ts`](../src/utils/vintageAudioProcessing.ts)).
- `hal` and `wopr` run the persona chains, which change the length.
- `none` returns the plain buffer.

### 5.2 Voice routes: `src/utils/voiceRoutes.ts`, `src/utils/personaVoices.ts`

`resolveVoiceRoute(processing, mode?)`:

| `processing` | Route |
| --- | --- |
| `sbaitso` | `vintage` when `mode` is `subtle`, `authentic` or `ultra`; `none` for `modern` or no mode |
| `hal` | `hal` (the audio mode is ignored) |
| `wopr` | `wopr` (the audio mode is ignored) |
| `clean` | `none` |

`processPersonaSamples(route: 'hal' | 'wopr', samples, sampleRate, text?)` dispatches to:

| Function | Chain | Options |
| --- | --- | --- |
| `processHalVoice(input, sampleRate, options?)` | Breath gate, WSOLA slow-down, 50 Hz high-pass, +2 dB shelf at 150 Hz, 2.5:1 compression, RMS about -16 dBFS with peaks at or below -3 dBFS | `HalVoiceOptions`: `tempo?` (default from `text` via `halTempoFor`, or `HAL_DEFAULT_TEMPO` = 0.88), `text?`, `breathGate?` (default true) |
| `processWoprVoice(input, sampleRate, options?)` | At 16 kHz (`WOPR_RATE`): split words, flat-pitch LPC resynthesis per word, band-limit, spliced gaps (80/110/250 ms), back to the input rate, peak -3 dBFS | `WoprVoiceOptions`: `text?`, `seed?` |

Also exported:

- HAL shutdown: `halShutdown(input, sampleRate, u)` and `halShutdownFactors(u)`, with `u` in 0-1.
- WOPR building blocks: `segmentWords`, `planWoprLevels`, `woprBandLimit`.
- Helpers: `breathGate`, `compress`, `countSyllables`, `halTempoFor`.

### 5.3 `src/utils/sharedAudio.ts`

One `AudioContext` for the whole page, created lazily.

| Export | Description |
| --- | --- |
| `getSharedAudioContext()` | Creates the context on first call (`AudioContext` or `webkitAudioContext`); `null` without Web Audio |
| `peekSharedAudioContext()` | The context only if it already exists; never creates one |
| `ensureAudioReady()` | Resumes a suspended context (an error means no user gesture yet, and a later call retries). Loads `/audio-processor.worklet.js` once; a failure is logged and playback falls back to `ScriptProcessorNode`. Returns the context or `null` |
| `__resetSharedAudioForTests()` | Test-only reset |

### 5.4 `src/hooks/useSpeechPlayer.ts`

```ts
const { speak, stop, currentSource, isPlaying } = useSpeechPlayer(mode: AudioModeId);

speak(base64Audio: string, text?: string, options?: {
  processing?: VoiceProcessing;            // default 'sbaitso'
  onStart?: (seconds: number) => void;     // clip duration / playback rate, at start
}): Promise<void>
stop(): void                               // stops the current source; also runs on unmount
```

- Empty `base64Audio`, or no audio context, returns at once.
- Audio is decoded as 24 kHz mono, with the mode current at call time (kept in a ref).
- `text` sets the end punctuation of the vintage pitch contour (via `endPunctuationOf`) and gives
  the HAL and WOPR chains their words.
- The promise resolves when playback ends or is stopped, and rejects if the audio cannot be
  decoded.
- `currentSource` and `isPlaying` are React state for visualisers.

---

## 6. Storage

### 6.1 `SessionManager` (`src/utils/sessionManager.ts`)

A static class over `localStorage`. Every method catches storage errors, logs them, and returns a
safe default.

| Key | Contents |
| --- | --- |
| `sbaitso_sessions` | `ConversationSession[]` |
| `sbaitso_current_session` | the last saved session |
| `sbaitso_settings` | `AppSettings` |
| `sbaitso_stats` | `SessionStats` |

| Method | Description |
| --- | --- |
| `createSession(characterId, themeId, audioQualityId)` | New in-memory session (`session_<ms>_<random>`); not saved |
| `saveSession(session)` | Upsert by `id`; also sets the current session |
| `mergeSessions(incoming)` | Cloud-sync upsert. Unknown ids are added; a known id is replaced only if `incoming.updatedAt` is newer. The current-session pointer is left alone. Returns the number written; writes nothing if 0 |
| `getCurrentSession()` / `getAllSessions()` | All sessions, sorted by `updatedAt`, newest first |
| `deleteSession(id)` / `clearAllSessions()` | Delete clears the current pointer if it matches |
| `getSettings()` / `saveSettings(partial)` | Defaults: `sbaitso`, `dos-blue`, `default` quality, `authentic` mode, sound on, autoscroll on |
| `updateStats(session)` / `getStats()` / `resetStats()` | Usage counters |
| `incrementGlitchCount(session, response)` | +1 when `isParityText(response)` |
| `getMessagesInDateRange`, `calculateDateRange`, `getInsightsData`, `calculateSessionStats` | Insights queries over saved sessions |

### 6.2 `useSessionHistory` (`src/hooks/useSessionHistory.ts`)

History is **opt-in**: nothing is written unless `localStorage['sbaitso_keep_history'] === 'true'`
(`KEEP_HISTORY_KEY`).

```ts
const { keepHistory, setKeepHistory, currentSession, savedSessions, mergeSessions } =
  useSessionHistory(messages: Message[], { characterId, themeId, audioQualityId });
```

| Field | Behaviour |
| --- | --- |
| `currentSession` | Always available in memory while `messages` is non-empty; emptying `messages` starts a new session id |
| auto-save | With history on, `SessionManager.saveSession` runs 1000 ms after the last change |
| `setKeepHistory(false)` | Removes the flag **and deletes all saved sessions** |
| `savedSessions` | `[]` while history is off |
| `mergeSessions(incoming)` | Returns 0 and stores nothing while history is off |

### 6.3 Sound pack store (`src/utils/soundPackStore.ts`)

IndexedDB database `DrSbaitsoSoundPacks` (version 1), object store `packs`, key path `id`. A record
is `{ id: pack.metadata.name, pack, savedAt }`.

| Function | Description |
| --- | --- |
| `listSoundPacks()` | All packs, oldest `savedAt` first |
| `getSoundPack(name)` | One pack or `null` |
| `saveSoundPack(pack)` | Validates (`validateSoundPack`), normalises (`normalizeSoundPack`), and replaces any pack with the same name. Throws `Invalid sound pack: ...` |
| `deleteSoundPack(name)` | Removes one pack |
| `resetSoundPackStoreForTests()` | Test-only |

- Every read first migrates packs from the legacy `localStorage` key `dr_sbaitso_sound_packs`
  (`LEGACY_SOUND_PACKS_KEY`). Invalid packs are skipped, and the key is then removed.
- Without IndexedDB every call rejects with `Sound packs need IndexedDB, which this browser has
  disabled`.
- The pack format is in [`soundPackFormat.ts`](../src/utils/soundPackFormat.ts) and
  [SOUND_PACKS_GUIDE.md](SOUND_PACKS_GUIDE.md).

### 6.4 Cloud sync (`src/utils/cloudSync.ts`)

Optional Firestore sync with a Firebase project the user supplies; nothing is hard-coded. Firebase
is loaded with dynamic `import()` only. See [CLOUD_SYNC.md](CLOUD_SYNC.md) for setup.

**`parseFirebaseConfig(input: unknown): FirebaseConfig`** accepts an object, a JSON string, or the
console's JS snippet (`key: "value"` pairs). It returns only the known fields. On failure it throws
`Invalid Firebase web config: <every problem>`, or a prompt to paste the config if the input is not
an object.

| Field | Required | Rule |
| --- | --- | --- |
| `apiKey` | yes | `AIza` plus 35 of `[0-9A-Za-z_-]` |
| `authDomain` | yes | host name, `/^[a-z0-9.-]+\.[a-z]{2,}$/i` |
| `projectId` | yes | `/^[a-z0-9][a-z0-9-]{2,62}$/` |
| `appId` | yes | `/^\d+:\d+:web:[0-9a-f]+$/i` |
| `storageBucket`, `messagingSenderId`, `measurementId` | no | kept if a non-blank string of <= 200 characters |

**`CloudSync`** is a singleton (`CloudSync.getInstance()`).

| Member | Description |
| --- | --- |
| `initialize(config \| string)` | Validates, then sets up Firebase app, Firestore (persistent multi-tab cache) and Auth. Saves the config to `localStorage['cloudSyncFirebaseConfig']`. A second call while initialised is a no-op |
| `getSavedConfig()` / `forgetSavedConfig()` | Static; the saved config is re-validated on read |
| `signInAnonymously()` / `signOut()` | Anonymous auth (per browser profile) |
| `uploadData(partial)` | `setDoc(users/{uid}, ..., { merge: true })` with `deviceId` and `serverUpdatedAt`. Rejects payloads over 1,000,000 characters of JSON |
| `downloadData()` | The document or `null`; `updatedAt` normalised to ms |
| `syncData(local)` | Last write wins: uploads when local `updatedAt` is newer (or there is no cloud doc) and returns `null`; otherwise returns the cloud data for the caller to apply |
| `setLocalDataProvider(fn)` / `syncNow()` | Auto-sync source; `syncNow` emits `remote-data` when the cloud copy wins |
| `subscribeToChanges(cb)` | `onSnapshot`; ignores this device's own writes |
| `startAutoSync()` / `stopAutoSync()` / `updateOptions(partial)` | Options are saved in `cloudSyncOptions`; `syncInterval` is clamped to 10 s - 1 h |
| `on(event, cb)` / `off(event, cb)` | Events: `auth-state-changed`, `status-changed`, `options-changed`, `sync-start`, `sync-complete`, `sync-error`, `remote-change`, `remote-data`, `online`, `offline` |
| `dispose()` / `resetForTests()` | Tear down |

Data lives at `users/{uid}`. The Firestore security rules of the user's project must restrict that
document to its owner.

---

## 7. UI components

### 7.1 `MenuGroup` (`src/components/enhanced/MenuGroup.tsx`)

A labelled toolbar menu (disclosure pattern).

```tsx
<MenuGroup label="SOUND" items={[{ id: 'music', label: 'Music player', shortcut: 'Alt+Shift+M', onSelect }]} />

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;   // rendered in <kbd>
  active?: boolean;    // sets aria-pressed; omitted means no aria-pressed
  disabled?: boolean;
  onSelect: () => void;
}
```

The trigger is a button with `aria-expanded` and `aria-controls`; the open list is
`role="group"` with `aria-label={label}`.

| Interaction | Effect |
| --- | --- |
| Open | Focuses the first enabled item |
| ArrowDown / ArrowUp | Cycle through enabled items |
| Escape | Closes and returns focus to the trigger |
| Mouse down outside | Closes |
| Choosing an item | Closes, then calls `onSelect` |
