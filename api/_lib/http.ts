/**
 * HTTP plumbing for the Gemini proxy functions: method and size checks,
 * per-client rate limiting, JSON parsing and client construction. Uses only
 * Web-standard Request/Response so it runs unchanged on Vercel's Node runtime
 * and inside the Vite dev middleware.
 */
import { GoogleGenAI } from '@google/genai';
import {
  DEFAULT_MODELS,
  LIMITS,
  createRateLimiter,
  fail,
  type ApiResult,
  type GeminiClient,
  type Models,
} from './gemini.js';

export type Handler = (body: unknown, client: GeminiClient, models: Models) => Promise<ApiResult>;

interface Limiter {
  check(key: string): boolean;
}

interface ServeOptions {
  env?: Record<string, string | undefined>;
  limiter?: Limiter;
  createClient?: (apiKey: string) => GeminiClient;
}

// 20 requests per minute per client per function instance.
const defaultLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

let cachedClient: { key: string; client: GeminiClient } | undefined;
function defaultCreateClient(apiKey: string): GeminiClient {
  if (cachedClient?.key !== apiKey) {
    cachedClient = { key: apiKey, client: new GoogleGenAI({ apiKey }) };
  }
  return cachedClient.client;
}

function json(result: ApiResult, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

/** Parses a comma-separated model list; unset means defaults, empty means none. */
function modelList(value: string | undefined, defaults: string[]): string[] {
  if (value === undefined) return [...defaults];
  return value
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function serve(request: Request, handler: Handler, options: ServeOptions = {}): Promise<Response> {
  const env = options.env ?? process.env;
  const limiter = options.limiter ?? defaultLimiter;

  if (request.method !== 'POST') {
    return json(fail(405, 'METHOD_NOT_ALLOWED', 'Use POST.'), { allow: 'POST' });
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(fail(503, 'NOT_CONFIGURED', 'The server has no Gemini API key configured.'));
  }

  if (!limiter.check(clientKey(request))) {
    return json(fail(429, 'RATE_LIMITED', 'Too many requests. Slow down.'), { 'retry-after': '60' });
  }

  const declared = Number(request.headers.get('content-length'));
  if (declared > LIMITS.bodyBytes) {
    return json(fail(413, 'PAYLOAD_TOO_LARGE', 'Request body too large.'));
  }
  const raw = await request.text();
  if (raw.length > LIMITS.bodyBytes) {
    return json(fail(413, 'PAYLOAD_TOO_LARGE', 'Request body too large.'));
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(fail(400, 'BAD_REQUEST', 'Request body must be valid JSON.'));
  }

  const models: Models = {
    chat: env.GEMINI_CHAT_MODEL || DEFAULT_MODELS.chat,
    tts: env.GEMINI_TTS_MODEL || DEFAULT_MODELS.tts,
    chatFallbacks: modelList(env.GEMINI_CHAT_FALLBACK_MODELS, DEFAULT_MODELS.chatFallbacks),
    ttsFallbacks: modelList(env.GEMINI_TTS_FALLBACK_MODELS, DEFAULT_MODELS.ttsFallbacks),
  };
  const client = (options.createClient ?? defaultCreateClient)(apiKey);
  return json(await handler(body, client, models));
}
