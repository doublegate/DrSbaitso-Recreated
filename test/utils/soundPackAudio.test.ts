import { describe, it, expect, vi } from 'vitest';
import {
  decodeAudioFileForPack,
  bytesToBase64,
  base64ToBytes,
  audioBufferToPcm16,
  isEncodedAudioContainer,
  validateSoundPack,
  importSoundPack,
  parseShareCode,
  MAX_IMPORT_BYTES,
  SOUND_PACK_SAMPLE_RATE,
  type SoundPack,
} from '@/utils/soundPackFormat';

function fakeBuffer(channels: Float32Array[], sampleRate: number) {
  return {
    numberOfChannels: channels.length,
    sampleRate,
    length: channels[0].length,
    getChannelData: (c: number) => channels[c],
  };
}

const validPack = (): SoundPack => ({
  metadata: {
    name: 'Pack',
    author: 'Me',
    version: '1.0.0',
    description: 'd',
    created: 1,
    updated: 1,
    tags: [],
  },
  sounds: [{ id: 'beep', name: 'Beep', description: '', audioData: 'AAAA', duration: 10, volume: 50 }],
  triggers: [{ event: 'glitch', soundId: 'beep', probability: 100 }],
});

describe('sound pack audio encoding', () => {
  it('round-trips large byte arrays through base64', () => {
    // Several 32 KiB chunks plus a ragged tail.
    const bytes = new Uint8Array(200_003);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) & 0xff;
    const b64 = bytesToBase64(bytes);
    expect(b64.length).toBe(Math.ceil(bytes.length / 3) * 4);
    const back = base64ToBytes(b64);
    expect(back.length).toBe(bytes.length);
    expect(back.every((v, i) => v === bytes[i])).toBe(true);
  });

  it('downmixes to mono and resamples to the pack rate as little-endian PCM16', () => {
    const left = new Float32Array(48_000).fill(0.5);
    const right = new Float32Array(48_000);
    const { pcm, sampleRate, durationMs } = audioBufferToPcm16(fakeBuffer([left, right], 48_000));
    expect(sampleRate).toBe(SOUND_PACK_SAMPLE_RATE);
    expect(pcm.byteLength).toBe(SOUND_PACK_SAMPLE_RATE * 2);
    expect(durationMs).toBe(1000);
    const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    expect(view.getInt16(0, true)).toBe(Math.round(0.25 * 32767));
  });

  it('clamps out-of-range samples', () => {
    const { pcm } = audioBufferToPcm16(fakeBuffer([new Float32Array([2, -2])], 24_000));
    const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    expect(view.getInt16(0, true)).toBe(32767);
    expect(view.getInt16(2, true)).toBe(-32768);
  });

  it('recognises encoded containers stored by older versions', () => {
    const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));
    expect(isEncodedAudioContainer(ascii('RIFF\0\0\0\0WAVEfmt '))).toBe(true);
    expect(isEncodedAudioContainer(ascii('ID3\x04\0\0'))).toBe(true);
    expect(isEncodedAudioContainer(new Uint8Array([0xff, 0xfb, 0x90, 0x00]))).toBe(true);
    expect(isEncodedAudioContainer(ascii('OggS\0\0'))).toBe(true);
    expect(isEncodedAudioContainer(new Uint8Array([0x10, 0x00, 0x20, 0x00]))).toBe(false);
  });
});

describe('decodeAudioFileForPack', () => {
  const ctxDecoding = (result: Promise<unknown>) =>
    ({ decodeAudioData: vi.fn(() => result) }) as unknown as BaseAudioContext;

  it('decodes the file with the browser and stores PCM16 at the pack rate', async () => {
    const decoded = fakeBuffer([new Float32Array(4800).fill(0.1)], 48_000);
    const ctx = ctxDecoding(Promise.resolve(decoded));
    const file = new ArrayBuffer(16);
    const sound = await decodeAudioFileForPack(file, ctx);
    expect(sound.sampleRate).toBe(SOUND_PACK_SAMPLE_RATE);
    expect(sound.duration).toBe(100);
    expect(base64ToBytes(sound.audioData).byteLength).toBe(2400 * 2);
    // The caller's buffer is not handed over (decodeAudioData detaches it).
    expect((ctx.decodeAudioData as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toBe(file);
  });

  it('explains undecodable files', async () => {
    const ctx = ctxDecoding(Promise.reject(new DOMException('bad', 'EncodingError')));
    await expect(decodeAudioFileForPack(new ArrayBuffer(4), ctx)).rejects.toThrow(/could not be decoded/);
  });

  it('rejects sounds longer than the per-sound limit', async () => {
    const decoded = fakeBuffer([new Float32Array(24_000 * 30)], 24_000);
    await expect(decodeAudioFileForPack(new ArrayBuffer(4), ctxDecoding(Promise.resolve(decoded)))).rejects.toThrow(
      /too long/
    );
  });
});

describe('sound pack schema validation', () => {
  it('accepts the glitch trigger event', () => {
    expect(validateSoundPack(validPack()).valid).toBe(true);
  });

  it('reports wrong field types as errors instead of throwing', () => {
    const pack = validPack() as unknown as { metadata: Record<string, unknown>; sounds: unknown[] };
    pack.metadata.name = 42;
    pack.metadata.tags = 'x';
    pack.sounds.push('not an object');
    const result = validateSoundPack(pack);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('name'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Sound 2'))).toBe(true);
  });

  it('rejects oversized import input before parsing', () => {
    const huge = ' '.repeat(MAX_IMPORT_BYTES + 1);
    expect(() => importSoundPack(huge)).toThrow(/too large/i);
  });

  it('rejects oversized share codes', () => {
    expect(() => parseShareCode('A'.repeat(MAX_IMPORT_BYTES * 2 + 4))).toThrow(/too large/i);
  });

  it('drops unknown fields on import', () => {
    const base = validPack();
    const json = JSON.stringify({ ...base, extra: { evil: true }, sounds: [{ ...base.sounds[0], junk: 1 }] });
    const pack = importSoundPack(json) as unknown as Record<string, unknown> & { sounds: Record<string, unknown>[] };
    expect(pack.extra).toBeUndefined();
    expect(pack.sounds[0].junk).toBeUndefined();
    expect(pack.sounds[0].id).toBe('beep');
  });
});
