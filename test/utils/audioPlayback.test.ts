import { describe, it, expect, vi, beforeAll } from 'vitest';
import { getPlaybackSettings, playAudio } from '@/utils/audio';

describe('getPlaybackSettings', () => {
  it('plays Modern mode clean: no extra crushing, normal speed', () => {
    expect(getPlaybackSettings('modern')).toEqual({ bitDepth: 0, playbackRate: 1 });
  });

  it('does not re-crush modes that vintage processing already quantised', () => {
    expect(getPlaybackSettings('subtle').bitDepth).toBe(0);
    expect(getPlaybackSettings('authentic').bitDepth).toBe(0);
  });

  it('keeps the extra artifacts only for Ultra', () => {
    expect(getPlaybackSettings('ultra').bitDepth).toBeGreaterThan(0);
  });
});

describe('playAudio', () => {
  it('reports the source node so callers can stop or visualise it', async () => {
    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, 10, 24000);
    const onStart = vi.fn();
    await playAudio(buffer, ctx, 0, 1, true, onStart);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0]).toHaveProperty('stop');
  });
});

describe('bit-crusher worklet processor', () => {
  let Processor: any;

  beforeAll(async () => {
    (globalThis as any).AudioWorkletProcessor = class {
      port = { onmessage: null };
    };
    (globalThis as any).registerProcessor = (_name: string, cls: unknown) => {
      Processor = cls;
    };
    // @ts-expect-error -- plain JS worklet module without types
    await import('../../public/audio-processor.worklet.js');
  });

  it('quantises samples to the configured number of levels', () => {
    const p = new Processor({ processorOptions: { bitDepth: 3 } }); // levels -1, 0, 1
    const out = [new Float32Array(3)];
    expect(p.process([[new Float32Array([0.9, 0.2, -0.7])]], [out])).toBe(true);
    expect(Array.from(out[0])).toEqual([1, 0, -1]);
  });

  it('lets the node be released once its input is disconnected', () => {
    const p = new Processor({ processorOptions: { bitDepth: 64 } });
    expect(p.process([[]], [[]])).toBe(false);
  });
});
