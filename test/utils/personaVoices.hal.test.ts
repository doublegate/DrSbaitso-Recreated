import { describe, it, expect } from 'vitest';
import {
  countSyllables,
  HAL_DEFAULT_TEMPO,
  halShutdown,
  halShutdownFactors,
  halTempoFor,
  processHalVoice,
} from '@/utils/personaVoices';
import { estimatePitch } from '@/utils/lpcMonotone';
import { bestCpuMs, perfIt } from '../helpers/cpuTime';

const FS = 24000;

/** Vowel-like test signal: harmonics of f0, with a slow loudness wobble. */
function vowel(f0: number, seconds: number, amplitude = 0.3): Float32Array {
  const out = new Float32Array(Math.round(seconds * FS));
  for (let i = 0; i < out.length; i++) {
    let v = 0;
    for (let h = 1; h <= 10; h++) v += Math.sin((2 * Math.PI * f0 * h * i) / FS) / h;
    out[i] = amplitude * v * (0.75 + 0.25 * Math.sin((2 * Math.PI * 3 * i) / FS));
  }
  return out;
}

function tones(freqs: number[], seconds: number, amplitude = 0.1): Float32Array {
  const out = new Float32Array(Math.round(seconds * FS));
  for (let i = 0; i < out.length; i++) {
    for (const f of freqs) out[i] += amplitude * Math.sin((2 * Math.PI * f * i) / FS);
  }
  return out;
}

/** Magnitude of one frequency over the middle half of a signal. */
function toneLevel(x: Float32Array, freq: number): number {
  const from = Math.floor(x.length / 4);
  const to = Math.floor((3 * x.length) / 4);
  let re = 0;
  let im = 0;
  for (let i = from; i < to; i++) {
    re += x[i] * Math.cos((2 * Math.PI * freq * i) / FS);
    im -= x[i] * Math.sin((2 * Math.PI * freq * i) / FS);
  }
  return (2 * Math.hypot(re, im)) / (to - from);
}

/** Deterministic low-level noise. */
function noise(length: number, amplitude: number, seed = 3): Float32Array {
  let s = seed >>> 0;
  return Float32Array.from({ length }, () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 4294967296 - 0.5) * 2 * amplitude;
  });
}

const dB = (r: number) => 20 * Math.log10(r);
const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));
const concat = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

describe('processHalVoice', () => {
  it('slows delivery by the tempo factor without changing the pitch', () => {
    const input = vowel(140, 1.5);
    const out = processHalVoice(input, FS);
    expect(HAL_DEFAULT_TEMPO).toBeCloseTo(0.88, 2);
    expect(out.length).toBe(Math.round(input.length / HAL_DEFAULT_TEMPO));
    const mid = Math.round(out.length / 2);
    const { hz } = estimatePitch(out.subarray(mid - 2400, mid + 2400), FS);
    // Not pulled to the Sbaitso 92 Hz plateau, not lowered like a tape slow-down.
    expect(Math.abs(hz - 140)).toBeLessThan(3);
  });

  it('never applies the Sbaitso 8-bit / 8475 Hz chain', () => {
    const out = processHalVoice(tones([500, 6000], 1), FS, { tempo: 1, breathGate: false });
    // Far more than the 256 levels of 8-bit audio.
    expect(new Set(Array.from(out, (v) => Math.round(v * 32768))).size).toBeGreaterThan(5000);
    // Content above the 4237 Hz Nyquist limit of 8475 Hz audio survives intact.
    expect(dB(toneLevel(out, 6000) / toneLevel(out, 500))).toBeGreaterThan(-1.5);
    // No sample-and-hold images of an 8475 Hz signal.
    expect(toneLevel(out, 8475 - 500)).toBeLessThan(0.01 * toneLevel(out, 500));
  });

  it('cuts rumble below 50 Hz and warms the low end around 150 Hz', () => {
    const input = tones([20, 120, 2000], 2);
    const out = processHalVoice(input, FS, { tempo: 1, breathGate: false });
    const relative = (f: number) =>
      dB(toneLevel(out, f) / toneLevel(out, 2000)) - dB(toneLevel(input, f) / toneLevel(input, 2000));
    expect(relative(20)).toBeLessThan(-12);
    expect(relative(120)).toBeGreaterThan(0.8);
    expect(relative(120)).toBeLessThan(2.5);
  });

  it('compresses gently: a 12 dB louder passage comes out less than 12 dB louder', () => {
    const quiet = vowel(120, 0.6, 0.05);
    const loud = vowel(120, 0.6, 0.2);
    const out = processHalVoice(concat(quiet, loud), FS, { tempo: 1, breathGate: false });
    const half = out.length / 2;
    const gain = dB(rms(out.subarray(half + 2400)) / rms(out.subarray(2400, half)));
    expect(gain).toBeGreaterThan(4);
    expect(gain).toBeLessThan(10);
  });

  it('peaks at or below -3 dBFS', () => {
    const out = processHalVoice(vowel(110, 1, 0.9), FS);
    const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeLessThanOrEqual(10 ** (-3 / 20) + 1e-6);
    expect(peak).toBeGreaterThan(0.3);
  });

  it('gates breath-like noise between phrases but keeps the pause length', () => {
    const breath = noise(Math.round(0.3 * FS), 0.004); // about -51 dBFS RMS
    const input = concat(vowel(120, 0.5), breath, vowel(120, 0.5));
    const out = processHalVoice(input, FS, { tempo: 1 });
    expect(out.length).toBe(input.length);
    const gap = out.subarray(Math.round(0.6 * FS), Math.round(0.7 * FS));
    const voiced = out.subarray(Math.round(0.2 * FS), Math.round(0.3 * FS));
    expect(dB(rms(gap) / rms(voiced))).toBeLessThan(-60);
  });

  it('is deterministic and keeps silence silent', () => {
    const input = vowel(115, 0.8);
    expect(Array.from(processHalVoice(input, FS))).toEqual(Array.from(processHalVoice(input, FS)));
    expect(processHalVoice(new Float32Array(4800), FS).every((v) => v === 0)).toBe(true);
  });

  perfIt('processes five seconds of 24 kHz speech in under 150 ms', () => {
    const input = vowel(120, 5);
    // About 30 ms standalone.
    expect(bestCpuMs(() => processHalVoice(input, FS))).toBeLessThan(150);
  });
});

describe('HAL tempo from text', () => {
  it.each([
    ['Good afternoon, gentlemen.', 7],
    ['I am a computer.', 6],
    ['Hello', 2],
    ['', 0],
  ])('countSyllables(%j) = %d', (text, n) => {
    expect(countSyllables(text)).toBe(n);
  });

  it('stretches only when the rendered rate exceeds 4.7 syllables per second', () => {
    expect(halTempoFor(9, 2)).toBe(1); // 4.5 syl/s: already in range
    expect(halTempoFor(11, 2)).toBeCloseTo(4.5 / 5.5, 5); // 5.5 -> 4.5 syl/s
    expect(halTempoFor(40, 2)).toBe(0.8); // never more than 20% slower
    expect(halTempoFor(5, 0)).toBe(HAL_DEFAULT_TEMPO);
  });

  it('uses the text to choose the stretch', () => {
    const input = vowel(120, 1);
    // 3 syllables in about 1 s: slow enough, so no stretch.
    expect(processHalVoice(input, FS, { text: 'Hello there.' }).length).toBe(input.length);
    // 5 syllables in about 1 s: stretched to about 4.5 syl/s.
    const fast = processHalVoice(input, FS, { text: 'Hello, I am Dave.' });
    expect(countSyllables('Hello, I am Dave.')).toBe(5);
    expect(fast.length / input.length).toBeCloseTo(5 / 4.5, 1);
  });
});

describe('halShutdown', () => {
  it('ramps pitch and tempo along different curves', () => {
    expect(halShutdownFactors(0)).toEqual({ semitones: 0, pitch: 1, tempo: 1 });
    const end = halShutdownFactors(1);
    expect(end.semitones).toBeCloseTo(-12.5, 5);
    expect(end.pitch).toBeCloseTo(2 ** (-12.5 / 12), 5);
    expect(end.tempo).toBeCloseTo(0.25, 5);
    const half = halShutdownFactors(0.5);
    expect(half.semitones).toBeCloseTo(-12.5 * 0.5 ** 1.8, 5);
    expect(half.tempo).toBeCloseTo(1 - 0.75 * 0.5 ** 1.2, 5);
    // Decoupled: a tape slow-down would have pitch == tempo.
    expect(Math.abs(half.pitch - half.tempo)).toBeGreaterThan(0.1);
    expect(halShutdownFactors(2)).toEqual(end);
  });

  it('at the end, about 48 Hz from 99 Hz and four times as long', () => {
    const input = vowel(99, 0.5);
    const out = halShutdown(input, FS, 1);
    expect(out.length / input.length).toBeCloseTo(4, 1);
    const mid = Math.round(out.length / 2);
    const { hz } = estimatePitch(out.subarray(mid - 4800, mid + 4800), FS, 30);
    expect(Math.abs(hz - 99 * 2 ** (-12.5 / 12))).toBeLessThan(2);
  });

  it('halfway, pitch and duration move by their own factors', () => {
    const input = vowel(120, 0.5);
    const out = halShutdown(input, FS, 0.5);
    const { pitch, tempo } = halShutdownFactors(0.5);
    expect(out.length / input.length).toBeCloseTo(1 / tempo, 1);
    const mid = Math.round(out.length / 2);
    const { hz } = estimatePitch(out.subarray(mid - 2400, mid + 2400), FS, 40);
    expect(Math.abs(hz - 120 * pitch)).toBeLessThan(2);
  });

  it('returns an unchanged copy at progress 0', () => {
    const input = vowel(120, 0.1);
    const out = halShutdown(input, FS, 0);
    expect(out).not.toBe(input);
    expect(Array.from(out)).toEqual(Array.from(input));
  });
});
