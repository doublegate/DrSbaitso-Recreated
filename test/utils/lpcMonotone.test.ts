import { describe, it, expect } from 'vitest';
import { bestCpuMs, perfIt } from '../helpers/cpuTime';
import {
  autocorrelation,
  buildPitchContour,
  endPunctuationOf,
  estimatePitch,
  levinsonDurbin,
  lpcMonotone,
  lpcResynthesize,
  PITCH_TARGETS,
} from '@/utils/lpcMonotone';

const FS = 8475;

/** Deterministic uniform noise in [-1, 1) (mulberry32). */
function noise(length: number, seed = 1): Float32Array {
  let s = seed >>> 0;
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out[i] = (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
  return out;
}

/** Two-pole resonator, applied in place. */
function resonate(x: Float32Array, freq: number, bandwidth: number, fs: number): Float32Array {
  const r = Math.exp((-Math.PI * bandwidth) / fs);
  const a1 = 2 * r * Math.cos((2 * Math.PI * freq) / fs);
  const a2 = -r * r;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    y[i] = x[i] + a1 * (i > 0 ? y[i - 1] : 0) + a2 * (i > 1 ? y[i - 2] : 0);
  }
  return y;
}

/** A vowel-like test signal: an impulse train at f0 through two formants. */
function vowel(f0: number, seconds: number, fs = FS): Float32Array {
  const pulses = new Float32Array(Math.round(seconds * fs));
  let phase = 0;
  for (let i = 0; i < pulses.length; i++) {
    phase += f0 / fs;
    if (phase >= 1) {
      phase -= 1;
      pulses[i] = 1;
    }
  }
  const voiced = resonate(resonate(pulses, 500, 90, fs), 1500, 120, fs);
  let peak = 0;
  for (const v of voiced) peak = Math.max(peak, Math.abs(v));
  return voiced.map((v) => (v / peak) * 0.5);
}

const steady = (count: number) => Array.from({ length: count }, () => ({ voiced: true, energy: 1 }));
const rms = (x: Float32Array) => Math.sqrt(x.reduce((sum, v) => sum + v * v, 0) / x.length);

describe('levinsonDurbin', () => {
  it('recovers the coefficients of a known AR(2) process', () => {
    // x[n] = 1.3 x[n-1] - 0.6 x[n-2] + e[n]  =>  A(z) = 1 - 1.3 z^-1 + 0.6 z^-2
    const e = noise(40000, 7);
    const x = new Float32Array(e.length);
    for (let n = 0; n < x.length; n++) {
      x[n] = e[n] + 1.3 * (n > 0 ? x[n - 1] : 0) - 0.6 * (n > 1 ? x[n - 2] : 0);
    }
    const { a, error, reflection } = levinsonDurbin(autocorrelation(x, 2), 2);
    expect(a[0]).toBe(1);
    expect(a[1]).toBeCloseTo(-1.3, 1);
    expect(a[2]).toBeCloseTo(0.6, 1);
    expect(Math.abs(a[1] + 1.3)).toBeLessThan(0.03);
    expect(Math.abs(a[2] - 0.6)).toBeLessThan(0.03);
    expect(error).toBeGreaterThan(0);
    for (const k of reflection) expect(Math.abs(k)).toBeLessThan(1);
  });

  it('returns a trivial predictor for a zero signal', () => {
    const { a, error } = levinsonDurbin(new Float64Array(5), 4);
    expect(Array.from(a)).toEqual([1, 0, 0, 0, 0]);
    expect(error).toBe(0);
  });
});

describe('estimatePitch', () => {
  it.each([90, 140, 210])('finds %d Hz in a vowel-like signal', (f0) => {
    const { hz, strength } = estimatePitch(vowel(f0, 0.1), FS);
    expect(Math.abs(hz - f0)).toBeLessThan(f0 * 0.03);
    expect(strength).toBeGreaterThan(0.5);
  });

  it('reports noise as weakly periodic', () => {
    expect(estimatePitch(noise(400, 3), FS).strength).toBeLessThan(0.4);
  });
});

describe('buildPitchContour', () => {
  const frameRate = 1 / 0.015;

  it('holds the base pitch through the body of the utterance', () => {
    const contour = buildPitchContour(steady(60), frameRate, null);
    expect(contour[0]).toBe(PITCH_TARGETS.base);
    expect(contour[20]).toBe(PITCH_TARGETS.base);
  });

  it.each([
    ['.', PITCH_TARGETS.statementEnd],
    ['?', PITCH_TARGETS.questionEnd],
    ['!', PITCH_TARGETS.exclamationEnd],
    [null, PITCH_TARGETS.continuation],
  ] as const)('ends a "%s" utterance at its target', (punctuation, target) => {
    const contour = buildPitchContour(steady(60), frameRate, punctuation);
    expect(contour[59]).toBeCloseTo(target, 5);
  });

  it('marks unvoiced frames with 0 and ignores trailing silence when placing the end', () => {
    const frames = [...steady(40), { voiced: false, energy: 0 }, { voiced: false, energy: 0 }];
    const contour = buildPitchContour(frames, frameRate, '?');
    expect(contour[40]).toBe(0);
    expect(contour[41]).toBe(0);
    expect(contour[39]).toBeCloseTo(PITCH_TARGETS.questionEnd, 5);
  });

  it('steps the pitch between syllables instead of gliding', () => {
    // Two syllables separated by an energy dip.
    const energy = [...Array(20).fill(1), 0.2, 0.2, ...Array(38).fill(1)];
    const frames = energy.map((e) => ({ voiced: true, energy: e }));
    const contour = buildPitchContour(frames, frameRate, null);
    expect(contour[5]).toBe(contour[15]); // flat within a syllable
    expect(contour[25]).not.toBe(contour[15]); // a step at the boundary
    expect(contour[25]).toBe(contour[30]);
  });
});

describe('endPunctuationOf', () => {
  it.each([
    ['HELLO.', '.'],
    ['WHY DO YOU SAY THAT?', '?'],
    ['WOW!', '!'],
    ['HELLO', null],
    ['OK.  ', '.'],
    ['REALLY?"', '?'],
    ['WAIT...', '.'],
    ['', null],
  ] as const)('%j -> %s', (text, expected) => {
    expect(endPunctuationOf(text)).toBe(expected);
  });
});

describe('lpcMonotone', () => {
  it('keeps the input length', () => {
    for (const length of [0, 10, 300, 8475]) {
      expect(lpcMonotone(noise(length), { sampleRate: FS }).length).toBe(length);
    }
  });

  it('keeps silence silent', () => {
    const out = lpcMonotone(new Float32Array(4000), { sampleRate: FS, endPunctuation: '.' });
    expect(out.every((v) => v === 0)).toBe(true);
  });

  it.each([140, 210])('re-pitches a %d Hz vowel to the target pitch', (f0) => {
    const input = vowel(f0, 1.0);
    const out = lpcMonotone(input, { sampleRate: FS, endPunctuation: null });
    const middle = out.subarray(Math.round(0.3 * FS), Math.round(0.6 * FS));
    const { hz, strength } = estimatePitch(middle, FS);
    expect(Math.abs(hz - PITCH_TARGETS.base)).toBeLessThan(4);
    expect(strength).toBeGreaterThan(0.5);
  });

  it('applies the question rise at the end', () => {
    const out = lpcMonotone(vowel(120, 1.0), { sampleRate: FS, endPunctuation: '?' });
    const tail = out.subarray(Math.round(0.9 * FS), Math.round(0.98 * FS));
    expect(estimatePitch(tail, FS).hz).toBeGreaterThan(125);
  });

  it('keeps the level and stays bounded', () => {
    const input = vowel(150, 0.5);
    const out = lpcMonotone(input, { sampleRate: FS });
    const ratio = rms(out) / rms(input);
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.3);
    expect(out.every((v) => Number.isFinite(v) && Math.abs(v) < 2)).toBe(true);
  });

  it('is deterministic for the same input and seed', () => {
    const voiced = vowel(110, 6000 / FS);
    const input = Float32Array.from(noise(6000, 11), (v, i) => v * 0.3 + voiced[i]);
    const a = lpcMonotone(input, { sampleRate: FS, endPunctuation: '.' });
    const b = lpcMonotone(input, { sampleRate: FS, endPunctuation: '.' });
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  perfIt('processes five seconds of speech-rate audio quickly', () => {
    const fiveSeconds = Float32Array.from(vowel(130, 5), (v, i) => v * (0.6 + 0.4 * Math.sin(i / 400)));
    expect(bestCpuMs(() => lpcMonotone(fiveSeconds, { sampleRate: FS, endPunctuation: '.' }))).toBeLessThan(300);
  });
});

/** A contour that holds every voiced frame at one pitch. */
const flat = (hz: number) => (frames: readonly { voiced: boolean }[]) =>
  Float64Array.from(frames, (f) => (f.voiced ? hz : 0));

describe('lpcResynthesize', () => {
  it('follows a caller-supplied contour', () => {
    const out = lpcResynthesize(vowel(150, 1.0), { sampleRate: FS, contour: flat(110) });
    const { hz } = estimatePitch(out.subarray(Math.round(0.3 * FS), Math.round(0.6 * FS)), FS);
    expect(Math.abs(hz - 110)).toBeLessThan(3);
  });

  it('matches lpcMonotone when given the Sbaitso contour and noise excitation', () => {
    const input = vowel(120, 0.5);
    const a = lpcMonotone(input, { sampleRate: FS, endPunctuation: '?' });
    const b = lpcResynthesize(input, {
      sampleRate: FS,
      contour: (frames, frameRate) => buildPitchContour(frames, frameRate, '?'),
    });
    expect(Array.from(b)).toEqual(Array.from(a));
  });

  it('re-excites unvoiced frames with their own residual instead of noise', () => {
    // Noise in, residual excitation out: the output tracks the input sample by
    // sample far better than a fresh noise source could.
    const input = Float32Array.from(noise(4000, 5), (v) => v * 0.2);
    const out = lpcResynthesize(input, { sampleRate: FS, contour: flat(100), unvoiced: 'residual' });
    let dot = 0;
    let xx = 0;
    let yy = 0;
    for (let i = 0; i < input.length; i++) {
      dot += input[i] * out[i];
      xx += input[i] * input[i];
      yy += out[i] * out[i];
    }
    expect(dot / Math.sqrt(xx * yy)).toBeGreaterThan(0.8);
  });
});
