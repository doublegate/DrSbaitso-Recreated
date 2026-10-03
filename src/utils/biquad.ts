/**
 * RBJ audio-EQ-cookbook biquads in transposed direct form II, shared by the
 * offline voice chains (vintageAudioProcessing, personaVoices). Pure
 * functions on Float32Array data.
 *
 * @module biquad
 */

export interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export type BiquadType = 'lowpass' | 'highpass' | 'highshelf' | 'lowshelf' | 'peaking';

/** Section Qs of a 4th-order Butterworth filter (two cascaded biquads). */
export const BUTTERWORTH_4_Q = [0.5412, 1.3066] as const;

/** Section Qs of an 8th-order Butterworth filter (four cascaded biquads). */
export const BUTTERWORTH_8_Q = [0.5098, 0.6013, 0.9, 2.5629] as const;

/**
 * Designs one biquad. `q` is the resonance for pass/peaking filters; the
 * shelves use slope S = 1. `gainDb` applies to shelves and peaking only.
 */
export function designBiquad(
  type: BiquadType,
  frequency: number,
  sampleRate: number,
  q = Math.SQRT1_2,
  gainDb = 0,
): Biquad {
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
  if (type === 'highshelf' || type === 'lowshelf') {
    const A = 10 ** (gainDb / 40);
    const alpha = (sin / 2) * Math.SQRT2; // shelf slope S = 1
    const root = 2 * Math.sqrt(A) * alpha;
    if (type === 'highshelf') {
      b0 = A * (A + 1 + (A - 1) * cos + root);
      b1 = -2 * A * (A - 1 + (A + 1) * cos);
      b2 = A * (A + 1 + (A - 1) * cos - root);
      a0 = A + 1 - (A - 1) * cos + root;
      a1 = 2 * (A - 1 - (A + 1) * cos);
      a2 = A + 1 - (A - 1) * cos - root;
    } else {
      b0 = A * (A + 1 - (A - 1) * cos + root);
      b1 = 2 * A * (A - 1 - (A + 1) * cos);
      b2 = A * (A + 1 - (A - 1) * cos - root);
      a0 = A + 1 + (A - 1) * cos + root;
      a1 = -2 * (A - 1 + (A + 1) * cos);
      a2 = A + 1 + (A - 1) * cos - root;
    }
  } else if (type === 'peaking') {
    const A = 10 ** (gainDb / 40);
    const alpha = sin / (2 * q);
    b0 = 1 + alpha * A;
    b1 = -2 * cos;
    b2 = 1 - alpha * A;
    a0 = 1 + alpha / A;
    a1 = -2 * cos;
    a2 = 1 - alpha / A;
  } else {
    const alpha = sin / (2 * q);
    b1 = type === 'lowpass' ? 1 - cos : -(1 + cos);
    b0 = type === 'lowpass' ? (1 - cos) / 2 : (1 + cos) / 2;
    b2 = b0;
    a0 = 1 + alpha;
    a1 = -2 * cos;
    a2 = 1 - alpha;
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** Filters `x` through one biquad, returning a new array. */
export function applyBiquad(x: Float32Array, f: Biquad): Float32Array {
  const y = new Float32Array(x.length);
  let z1 = 0;
  let z2 = 0;
  for (let i = 0; i < x.length; i++) {
    const input = x[i];
    const output = f.b0 * input + z1;
    z1 = f.b1 * input - f.a1 * output + z2;
    z2 = f.b2 * input - f.a2 * output;
    y[i] = output;
  }
  return y;
}

/** Cascades one low- or high-pass section per Q (e.g. BUTTERWORTH_4_Q). */
export function applyCascade(
  x: Float32Array,
  type: 'lowpass' | 'highpass',
  frequency: number,
  sampleRate: number,
  qs: readonly number[],
): Float32Array {
  let y = x;
  for (const q of qs) y = applyBiquad(y, designBiquad(type, frequency, sampleRate, q));
  return y;
}
