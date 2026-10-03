/**
 * Pitch-preserving time-stretch (WSOLA) and plain resampling, as pure
 * functions on Float32Array data.
 *
 * WSOLA (waveform-similarity overlap-add) cuts the input into Hann-windowed
 * frames, places them at a fixed output hop, and reads them at a different
 * input hop. Each frame's read position may move by up to `toleranceSeconds`
 * so its waveform lines up with the natural continuation of the previous
 * frame, which keeps periods intact and so keeps the pitch. This is the
 * digital counterpart of the Eltro rate changer used on HAL's voice
 * (ref-docs/09-hal-and-wopr-voices.md sections 2.1 and 6.2).
 *
 * @module timeStretch
 */

export interface TimeStretchOptions {
  /** Frame length in seconds (default 0.04: 40 ms, 50% overlap). */
  frameSeconds?: number;
  /** Search range for the best-matching frame, +/- seconds (default 0.01). */
  toleranceSeconds?: number;
}

/**
 * Changes the tempo by `rate` without changing the pitch. The output has
 * `round(length / rate)` samples, so a rate below 1 slows the speech down.
 */
export function timeStretch(
  input: Float32Array,
  sampleRate: number,
  rate: number,
  { frameSeconds = 0.04, toleranceSeconds = 0.01 }: TimeStretchOptions = {},
): Float32Array {
  const length = input.length;
  const outLength = Math.round(length / rate);
  if (length === 0 || !(rate > 0)) return new Float32Array(Math.max(0, outLength || 0));
  if (rate === 1) return Float32Array.from(input);

  const frame = 2 * Math.max(2, Math.round((frameSeconds * sampleRate) / 2));
  const synthesisHop = frame / 2;
  const analysisHop = synthesisHop * rate;
  const tolerance = Math.max(0, Math.round(toleranceSeconds * sampleRate));

  // Periodic Hann: copies at a hop of half the frame sum to exactly 1.
  const window = new Float32Array(frame);
  for (let k = 0; k < frame; k++) window[k] = 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / frame);

  // Frame m is written at output (m - 1) * hop, so output sample 0 already
  // sits under two frames (no fade-in). Pad the input so every read is in range.
  const front = synthesisHop + tolerance;
  const padded = new Float32Array(front + length + frame + 2 * tolerance + synthesisHop);
  padded.set(input, front);

  const out = new Float32Array(outLength + frame);
  const frameCount = Math.ceil(outLength / synthesisHop) + 2;
  // Similarity of the frame at `candidate` with the natural continuation,
  // on every `stride`-th sample.
  const similarity = (candidate: number, natural: number, stride: number) => {
    let score = 0;
    for (let k = 0; k < frame; k += stride) score += padded[candidate + k] * padded[natural + k];
    return score;
  };
  const inRange = (candidate: number) => candidate >= 0 && candidate + frame <= padded.length;
  // Coarse-to-fine search: every 3rd offset on every 6th sample, then the
  // neighbours of the best on every 2nd sample. Speech periods are 2.5-12 ms,
  // far longer than either step.
  const coarseStep = 3;
  let previous = -1;
  for (let m = 0; m < frameCount; m++) {
    const ideal = front + Math.round((m - 1) * analysisHop);
    let position = ideal;
    const natural = previous + synthesisHop;
    if (previous >= 0 && tolerance > 0 && natural + frame <= padded.length) {
      let best = -Infinity;
      for (let delta = -tolerance; delta <= tolerance; delta += coarseStep) {
        const candidate = ideal + delta;
        if (!inRange(candidate)) continue;
        const score = similarity(candidate, natural, 6);
        if (score > best) {
          best = score;
          position = candidate;
        }
      }
      const centre = position;
      best = -Infinity;
      for (let delta = -coarseStep + 1; delta < coarseStep; delta++) {
        const candidate = centre + delta;
        if (!inRange(candidate) || Math.abs(candidate - ideal) > tolerance) continue;
        const score = similarity(candidate, natural, 2);
        if (score > best) {
          best = score;
          position = candidate;
        }
      }
    }
    if (position + frame > padded.length) break;
    const target = (m - 1) * synthesisHop;
    for (let k = 0; k < frame; k++) {
      const o = target + k;
      if (o >= 0 && o < out.length) out[o] += padded[position + k] * window[k];
    }
    previous = position;
  }
  return out.slice(0, outLength);
}

/**
 * Tape-style resampling by `factor` with linear interpolation: the pitch is
 * multiplied by `factor` and the duration divided by it. Meant for factors at
 * or below 1 (lowering the pitch); raising it would need an anti-alias filter.
 */
export function resampleBy(input: Float32Array, factor: number): Float32Array {
  const outLength = Math.round(input.length / factor);
  const out = new Float32Array(Math.max(0, outLength));
  const last = input.length - 1;
  if (last < 0) return out;
  for (let j = 0; j < out.length; j++) {
    const position = j * factor;
    const i = Math.floor(position);
    if (i >= last) {
      out[j] = input[last];
    } else {
      const frac = position - i;
      out[j] = input[i] + (input[i + 1] - input[i]) * frac;
    }
  }
  return out;
}
