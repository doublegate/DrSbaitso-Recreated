import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAIResponse,
  synthesizeSpeech,
  resetChat,
  resetAllChats,
  getDrSbaitsoResponse,
  getHistory,
  GeminiServiceError,
} from '@/services/geminiService';

function reply(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );
}

const fetchMock = vi.fn();
const lastBody = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body);

describe('geminiService (proxy client)', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    resetAllChats();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getAIResponse', () => {
    it('posts to /api/chat and returns the text', async () => {
      fetchMock.mockReturnValueOnce(reply(200, { text: 'HELLO.' }));
      await expect(getAIResponse('Hi', 'sbaitso')).resolves.toBe('HELLO.');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/chat');
      expect(init.method).toBe('POST');
      expect(lastBody()).toEqual({ characterId: 'sbaitso', history: [], message: 'Hi' });
    });

    it('never sends an API key from the browser', async () => {
      fetchMock.mockReturnValueOnce(reply(200, { text: 'X' }));
      await getAIResponse('Hi', 'sbaitso');
      const init = fetchMock.mock.calls[0][1];
      expect(JSON.stringify(init)).not.toMatch(/key/i);
    });

    it('keeps a separate history per character and sends it on the next turn', async () => {
      fetchMock.mockReturnValueOnce(reply(200, { text: 'WHY?' }));
      await getAIResponse('I am sad', 'eliza');
      fetchMock.mockReturnValueOnce(reply(200, { text: 'GO ON.' }));
      await getAIResponse('Because', 'eliza');
      expect(lastBody().history).toEqual([
        { role: 'user', text: 'I am sad' },
        { role: 'model', text: 'WHY?' },
      ]);

      fetchMock.mockReturnValueOnce(reply(200, { text: 'HI' }));
      await getAIResponse('Hello', 'hal9000');
      expect(lastBody().history).toEqual([]);
    });

    it('does not record a failed turn in the history', async () => {
      fetchMock.mockReturnValueOnce(reply(502, { code: 'UPSTREAM_ERROR', error: 'x' }));
      await expect(getAIResponse('Hi', 'sbaitso')).rejects.toBeInstanceOf(GeminiServiceError);
      expect(getHistory('sbaitso')).toEqual([]);
    });

    it('surfaces the error code and status', async () => {
      fetchMock.mockReturnValueOnce(reply(429, { code: 'RATE_LIMITED', error: 'slow down' }));
      const err = await getAIResponse('Hi', 'sbaitso').catch((e) => e);
      expect(err).toBeInstanceOf(GeminiServiceError);
      expect(err.code).toBe('RATE_LIMITED');
      expect(err.status).toBe(429);
    });

    it('maps network failures to NETWORK_ERROR', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const err = await getAIResponse('Hi', 'sbaitso').catch((e) => e);
      expect(err.code).toBe('NETWORK_ERROR');
    });

    it('sends a custom character instead of an id', async () => {
      fetchMock.mockReturnValueOnce(reply(200, { text: 'BEEP' }));
      await getAIResponse('Hi', 'custom-1', {
        customCharacter: { name: 'Robo', systemInstruction: 'You are Robo.' },
      });
      expect(lastBody()).toEqual({
        customCharacter: { name: 'Robo', systemInstruction: 'You are Robo.' },
        history: [],
        message: 'Hi',
      });
    });
  });

  describe('resetChat / resetAllChats', () => {
    it('clears one character only', async () => {
      fetchMock.mockImplementation(() => reply(200, { text: 'OK' }));
      await getAIResponse('a', 'sbaitso');
      await getAIResponse('b', 'eliza');
      resetChat('sbaitso');
      expect(getHistory('sbaitso')).toEqual([]);
      expect(getHistory('eliza')).toHaveLength(2);
      resetAllChats();
      expect(getHistory('eliza')).toEqual([]);
    });
  });

  describe('synthesizeSpeech', () => {
    it('posts to /api/tts and returns base64 PCM', async () => {
      fetchMock.mockReturnValueOnce(reply(200, { audio: 'AAEC', sampleRate: 24000, mimeType: 'audio/L16;rate=24000' }));
      await expect(synthesizeSpeech('HELLO', 'sbaitso')).resolves.toBe('AAEC');
      expect(fetchMock.mock.calls[0][0]).toBe('/api/tts');
      expect(lastBody()).toEqual({ text: 'HELLO', characterId: 'sbaitso' });
    });

    it('passes the voice profile and a custom voice prompt', async () => {
      fetchMock.mockReturnValueOnce(reply(200, { audio: 'AA' }));
      await synthesizeSpeech('HI', 'custom-1', { voicePrompt: 'squeaky', voiceProfile: 'deep' });
      expect(lastBody()).toEqual({ text: 'HI', voicePrompt: 'squeaky', voiceProfile: 'deep' });
    });

    it('returns empty audio for empty text without a request', async () => {
      await expect(synthesizeSpeech('   ', 'sbaitso')).resolves.toBe('');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('keeps rate-limit errors recognisable to callers', async () => {
      fetchMock.mockReturnValueOnce(reply(429, { code: 'RATE_LIMITED', error: 'x' }));
      const err = await synthesizeSpeech('HI', 'sbaitso').catch((e) => e);
      expect(err.code).toBe('RATE_LIMITED');
      expect(err.message).toMatch(/429/);
    });
  });

  it('getDrSbaitsoResponse targets the sbaitso persona', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { text: 'OK' }));
    await getDrSbaitsoResponse('hi');
    expect(lastBody().characterId).toBe('sbaitso');
  });
});
