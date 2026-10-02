/**
 * Server-side Gemini proxy logic shared by the `api/chat` and `api/tts`
 * Vercel Functions (and by the Vite dev server middleware).
 *
 * The API key never leaves the server: the browser posts a persona id (or a
 * size-capped custom character), the visible conversation history and the new
 * message, and gets back text or raw PCM16 audio.
 *
 * Everything here is plain functions over an injected client so it can be
 * unit-tested without network access.
 */
import {
  CHARACTERS,
  VOICE_PROFILES,
  DEFAULT_VOICE_PROFILE,
  type VoiceProfileId,
} from '../../constants.js';

export const LIMITS = {
  /** Characters in one user message. */
  message: 2000,
  /** Characters in one history turn. */
  historyText: 4000,
  /** History turns forwarded to the model (older turns are dropped). */
  historyTurns: 40,
  /** Characters in a custom character's system instruction. */
  customInstruction: 4000,
  customName: 60,
  /** Characters synthesised in one TTS request. */
  ttsText: 1500,
  /** Characters in a custom voice prompt. */
  voicePrompt: 300,
  /** Raw request body size accepted by the HTTP layer. */
  bodyBytes: 64 * 1024,
  /** Longest a single model attempt may take before moving on. */
  attemptTimeoutMs: 25_000,
  /** Budget for all attempts together; stays under the 60 s function limit. */
  totalBudgetMs: 50_000,
} as const;

export const DEFAULT_MODELS = {
  chat: 'gemini-3.8-flash',
  tts: 'gemini-3.8-flash-tts',
  // Tried in order when the primary model is overloaded (HTTP 503).
  chatFallbacks: ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'],
  ttsFallbacks: ['gemini-3.8-flash-lite-tts'],
};

export interface Models {
  chat: string;
  tts: string;
  chatFallbacks?: string[];
  ttsFallbacks?: string[];
  /** Clock for the attempt budget; injectable for tests. */
  now?: () => number;
}

/** The subset of `GoogleGenAI` this module uses. */
export interface GeminiClient {
  models: {
    generateContent(request: any): Promise<any>;
  };
}

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'EMPTY_RESPONSE'
  | 'UPSTREAM_ERROR'
  | 'UNAVAILABLE'
  | 'NOT_CONFIGURED'
  | 'METHOD_NOT_ALLOWED'
  | 'PAYLOAD_TOO_LARGE';

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export function fail(status: number, code: ErrorCode, error: string): ApiResult {
  return { status, body: { code, error } };
}

const badRequest = (error: string) => fail(400, 'BAD_REQUEST', error);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const nonEmptyString = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function findCharacter(id: unknown) {
  return typeof id === 'string' ? CHARACTERS.find((c) => c.id === id) : undefined;
}

/** Character-specific spelling hints so TTS pronounces names correctly. */
export function applyPronunciation(characterId: string | undefined, text: string): string {
  switch (characterId) {
    case 'sbaitso':
      return text.replace(/SBAITSO/g, 'SUH-BAIT-SO');
    case 'hal9000':
      return text.replace(/\bHAL\b/g, 'H-A-L');
    case 'joshua':
      return text.replace(/WOPR/g, 'WHOPPER');
    default:
      return text;
  }
}

/** Converts a legacy "Say in a ... voice" prompt into a bare style phrase. */
function styleFromVoicePrompt(prompt: string): string {
  return prompt.replace(/^say\s+in\s+/i, '').replace(/[:\s]+$/, '');
}

function upstreamStatus(error: unknown): number {
  return Number((error as { status?: unknown })?.status ?? (error as { code?: unknown })?.code);
}

const errorMessage = (error: unknown) => String((error as { message?: unknown })?.message ?? '');

function isOverloaded(error: unknown): boolean {
  return upstreamStatus(error) === 503 || /UNAVAILABLE|overloaded|high demand/i.test(errorMessage(error));
}

function isTimeout(error: unknown): boolean {
  const name = String((error as { name?: unknown })?.name ?? '');
  return name === 'TimeoutError' || name === 'AbortError' || /timed? ?out|aborted/i.test(errorMessage(error));
}

function isQuota(error: unknown): boolean {
  return upstreamStatus(error) === 429 || /RESOURCE_EXHAUSTED|quota/i.test(errorMessage(error));
}

/**
 * Runs `attempt` against each model in turn. Overload, timeout and quota
 * errors move on to the next model (Gemini quotas are per model); anything
 * else is final. Each attempt gets `attemptTimeoutMs`, and no attempt starts
 * once the overall budget is spent.
 */
async function withFallbacks<T>(
  modelIds: string[],
  now: () => number,
  attempt: (model: string, timeoutMs: number) => Promise<T>,
): Promise<T> {
  const deadline = now() + LIMITS.totalBudgetMs;
  let lastError: unknown;
  for (const model of modelIds) {
    const remaining = deadline - now();
    if (remaining <= 1000) break;
    try {
      return await attempt(model, Math.min(LIMITS.attemptTimeoutMs, remaining));
    } catch (error) {
      lastError = error;
      if (!isOverloaded(error) && !isTimeout(error) && !isQuota(error)) throw error;
      console.warn(`[gemini] ${model} unavailable (${upstreamStatus(error) || 'timeout'}); trying next model`);
    }
  }
  throw lastError;
}

function mapUpstreamError(error: unknown): ApiResult {
  const status = upstreamStatus(error);
  const message = errorMessage(error);
  if (isQuota(error)) {
    return fail(429, 'RATE_LIMITED', 'The model is rate limited. Try again shortly.');
  }
  if (isOverloaded(error) || isTimeout(error)) {
    return fail(503, 'UNAVAILABLE', 'The model is busy. Try again in a moment.');
  }
  // Log the detail server-side only; never echo upstream messages to clients.
  console.error('[gemini] upstream error', status || '', message.slice(0, 300));
  return fail(502, 'UPSTREAM_ERROR', 'The model request failed.');
}

// ---------------------------------------------------------------- chat

export async function handleChat(raw: unknown, client: GeminiClient, models: Models): Promise<ApiResult> {
  if (!isObject(raw)) return badRequest('Request body must be a JSON object.');

  const { characterId, customCharacter, history = [], message } = raw;

  if (!nonEmptyString(message, LIMITS.message)) {
    return badRequest(`message must be 1-${LIMITS.message} characters.`);
  }

  let systemInstruction: string;
  if (customCharacter !== undefined) {
    if (
      !isObject(customCharacter) ||
      !nonEmptyString(customCharacter.name, LIMITS.customName) ||
      !nonEmptyString(customCharacter.systemInstruction, LIMITS.customInstruction)
    ) {
      return badRequest(
        `customCharacter needs a name (<= ${LIMITS.customName}) and systemInstruction (<= ${LIMITS.customInstruction}).`,
      );
    }
    systemInstruction = customCharacter.systemInstruction;
  } else if (characterId !== undefined) {
    const character = findCharacter(characterId);
    if (!character) return badRequest('Unknown character.');
    systemInstruction = character.systemInstruction;
  } else {
    return badRequest('Either characterId or customCharacter is required.');
  }

  if (!Array.isArray(history)) return badRequest('history must be an array.');
  const turns: ChatTurn[] = [];
  for (const turn of history) {
    if (
      !isObject(turn) ||
      (turn.role !== 'user' && turn.role !== 'model') ||
      typeof turn.text !== 'string' ||
      turn.text.length > LIMITS.historyText
    ) {
      return badRequest('history entries must be { role: "user" | "model", text } within size limits.');
    }
    turns.push({ role: turn.role, text: turn.text });
  }

  const contents = [...turns.slice(-LIMITS.historyTurns), { role: 'user' as const, text: message }]
    .filter((t) => t.text.length > 0)
    .map((t) => ({ role: t.role, parts: [{ text: t.text }] }));

  try {
    const response = await withFallbacks(
      [models.chat, ...(models.chatFallbacks ?? [])],
      models.now ?? Date.now,
      (model, timeout) =>
        client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            // Short persona replies gain nothing from long hidden reasoning,
            // and it roughly doubles latency and cost.
            thinkingConfig: { thinkingLevel: 'LOW' },
            httpOptions: { timeout },
          },
        }),
    );
    const text = typeof response?.text === 'string' ? response.text.trim() : '';
    if (!text) return fail(502, 'EMPTY_RESPONSE', 'The model returned no text.');
    return { status: 200, body: { text } };
  } catch (error) {
    return mapUpstreamError(error);
  }
}

// ---------------------------------------------------------------- tts

/**
 * Extracts PCM samples from a RIFF/WAVE container by walking its chunks.
 * Returns null when the bytes are not a PCM WAV file.
 */
export function pcmFromWav(bytes: Uint8Array): { pcm: Uint8Array; sampleRate: number } | null {
  const tag = (o: number) => String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
  if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let sampleRate = 0;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = tag(offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ' && body + 8 <= bytes.length) {
      sampleRate = view.getUint32(body + 4, true);
    } else if (id === 'data') {
      const end = Math.min(body + size, bytes.length);
      return { pcm: bytes.slice(body, end), sampleRate: sampleRate || 24000 };
    }
    offset = body + size + (size % 2); // chunks are word aligned
  }
  return null;
}

const isLegacyTtsModel = (model: string) => /^gemini-2\./.test(model);

export async function handleTts(raw: unknown, client: GeminiClient, models: Models): Promise<ApiResult> {
  if (!isObject(raw)) return badRequest('Request body must be a JSON object.');
  const { text, characterId, voicePrompt, voiceProfile = DEFAULT_VOICE_PROFILE } = raw;

  if (!nonEmptyString(text, LIMITS.ttsText)) {
    return badRequest(`text must be 1-${LIMITS.ttsText} characters.`);
  }
  if (typeof voiceProfile !== 'string' || !(voiceProfile in VOICE_PROFILES)) {
    return badRequest('Unknown voiceProfile.');
  }
  const profile = VOICE_PROFILES[voiceProfile as VoiceProfileId];

  let baseStyle: string;
  let id: string | undefined;
  if (characterId !== undefined) {
    const character = findCharacter(characterId);
    if (!character) return badRequest('Unknown character.');
    baseStyle = styleFromVoicePrompt(character.voicePrompt);
    id = character.id;
  } else if (voicePrompt !== undefined) {
    if (!nonEmptyString(voicePrompt, LIMITS.voicePrompt)) {
      return badRequest(`voicePrompt must be 1-${LIMITS.voicePrompt} characters.`);
    }
    baseStyle = styleFromVoicePrompt(voicePrompt);
  } else {
    return badRequest('Either characterId or voicePrompt is required.');
  }

  const style = [baseStyle, profile.style].filter(Boolean).join('; ');
  const spoken = applyPronunciation(id, text);

  // Gemini 3.x TTS reads the text verbatim and takes direction separately in
  // speechMetadata.style; 2.5 models only understood an inline prompt prefix.
  const partFor = (model: string) =>
    isLegacyTtsModel(model) ? { text: `Say in ${style}: ${spoken}` } : { text: spoken, speechMetadata: { style } };

  try {
    const response = await withFallbacks(
      [models.tts, ...(models.ttsFallbacks ?? [])],
      models.now ?? Date.now,
      (model, timeout) =>
        client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [partFor(model)] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.voiceName } } },
            httpOptions: { timeout },
          },
        }),
    );
    const inline = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inline?.data) return fail(502, 'EMPTY_RESPONSE', 'The model returned no audio.');

    let audio: string = inline.data;
    let sampleRate = Number(/rate=(\d+)/.exec(inline.mimeType ?? '')?.[1]) || 24000;
    if (/wav/i.test(inline.mimeType ?? '')) {
      const parsed = pcmFromWav(Buffer.from(inline.data, 'base64'));
      if (!parsed) return fail(502, 'UPSTREAM_ERROR', 'The model returned unreadable audio.');
      audio = Buffer.from(parsed.pcm).toString('base64');
      sampleRate = parsed.sampleRate;
    }
    return { status: 200, body: { audio, sampleRate, mimeType: `audio/L16;rate=${sampleRate}` } };
  } catch (error) {
    return mapUpstreamError(error);
  }
}

// ---------------------------------------------------------------- rate limit

/**
 * Fixed-window, per-key limiter. On Vercel this state is per function
 * instance, so it is a best-effort first line of defence; the durable limit is
 * a Vercel Firewall rate-limit rule on /api/* (see docs/DEPLOYMENT.md).
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    check(key: string): boolean {
      const t = now();
      const w = windows.get(key);
      if (!w || t - w.start > windowMs) {
        windows.set(key, { start: t, count: 1 });
        if (windows.size > 10_000) {
          for (const [k, v] of windows) if (t - v.start > windowMs) windows.delete(k);
        }
        return true;
      }
      w.count += 1;
      return w.count <= limit;
    },
  };
}
