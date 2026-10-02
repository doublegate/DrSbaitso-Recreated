import { describe, it, expect } from 'vitest';
import { resampleBy, timeStretch } from '@/utils/timeStretch';
import { estimatePitch } from '@/utils/lpcMonotone';

const FS = 24000;

/** A vowel-like signal: harmonics of f0 with falling amplitude. */
function harmonic(f0: number, seconds: number, fs = FS): Float32Array {
  const out = new Float32Array(Math.round(seconds * fs));
  for (let i = 0; i < out.length; i++) {
    let v = 0;
    for (let h = 1; h <= 8; h++) v += Math.sin((2 * Math.PI * f0 * h * i) / fs) / h;
    out[i] = 0.3 * v;
  }
  return out;
}

const pitchAt = (x: Float32Array, from: number, to: number, minHz = 60) =>
  estimatePitch(x.subarray(Math.round(from * FS), Math.round(to * FS)), FS, minHz).hz;
const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));

describe('timeStretch (WSOLA)', () => {
  it.each([0.88, 0.75, 1.25])('changes the duration by 1/%d and keeps the pitch', (rate) => {
    const input = harmonic(120, 1);
    const out = timeStretch(input, FS, rate);
    expect(out.length).toBe(Math.round(input.length / rate));
    const mid = out.length / FS / 2;
    expect(Math.abs(pitchAt(out, mid - 0.1, mid + 0.1) - 120)).toBeLessThan(2.5);
  });

  it('keeps the level and has no gap or click at the start', () => {
    const input = harmonic(150, 1);
    const out = timeStretch(input, FS, 0.88);
    expect(rms(out) / rms(input)).toBeGreaterThan(0.85);
    expect(rms(out) / rms(input)).toBeLessThan(1.15);
    // The first 10 ms carries signal: no window fade-in from the first frame.
    expect(rms(out.subarray(0, 240))).toBeGreaterThan(0.5 * rms(input.subarray(0, 240)));
  });

  it('returns a copy at rate 1 and handles empty input', () => {
    const input = harmonic(100, 0.1);
    const out = timeStretch(input, FS, 1);
    expect(out).not.toBe(input);
    expect(Array.from(out)).toEqual(Array.from(input));
    expect(timeStretch(new Float32Array(0), FS, 0.8).length).toBe(0);
  });

  it('is deterministic', () => {
    const input = harmonic(110, 0.5);
    expect(Array.from(timeStretch(input, FS, 0.9))).toEqual(Array.from(timeStretch(input, FS, 0.9)));
  });
});

describe('resampleBy', () => {
  it('lowers the pitch and lengthens by the factor (tape-style)', () => {
    const out = resampleBy(harmonic(200, 0.5), 0.5);
    expect(out.length).toBe(Math.round((0.5 * FS) / 0.5));
    expect(Math.abs(pitchAt(out, 0.4, 0.6) - 100)).toBeLessThan(2);
  });
});
