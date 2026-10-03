import { describe, it, expect } from 'vitest';
import { compressPitch, pitchTrack } from '@/utils/psola';

const FS = 24000;

/** A voiced, vowel-like signal whose F0 follows `hz(t)` (glottal-ish pulses through a resonance). */
function voice(seconds: number, hz: (t: number) => number): Float32Array {
  const out = new Float32Array(Math.round(seconds * FS));
  let phase = 0;
  let y1 = 0;
  let y2 = 0;
  // Two-pole resonance near 700 Hz stands in for a formant.
  const r = 0.97;
  const w = (2 * Math.PI * 700) / FS;
  for (let i = 0; i < out.length; i++) {
    phase += hz(i / FS) / FS;
    let pulse = 0;
    if (phase >= 1) {
      phase -= 1;
      pulse = 1;
    }
    const y = pulse + 2 * r * Math.cos(w) * y1 - r * r * y2;
    y2 = y1;
    y1 = y;
    out[i] = y * 0.05;
  }
  return out;
}

const semitones = (a: number, b: number) => 12 * Math.log2(a / b);

function stats(x: Float32Array) {
  const f = pitchTrack(x, FS)
    .filter((p) => p.hz > 0)
    .map((p) => p.hz)
    .sort((a, b) => a - b);
  const median = f[Math.floor(f.length / 2)];
  const span = semitones(f[Math.floor(f.length * 0.9)], f[Math.floor(f.length * 0.1)]);
  return { median, span };
}

describe('pitchTrack', () => {
  it('follows a voice gliding from 90 to 140 Hz', () => {
    const { median, span } = stats(voice(1.5, (t) => 90 + (50 * t) / 1.5));
    expect(median).toBeGreaterThan(105);
    expect(median).toBeLessThan(125);
    expect(span).toBeGreaterThan(5);
  });
});

describe('compressPitch', () => {
  const input = voice(1.5, (t) => 100 * 2 ** (Math.sin(2 * Math.PI * t) * (4 / 12))); // +-4 st around 100 Hz

  it('keeps the duration', () => {
    expect(compressPitch(input, FS, { factor: 0.5 }).length).toBe(input.length);
  });

  it('halves the pitch movement with factor 0.5', () => {
    const before = stats(input).span;
    const after = stats(compressPitch(input, FS, { factor: 0.5 })).span;
    expect(after).toBeLessThan(before * 0.65);
    expect(after).toBeGreaterThan(before * 0.35);
  });

  it('moves the median to a target pitch', () => {
    const out = compressPitch(input, FS, { factor: 1, targetHz: 90 });
    expect(Math.abs(semitones(stats(out).median, 90))).toBeLessThan(0.7);
  });

  it('leaves silence and unvoiced noise alone', () => {
    const quiet = new Float32Array(FS / 2);
    expect(Array.from(compressPitch(quiet, FS, { factor: 0.5 }))).toEqual(Array.from(quiet));
  });
});
