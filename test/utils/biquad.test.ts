import { describe, it, expect } from 'vitest';
import { applyBiquad, applyCascade, BUTTERWORTH_4_Q, designBiquad } from '@/utils/biquad';

const FS = 24000;

function sine(freq: number, seconds: number, fs = FS): Float32Array {
  const out = new Float32Array(Math.round(seconds * fs));
  for (let i = 0; i < out.length; i++) out[i] = 0.5 * Math.sin((2 * Math.PI * freq * i) / fs);
  return out;
}

/** RMS of the second half (past the filter's start-up transient). */
const tailRms = (a: Float32Array) =>
  Math.sqrt(a.subarray(a.length >> 1).reduce((s, v) => s + v * v, 0) / (a.length >> 1));

/** Gain in dB of a filter for one steady tone. */
function gainDb(filter: (x: Float32Array) => Float32Array, freq: number): number {
  const x = sine(freq, 0.5);
  return 20 * Math.log10(tailRms(filter(x)) / tailRms(x));
}

const highPass220 = (x: Float32Array) => applyCascade(x, 'highpass', 220, FS, BUTTERWORTH_4_Q);

describe('designBiquad', () => {
  it('low shelf boosts below the corner and leaves the highs', () => {
    const f = designBiquad('lowshelf', 150, FS, Math.SQRT1_2, 2);
    expect(gainDb((x) => applyBiquad(x, f), 40)).toBeCloseTo(2, 0);
    expect(Math.abs(gainDb((x) => applyBiquad(x, f), 3000))).toBeLessThan(0.1);
  });

  it('peaking EQ boosts at its centre only', () => {
    const f = designBiquad('peaking', 2500, FS, 1, 2);
    expect(gainDb((x) => applyBiquad(x, f), 2500)).toBeCloseTo(2, 1);
    expect(Math.abs(gainDb((x) => applyBiquad(x, f), 200))).toBeLessThan(0.2);
  });

  it('a 4th-order Butterworth high-pass falls about 24 dB per octave', () => {
    expect(gainDb(highPass220, 220)).toBeCloseTo(-3, 0);
    expect(gainDb(highPass220, 110)).toBeLessThan(-22);
    expect(Math.abs(gainDb(highPass220, 1000))).toBeLessThan(0.3);
  });

  it('keeps the existing high shelf and low-pass designs', () => {
    expect(gainDb((x) => applyBiquad(x, designBiquad('highshelf', 1200, FS, Math.SQRT1_2, -8)), 8000)).toBeCloseTo(
      -8,
      0,
    );
    expect(gainDb((x) => applyBiquad(x, designBiquad('lowpass', 3800, FS)), 3800)).toBeCloseTo(-3, 0);
  });
});
