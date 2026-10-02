import { describe, it, expect } from 'vitest';
import { resolveVoiceRoute } from '@/utils/voiceRoutes';
import { decodeAudioData } from '@/utils/audio';
import { HAL_DEFAULT_TEMPO } from '@/utils/personaVoices';

describe('resolveVoiceRoute', () => {
  it.each([
    ['sbaitso', 'authentic', 'vintage'],
    ['sbaitso', 'ultra', 'vintage'],
    ['sbaitso', 'subtle', 'vintage'],
    ['sbaitso', 'modern', 'none'],
    ['sbaitso', undefined, 'none'],
    ['clean', 'authentic', 'none'],
    ['clean', 'ultra', 'none'],
    ['hal', 'authentic', 'hal'],
    ['hal', 'modern', 'hal'],
    ['wopr', 'ultra', 'wopr'],
    ['wopr', 'modern', 'wopr'],
  ] as const)('%s in %s mode -> %s', (processing, mode, route) => {
    expect(resolveVoiceRoute(processing, mode)).toBe(route);
  });
});

describe('decodeAudioData routes by persona', () => {
  const FS = 24000;
  // Each buffer keeps its own data: processing reads one and writes another.
  const ctx = {
    createBuffer: (_c: number, length: number, sampleRate: number) => {
      const data = new Float32Array(length);
      return { length, sampleRate, numberOfChannels: 1, getChannelData: () => data };
    },
  } as unknown as AudioContext;

  /** One second of a 140 Hz vowel-like PCM16 signal with a 6 kHz component. */
  const pcm = (() => {
    const samples = new Int16Array(FS);
    for (let i = 0; i < FS; i++) {
      let v = 0;
      for (let h = 1; h <= 8; h++) v += Math.sin((2 * Math.PI * 140 * h * i) / FS) / h;
      v += 0.2 * Math.sin((2 * Math.PI * 6000 * i) / FS);
      samples[i] = Math.round(6000 * v);
    }
    return new Uint8Array(samples.buffer);
  })();
  const raw = Array.from(new Int16Array(pcm.buffer), (v) => v / 32768);

  const decode = (mode: 'modern' | 'authentic' | 'ultra', processing?: 'sbaitso' | 'clean' | 'hal' | 'wopr', text?: string) =>
    decodeAudioData(pcm, ctx, FS, 1, mode, null, { processing, text });

  it('keeps the Sbaitso chain as the default', async () => {
    const byDefault = await decodeAudioData(pcm, ctx, FS, 1, 'authentic', null);
    const sbaitso = await decode('authentic', 'sbaitso');
    expect(Array.from(byDefault.getChannelData(0))).toEqual(Array.from(sbaitso.getChannelData(0)));
    expect(Array.from(sbaitso.getChannelData(0))).not.toEqual(raw);
  });

  it('leaves clean personas untouched in every audio mode', async () => {
    for (const mode of ['modern', 'authentic', 'ultra'] as const) {
      expect(Array.from((await decode(mode, 'clean')).getChannelData(0))).toEqual(raw);
    }
  });

  it('runs the HAL chain whatever the audio mode, never the 8-bit chain', async () => {
    for (const mode of ['modern', 'authentic'] as const) {
      const buffer = await decode(mode, 'hal');
      expect(buffer.length).toBe(Math.round(FS / HAL_DEFAULT_TEMPO));
      expect(buffer.sampleRate).toBe(FS);
      const levels = new Set(Array.from(buffer.getChannelData(0), (v) => Math.round(v * 32768)));
      expect(levels.size).toBeGreaterThan(5000);
    }
  });

  it('runs the WOPR chain with the spoken text', async () => {
    const buffer = await decode('authentic', 'wopr', 'HELLO?');
    const data = buffer.getChannelData(0);
    expect(buffer.length).toBeGreaterThan(0);
    const peak = data.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeCloseTo(10 ** (-3 / 20), 3);
  });
});
