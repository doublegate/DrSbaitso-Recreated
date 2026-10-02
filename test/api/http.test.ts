import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serve, clientKey, type Handler } from '../../api/_lib/http';

const ok = vi.fn<Handler>(async () => ({ status: 200, body: { text: 'OK' } }));

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://example.test/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('serve', () => {
  const env = { GEMINI_API_KEY: 'k' };
  const createClient = () => ({ models: { generateContent: vi.fn() } });

  beforeEach(() => ok.mockClear());
  afterEach(() => vi.unstubAllEnvs());

  it('runs the handler and returns JSON with no-store caching', async () => {
    const res = await serve(post({ message: 'hi' }), ok, { env, createClient });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'OK' });
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(ok).toHaveBeenCalledWith({ message: 'hi' }, expect.anything(), expect.objectContaining({ chat: expect.any(String) }));
  });

  it('rejects non-POST methods', async () => {
    const res = await serve(new Request('https://example.test/api/chat'), ok, { env, createClient });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
    expect(ok).not.toHaveBeenCalled();
  });

  it('reports a missing key as 503 without calling the handler', async () => {
    const res = await serve(post({}), ok, { env: {}, createClient });
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('NOT_CONFIGURED');
    expect(ok).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const res = await serve(post('{nope'), ok, { env, createClient });
    expect(res.status).toBe(400);
  });

  it('rejects oversized bodies', async () => {
    const res = await serve(post({ message: 'x'.repeat(70 * 1024) }), ok, { env, createClient });
    expect(res.status).toBe(413);
    expect(ok).not.toHaveBeenCalled();
  });

  it('rate limits per client', async () => {
    const limiter = { check: vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false) };
    expect((await serve(post({}), ok, { env, limiter, createClient })).status).toBe(200);
    const blocked = await serve(post({}), ok, { env, limiter, createClient });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
  });

  it('uses model overrides from the environment', async () => {
    await serve(post({}), ok, { env: { ...env, GEMINI_CHAT_MODEL: 'm-chat', GEMINI_TTS_MODEL: 'm-tts' }, createClient });
    expect(ok.mock.calls[0][2]).toMatchObject({ chat: 'm-chat', tts: 'm-tts' });
  });

  it('reads comma-separated fallback model lists, and defaults them', async () => {
    await serve(post({}), ok, { env: { ...env, GEMINI_CHAT_FALLBACK_MODELS: 'a, b' }, createClient });
    expect(ok.mock.calls[0]![2].chatFallbacks).toEqual(['a', 'b']);
    expect(ok.mock.calls[0]![2].ttsFallbacks!.length).toBeGreaterThan(0);

    ok.mockClear();
    await serve(post({}), ok, { env: { ...env, GEMINI_CHAT_FALLBACK_MODELS: '' }, createClient });
    expect(ok.mock.calls[0]![2].chatFallbacks).toEqual([]);
  });
});

describe('clientKey', () => {
  it('prefers the first x-forwarded-for address', () => {
    const req = new Request('https://x.test', { headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } });
    expect(clientKey(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip, then a shared bucket', () => {
    expect(clientKey(new Request('https://x.test', { headers: { 'x-real-ip': '5.6.7.8' } }))).toBe('5.6.7.8');
    expect(clientKey(new Request('https://x.test'))).toBe('unknown');
  });
});
