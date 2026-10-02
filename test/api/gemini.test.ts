import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleChat,
  handleTts,
  pcmFromWav,
  createRateLimiter,
  applyPronunciation,
  LIMITS,
  type GeminiClient,
} from '../../api/_lib/gemini';

function makeClient(impl: (req: any) => any): GeminiClient & { calls: any[] } {
  const calls: any[] = [];
  return {
    calls,
    models: {
      generateContent: vi.fn(async (req: any) => {
        calls.push(req);
        return impl(req);
      }),
    },
  };
}

function wav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const out = new Uint8Array(44 + pcm.length);
  const v = new DataView(out.buffer);
  const ascii = (o: number, s: string) => [...s].forEach((c, i) => (out[o + i] = c.charCodeAt(0)));
  ascii(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ascii(36, 'data');
  v.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');
const MODELS = { chat: 'gemini-3.8-flash', tts: 'gemini-3.8-flash-tts' };

describe('handleChat', () => {
  let client: ReturnType<typeof makeClient>;
  beforeEach(() => {
    client = makeClient(() => ({ text: 'TELL ME MORE ABOUT YOUR PROBLEMS.' }));
  });

  it('answers with the persona system instruction resolved on the server', async () => {
    const res = await handleChat({ characterId: 'sbaitso', message: 'hello' }, client, MODELS);
    expect(res).toEqual({ status: 200, body: { text: 'TELL ME MORE ABOUT YOUR PROBLEMS.' } });
    const req = client.calls[0];
    expect(req.model).toBe('gemini-3.8-flash');
    expect(req.config.systemInstruction).toContain('Dr. Sbaitso');
    expect(req.contents).toEqual([{ role: 'user', parts: [{ text: 'hello' }] }]);
  });

  it('sends prior turns as history before the new message', async () => {
    await handleChat(
      {
        characterId: 'eliza',
        history: [
          { role: 'user', text: 'I am sad' },
          { role: 'model', text: 'WHY ARE YOU SAD?' },
        ],
        message: 'my dog',
      },
      client,
      MODELS,
    );
    expect(client.calls[0].contents.map((c: any) => c.role)).toEqual(['user', 'model', 'user']);
  });

  it('accepts a custom character instruction instead of an id', async () => {
    const res = await handleChat(
      { customCharacter: { name: 'Robo', systemInstruction: 'You are Robo.' }, message: 'hi' },
      client,
      MODELS,
    );
    expect(res.status).toBe(200);
    expect(client.calls[0].config.systemInstruction).toBe('You are Robo.');
  });

  it.each([
    [{ characterId: 'nope', message: 'hi' }, 'unknown character'],
    [{ characterId: 'sbaitso', message: '' }, 'message'],
    [{ characterId: 'sbaitso', message: 'x'.repeat(LIMITS.message + 1) }, 'message'],
    [{ message: 'hi' }, 'character'],
    [{ characterId: 'sbaitso', message: 'hi', history: 'bad' }, 'history'],
    [{ characterId: 'sbaitso', message: 'hi', history: [{ role: 'system', text: 'x' }] }, 'history'],
    [
      { customCharacter: { name: 'R', systemInstruction: 'x'.repeat(LIMITS.customInstruction + 1) }, message: 'hi' },
      'customCharacter',
    ],
    [null, 'body'],
  ])('rejects invalid input %#', async (body, fragment) => {
    const res = await handleChat(body, client, MODELS);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
    expect(String(res.body.error).toLowerCase()).toContain(fragment.toLowerCase());
    expect(client.calls).toHaveLength(0);
  });

  it('keeps only the most recent history turns', async () => {
    const history = Array.from({ length: LIMITS.historyTurns + 10 }, (_, i) => ({
      role: i % 2 ? 'model' : 'user',
      text: `t${i}`,
    }));
    await handleChat({ characterId: 'sbaitso', message: 'hi', history }, client, MODELS);
    expect(client.calls[0].contents).toHaveLength(LIMITS.historyTurns + 1);
    expect(client.calls[0].contents.at(-2).parts[0].text).toBe(`t${LIMITS.historyTurns + 9}`);
  });

  it('maps an empty model reply to a 502 instead of crashing', async () => {
    client = makeClient(() => ({ text: undefined }));
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, MODELS);
    expect(res).toEqual({ status: 502, body: { code: 'EMPTY_RESPONSE', error: expect.any(String) } });
  });

  it('passes upstream rate limiting through as 429', async () => {
    client = makeClient(() => {
      throw Object.assign(new Error('RESOURCE_EXHAUSTED: quota'), { status: 429 });
    });
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, MODELS);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
  });

  it('falls back to the next model when the primary is overloaded (503)', async () => {
    let call = 0;
    client = makeClient(() => {
      call += 1;
      if (call === 1) throw Object.assign(new Error('{"error":{"status":"UNAVAILABLE"}}'), { status: 503 });
      return { text: 'FALLBACK OK' };
    });
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, {
      ...MODELS,
      chatFallbacks: ['gemini-3.7-flash'],
    });
    expect(res).toEqual({ status: 200, body: { text: 'FALLBACK OK' } });
    expect(client.calls.map((c) => c.model)).toEqual(['gemini-3.8-flash', 'gemini-3.7-flash']);
  });

  it('reports UNAVAILABLE when every model is overloaded', async () => {
    client = makeClient(() => {
      throw Object.assign(new Error('high demand'), { status: 503 });
    });
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, {
      ...MODELS,
      chatFallbacks: ['b'],
    });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('UNAVAILABLE');
    expect(client.calls).toHaveLength(2);
  });

  it('bounds each attempt with a timeout and uses low thinking for chat', async () => {
    await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, MODELS);
    const config = client.calls[0].config;
    expect(config.httpOptions.timeout).toBeGreaterThan(0);
    expect(config.httpOptions.timeout).toBeLessThanOrEqual(LIMITS.attemptTimeoutMs);
    expect(config.thinkingConfig).toEqual({ thinkingLevel: 'LOW' });
  });

  it('moves to the next model after a timeout', async () => {
    let call = 0;
    client = makeClient(() => {
      call += 1;
      if (call === 1) throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
      return { text: 'OK' };
    });
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, { ...MODELS, chatFallbacks: ['b'] });
    expect(res.status).toBe(200);
  });

  it('moves to the next model on a per-model quota error, and reports 429 if all are exhausted', async () => {
    client = makeClient(() => {
      throw Object.assign(new Error('RESOURCE_EXHAUSTED'), { status: 429 });
    });
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, { ...MODELS, chatFallbacks: ['b'] });
    expect(client.calls).toHaveLength(2);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
  });

  it('stops trying fallbacks once the overall deadline is spent', async () => {
    let now = 0;
    client = makeClient(() => {
      now += LIMITS.totalBudgetMs; // the first attempt consumes the whole budget
      throw Object.assign(new Error('high demand'), { status: 503 });
    });
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, {
      ...MODELS,
      chatFallbacks: ['b', 'c'],
      now: () => now,
    });
    expect(client.calls).toHaveLength(1);
    expect(res.status).toBe(503);
  });

  it('does not try fallbacks for errors a retry cannot fix', async () => {
    client = makeClient(() => {
      throw Object.assign(new Error('bad'), { status: 400 });
    });
    await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, { ...MODELS, chatFallbacks: ['b'] });
    expect(client.calls).toHaveLength(1);
  });

  it('hides other upstream failures behind a generic 502', async () => {
    client = makeClient(() => {
      throw Object.assign(new Error('internal details with secrets'), { status: 500 });
    });
    const res = await handleChat({ characterId: 'sbaitso', message: 'hi' }, client, MODELS);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('UPSTREAM_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secrets');
  });
});

describe('handleTts', () => {
  const pcm = new Uint8Array([1, 2, 3, 4, 5, 6]);

  it('strips the WAV header so the client always receives raw PCM16', async () => {
    const client = makeClient(() => ({
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/wav', data: b64(wav(pcm)) } }] } }],
    }));
    const res = await handleTts({ characterId: 'sbaitso', text: 'HELLO' }, client, MODELS);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ audio: b64(pcm), sampleRate: 24000, mimeType: 'audio/L16;rate=24000' });
  });

  it('passes raw L16 audio through unchanged', async () => {
    const client = makeClient(() => ({
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: b64(pcm) } }] } }],
    }));
    const res = await handleTts({ characterId: 'sbaitso', text: 'HELLO' }, client, MODELS);
    expect(res.body.audio).toBe(b64(pcm));
  });

  it('uses speechMetadata.style and the persona voice on current models', async () => {
    const client = makeClient(() => ({
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/wav', data: b64(wav(pcm)) } }] } }],
    }));
    await handleTts({ characterId: 'sbaitso', text: 'I AM SBAITSO' }, client, MODELS);
    const req = client.calls[0];
    expect(req.model).toBe('gemini-3.8-flash-tts');
    const part = req.contents[0].parts[0];
    expect(part.text).toBe('I AM SBAYT-SO');
    expect(part.speechMetadata.style).toMatch(/flat, even/i);
    expect(part.speechMetadata.style).not.toMatch(/very deep|8-bit/i);
    expect(req.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Charon');
  });

  it('honours an explicit voice profile', async () => {
    const client = makeClient(() => ({
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/wav', data: b64(wav(pcm)) } }] } }],
    }));
    await handleTts({ characterId: 'sbaitso', text: 'HI', voiceProfile: 'glitchy' }, client, MODELS);
    expect(client.calls[0].config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Puck');
  });

  it('falls back to a prompt prefix on 2.5 TTS models', async () => {
    const client = makeClient(() => ({
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: b64(pcm) } }] } }],
    }));
    await handleTts({ characterId: 'sbaitso', text: 'HI' }, client, { ...MODELS, tts: 'gemini-2.5-flash-preview-tts' });
    const part = client.calls[0].contents[0].parts[0];
    expect(part.speechMetadata).toBeUndefined();
    expect(part.text).toMatch(/^Say in .*: HI$/);
  });

  it.each([
    [{ characterId: 'sbaitso', text: '' }],
    [{ characterId: 'sbaitso', text: 'x'.repeat(LIMITS.ttsText + 1) }],
    [{ characterId: 'ghost', text: 'hi' }],
    [{ characterId: 'sbaitso', text: 'hi', voiceProfile: 'robot' }],
    [{ text: 'hi', voicePrompt: 'y'.repeat(LIMITS.voicePrompt + 1) }],
  ])('rejects invalid input %#', async (body) => {
    const client = makeClient(() => ({}));
    const res = await handleTts(body, client, MODELS);
    expect(res.status).toBe(400);
    expect(client.calls).toHaveLength(0);
  });

  it('falls back to the next TTS model when the primary is overloaded', async () => {
    let call = 0;
    const client = makeClient(() => {
      call += 1;
      if (call === 1) throw Object.assign(new Error('high demand'), { status: 503 });
      return { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/wav', data: b64(wav(pcm)) } }] } }] };
    });
    const res = await handleTts({ characterId: 'sbaitso', text: 'HI' }, client, {
      ...MODELS,
      ttsFallbacks: ['gemini-3.8-flash-lite-tts'],
    });
    expect(res.status).toBe(200);
    expect(client.calls.map((c) => c.model)).toEqual(['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts']);
  });

  it('reports a response with no audio as a 502', async () => {
    const client = makeClient(() => ({ candidates: [] }));
    const res = await handleTts({ characterId: 'sbaitso', text: 'HI' }, client, MODELS);
    expect(res).toEqual({ status: 502, body: { code: 'EMPTY_RESPONSE', error: expect.any(String) } });
  });
});

describe('pcmFromWav', () => {
  it('finds the data chunk even when other chunks precede it', () => {
    const base = wav(new Uint8Array([9, 9]));
    // insert a LIST chunk between fmt and data
    const list = new Uint8Array([0x4c, 0x49, 0x53, 0x54, 4, 0, 0, 0, 1, 2, 3, 4]);
    const merged = new Uint8Array(base.length + list.length);
    merged.set(base.subarray(0, 36));
    merged.set(list, 36);
    merged.set(base.subarray(36), 36 + list.length);
    expect(pcmFromWav(merged)).toEqual({ pcm: new Uint8Array([9, 9]), sampleRate: 24000 });
  });

  it('returns null for non-WAV bytes', () => {
    expect(pcmFromWav(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe('applyPronunciation', () => {
  it.each([
    ['sbaitso', 'I AM SBAITSO', 'I AM SBAYT-SO'],
    ['sbaitso', 'I AM DR. SBAITSO.', 'I AM DOCTOR SBAYT-SO.'],
    ['sbaitso', 'DR SBAITSO AND DR.SMITH', 'DOCTOR SBAYT-SO AND DOCTOR SMITH'],
    ['sbaitso', 'DRY ADDRESS', 'DRY ADDRESS'],
    ['eliza', 'DR. SMITH', 'DR. SMITH'],
    ['hal9000', 'I AM HAL', 'I AM H-A-L'],
    ['joshua', 'THE WOPR', 'THE WHOPPER'],
    ['eliza', 'SBAITSO', 'SBAITSO'],
  ])('%s', (id, input, expected) => {
    expect(applyPronunciation(id, input)).toBe(expected);
  });
});

describe('createRateLimiter', () => {
  it('allows `limit` requests per window per key, then blocks until the window passes', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => now });
    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(false);
    expect(limiter.check('b')).toBe(true);
    now = 1001;
    expect(limiter.check('a')).toBe(true);
  });
});
