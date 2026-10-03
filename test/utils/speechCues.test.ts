import { describe, it, expect, vi } from 'vitest';
import { cueOffsets } from '@/utils/speechCues';
import { playParityTone } from '@/utils/audio';
import { peekSharedAudioContext, getSharedAudioContext, __resetSharedAudioForTests } from '@/utils/sharedAudio';

describe('cueOffsets', () => {
  it('places each line where its words start in the joined speech', () => {
    // "AB CD" -> AB starts at 0, CD at 3 of 5 characters.
    expect(cueOffsets(['AB', 'CD'])).toEqual([0, 3 / 5]);
  });

  it('gives an unspoken (blank) line the offset of the next spoken one', () => {
    const offsets = cueOffsets(['HELLO', '', 'THERE']);
    expect(offsets[1]).toBe(offsets[2]);
    expect(offsets[2]).toBeCloseTo(6 / 11);
  });

  it('never goes below 0 or reaches 1', () => {
    for (const offset of cueOffsets(['', 'A', '', 'B', ''])) {
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThan(1);
    }
    expect(cueOffsets([])).toEqual([]);
    expect(cueOffsets(['', ''])).toEqual([0, 0]);
  });
});

describe('playParityTone', () => {
  it('ramps a buzzy oscillator down from about 1 kHz to 0.7 kHz over the given time', () => {
    const ctx = new AudioContext();
    playParityTone(ctx, 4);
    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 0);
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(700, 4);
    expect(osc.start).toHaveBeenCalled();
    expect(osc.stop).toHaveBeenCalledWith(4);
  });

  it('never throws, even on a broken context', () => {
    expect(() => playParityTone({} as AudioContext, 4)).not.toThrow();
  });
});

describe('peekSharedAudioContext', () => {
  it('returns the context only once something created it', () => {
    __resetSharedAudioForTests();
    expect(peekSharedAudioContext()).toBeNull();
    const ctx = getSharedAudioContext();
    expect(peekSharedAudioContext()).toBe(ctx);
  });
});
