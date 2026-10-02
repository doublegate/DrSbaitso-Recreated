/**
 * LPC pitch flattening ("monotone" resynthesis).
 *
 * The original Dr. Sbaitso voice (First Byte SmoothTalker 3.5) repeats one
 * stored pitch period per phoneme, so its pitch is held flat on each syllable,
 * steps between syllables, and follows fixed rules at the end of a sentence:
 * about 92 Hz in the body, a fall to about 75 Hz before a period, a rise to
 * about 150 Hz before a question mark and about 125 Hz before an exclamation
 * mark (measured; ref-docs/02-voice-and-audio.md sections 3.2 and 7.3).
 *
 * Gemini's natural intonation is replaced here by source-filter resynthesis:
 * each frame is fitted with an all-pole (LPC) model of the vocal tract, and
 * the model is re-excited by a pulse train at the target pitch (voiced
 * frames) or by noise (unvoiced frames), then overlap-added. The spectral
 * envelope, and so the words, survive; the pitch contour does not.
 *
 * Everything is a pure function on Float32Array data, deterministic for a
 * given input and seed, and fast enough to run offline before playback.
 *
 * @module lpcMonotone
 */

export type EndPunctuation = '.' | '?' | '!' | null;

/** Pitch targets in Hz, from the measured original engine at default settings. */
export const PITCH_TARGETS = {
  /** Body of an utterance: the plateau that syllables step around. */
  base: 92,
  /** Last word before ".". */
  statementEnd: 75,
  /** Last word before "?". */
  questionEnd: 150,
  /** Last word before "!". */
  exclamationEnd: 125,
  /** Unpunctuated end (or ","): level with a slight rise. */
  continuation: 97,
} as const;

/** Step offsets (Hz) applied to successive syllables: flat plateaus, small steps. */
const SYLLABLE_STEPS = [0, 7, -3, 10, 2, -5, 5, -2];

/** Final-glide duration limits, in seconds. */
const MIN_GLIDE_SECONDS = 0.12;
const MAX_GLIDE_SECONDS = 0.3;

/** Analysis frame length (seconds); frames overlap by 50%. */
const FRAME_SECONDS = 0.03;
/** Window for the voicing/pitch decision; must hold two periods of the lowest pitch. */
const VOICING_WINDOW_SECONDS = 0.04;

export interface LevinsonResult {
  /** Prediction-error filter A(z) = a[0] + a[1] z^-1 + ... with a[0] = 1. */
  a: Float64Array;
  /** Final prediction-error power. */
  error: number;
  /** Reflection coefficients k[1..order] (index 0 unused). */
  reflection: Float64Array;
}

/**
 * Biased autocorrelation r[0..maxLag] of a signal.
 */
export function autocorrelation(x: ArrayLike<number>, maxLag: number): Float64Array {
  const r = new Float64Array(maxLag + 1);
  const n = x.length;
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < n; i++) sum += x[i] * x[i - lag];
    r[lag] = sum;
  }
  return r;
}

/**
 * Levinson-Durbin recursion: solves the autocorrelation normal equations for
 * the order-p prediction-error filter. With a positive-definite r every
 * reflection coefficient has magnitude below 1, so 1/A(z) is stable.
 */
export function levinsonDurbin(r: ArrayLike<number>, order: number): LevinsonResult {
  const a = new Float64Array(order + 1);
  const reflection = new Float64Array(order + 1);
  a[0] = 1;
  let error = r[0];
  if (!(error > 0)) return { a, error: 0, reflection };

  const previous = new Float64Array(order + 1);
  for (let i = 1; i <= order; i++) {
    let acc = r[i];
    for (let j = 1; j < i; j++) acc += a[j] * r[i - j];
    const k = -acc / error;
    reflection[i] = k;
    previous.set(a);
    for (let j = 1; j < i; j++) a[j] = previous[j] + k * previous[i - j];
    a[i] = k;
    error *= 1 - k * k;
    if (!(error > 0)) {
      error = 0;
      break;
    }
  }
  return { a, error, reflection };
}

/**
 * Autocorrelation pitch estimate over [minHz, maxHz]. `strength` is the
 * normalised correlation at the chosen lag (1 = perfectly periodic). The
 * shortest lag within 85% of the best peak wins, which avoids octave-down
 * errors on strongly periodic signals.
 */
export function estimatePitch(
  x: ArrayLike<number>,
  sampleRate: number,
  minHz = 60,
  maxHz = 400,
): { hz: number; strength: number } {
  const n = x.length;
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(n - 2, Math.ceil(sampleRate / minHz));
  if (maxLag <= minLag) return { hz: 0, strength: 0 };

  const corr = new Float64Array(maxLag + 2);
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let xy = 0;
    let xx = 0;
    let yy = 0;
    for (let i = lag; i < n; i++) {
      const p = x[i];
      const q = x[i - lag];
      xy += p * q;
      xx += p * p;
      yy += q * q;
    }
    corr[lag] = xx > 0 && yy > 0 ? xy / Math.sqrt(xx * yy) : 0;
  }

  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) best = Math.max(best, corr[lag]);
  if (best <= 0) return { hz: 0, strength: 0 };

  for (let lag = minLag; lag <= maxLag; lag++) {
    const isPeak = corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1];
    if (isPeak && corr[lag] >= 0.85 * best) {
      // Parabolic interpolation for a fractional lag.
      const left = corr[lag - 1];
      const right = corr[lag + 1];
      const denominator = left - 2 * corr[lag] + right;
      const shift = denominator !== 0 ? (0.5 * (left - right)) / denominator : 0;
      return { hz: sampleRate / (lag + Math.max(-0.5, Math.min(0.5, shift))), strength: corr[lag] };
    }
  }
  return { hz: 0, strength: 0 };
}

/**
 * Finds the sentence-final punctuation that drives the end contour. Trailing
 * quotes, brackets and spaces are ignored; anything else ends level.
 */
export function endPunctuationOf(text: string): EndPunctuation {
  const match = /([.?!])[\s"')\]]*$/.exec(text);
  return match ? (match[1] as '.' | '?' | '!') : null;
}

export interface ContourFrame {
  voiced: boolean;
  /** Frame RMS, used to find syllables. */
  energy: number;
}

function endTarget(endPunctuation: EndPunctuation): number {
  switch (endPunctuation) {
    case '.':
      return PITCH_TARGETS.statementEnd;
    case '?':
      return PITCH_TARGETS.questionEnd;
    case '!':
      return PITCH_TARGETS.exclamationEnd;
    default:
      return PITCH_TARGETS.continuation;
  }
}

/**
 * Builds the target F0 (Hz) per frame: 0 for unvoiced frames, a flat plateau
 * per syllable (syllables are split at dips in the energy envelope), and a
 * glide to the punctuation target over the last word.
 */
export function buildPitchContour(
  frames: readonly ContourFrame[],
  frameRate: number,
  endPunctuation: EndPunctuation,
  baseHz: number = PITCH_TARGETS.base,
): Float64Array {
  const count = frames.length;
  const contour = new Float64Array(count);
  const minSyllableFrames = Math.max(2, Math.round(0.06 * frameRate));
  const syllableStart = new Int32Array(count).fill(-1);

  let syllable = 0;
  let i = 0;
  while (i < count) {
    if (!frames[i].voiced) {
      i++;
      continue;
    }
    // One voiced run: [runStart, runEnd).
    const runStart = i;
    while (i < count && frames[i].voiced) i++;
    const runEnd = i;

    const smooth = new Float64Array(runEnd - runStart);
    for (let k = runStart; k < runEnd; k++) {
      const lo = Math.max(runStart, k - 1);
      const hi = Math.min(runEnd - 1, k + 1);
      let sum = 0;
      for (let m = lo; m <= hi; m++) sum += frames[m].energy;
      smooth[k - runStart] = sum / (hi - lo + 1);
    }

    let start = runStart;
    let peakBefore = 0;
    for (let k = runStart; k < runEnd; k++) {
      const e = smooth[k - runStart];
      const isDip = k > runStart && k < runEnd - 1 && e < smooth[k - runStart - 1] && e <= smooth[k - runStart + 1];
      if (isDip && k - start >= minSyllableFrames && runEnd - k >= minSyllableFrames) {
        let peakAfter = 0;
        for (let m = k + 1; m < runEnd; m++) peakAfter = Math.max(peakAfter, smooth[m - runStart]);
        if (e < 0.8 * Math.min(peakBefore, peakAfter)) {
          for (let m = start; m < k; m++) contour[m] = baseHz + SYLLABLE_STEPS[syllable % SYLLABLE_STEPS.length];
          for (let m = start; m < k; m++) syllableStart[m] = start;
          syllable++;
          start = k;
          peakBefore = 0;
        }
      }
      peakBefore = Math.max(peakBefore, e);
    }
    for (let m = start; m < runEnd; m++) {
      contour[m] = baseHz + SYLLABLE_STEPS[syllable % SYLLABLE_STEPS.length];
      syllableStart[m] = start;
    }
    syllable++;
  }

  // Final glide over the last word: from the plateau to the punctuation target.
  let last = count - 1;
  while (last >= 0 && !frames[last].voiced) last--;
  if (last < 0) return contour;
  let firstVoiced = 0;
  while (!frames[firstVoiced].voiced) firstVoiced++;

  const minGlide = Math.max(1, Math.round(MIN_GLIDE_SECONDS * frameRate));
  const maxGlide = Math.max(minGlide, Math.round(MAX_GLIDE_SECONDS * frameRate));
  const glideStart = Math.max(
    firstVoiced,
    Math.min(syllableStart[last], last - minGlide + 1),
    last - maxGlide + 1,
  );
  const from = contour[glideStart];
  const to = endTarget(endPunctuation);
  const span = last - glideStart;
  for (let k = glideStart; k <= last; k++) {
    if (!frames[k].voiced) continue;
    contour[k] = span > 0 ? from + (to - from) * ((k - glideStart) / span) : to;
  }
  return contour;
}

export interface LpcMonotoneOptions {
  sampleRate: number;
  endPunctuation?: EndPunctuation;
  /** Plateau pitch in Hz (default 92). */
  baseHz?: number;
  /** LPC order (default 12, suited to about 8 kHz). */
  order?: number;
  /** Seed for the unvoiced-noise generator. */
  seed?: number;
}

/** Deterministic PRNG (mulberry32) returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds the target F0 (Hz, 0 = unvoiced) for each analysis frame. */
export type ContourBuilder = (frames: readonly ContourFrame[], frameRate: number) => Float64Array;

export interface LpcResynthesisOptions {
  sampleRate: number;
  /** Target pitch per frame; frame f is centred at f / frameRate seconds. */
  contour: ContourBuilder;
  /** LPC order (default 12, suited to about 8 kHz). */
  order?: number;
  /** Seed for the unvoiced-noise generator. */
  seed?: number;
  /**
   * Excitation of unvoiced frames: seeded noise (default), or the frame's own
   * LPC residual, which keeps human-sounding fricatives (ref-docs/09 6.3).
   */
  unvoiced?: 'noise' | 'residual';
  /**
   * Share of the residual mixed into voiced frames (0-1, default 0). The
   * pulse train and the residual are both scaled to unit power first.
   */
  residualMix?: number;
}

/**
 * Source-filter resynthesis at a caller-chosen pitch contour. The output has
 * the input's length and, frame by frame, its energy; all-zero input stays
 * zero. Deterministic for a given input, contour and seed.
 */
export function lpcResynthesize(input: Float32Array, options: LpcResynthesisOptions): Float32Array {
  const { sampleRate, contour: buildContour, order = 12, seed = 0x5ba1750, unvoiced = 'noise', residualMix = 0 } = options;
  const length = input.length;
  const output = new Float32Array(length);
  if (length === 0) return output;

  const frameLength = 2 * Math.max(order + 1, Math.round((FRAME_SECONDS * sampleRate) / 2));
  const hop = frameLength / 2;
  // Pad by one hop at each end so every input sample is covered by two frames.
  const padded = new Float32Array(length + 2 * hop + frameLength);
  padded.set(input, hop);
  const frameCount = Math.ceil((length + hop) / hop);

  const window = new Float64Array(frameLength);
  for (let k = 0; k < frameLength; k++) window[k] = 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / frameLength);

  // Lag window (60 Hz Gaussian) and bandwidth expansion keep the filters well behaved.
  const lagWindow = new Float64Array(order + 1);
  for (let k = 0; k <= order; k++) lagWindow[k] = Math.exp(-0.5 * ((2 * Math.PI * 60 * k) / sampleRate) ** 2);
  lagWindow[0] = 1 + 1e-4;
  const gamma = 0.994;

  // Pass 1: analyse every frame.
  const coefficients: Float64Array[] = [];
  const frameEnergy = new Float64Array(frameCount);
  const frames: ContourFrame[] = [];
  const voicingLength = Math.max(frameLength, Math.round(VOICING_WINDOW_SECONDS * sampleRate));
  const windowed = new Float64Array(frameLength);
  let maxRms = 0;
  const rmsByFrame = new Float64Array(frameCount);
  for (let f = 0; f < frameCount; f++) {
    const start = f * hop;
    let energy = 0;
    for (let k = 0; k < frameLength; k++) {
      const v = padded[start + k] * window[k];
      windowed[k] = v;
      energy += v * v;
    }
    frameEnergy[f] = energy;
    const r = autocorrelation(windowed, order);
    for (let k = 0; k <= order; k++) r[k] *= lagWindow[k];
    const { a } = levinsonDurbin(r, order);
    let g = 1;
    for (let k = 1; k <= order; k++) {
      g *= gamma;
      a[k] *= g;
    }
    coefficients.push(a);
    rmsByFrame[f] = Math.sqrt(energy / frameLength);
    maxRms = Math.max(maxRms, rmsByFrame[f]);
  }

  for (let f = 0; f < frameCount; f++) {
    const rms = rmsByFrame[f];
    let voiced = false;
    if (maxRms > 0 && rms >= 0.05 * maxRms) {
      const centre = f * hop + hop;
      const from = Math.max(0, Math.min(padded.length - voicingLength, centre - (voicingLength >> 1)));
      const segment = padded.subarray(from, from + voicingLength);
      let crossings = 0;
      for (let k = 1; k < segment.length; k++) if ((segment[k] >= 0) !== (segment[k - 1] >= 0)) crossings++;
      const zeroCrossingRate = crossings / segment.length;
      voiced = zeroCrossingRate < 0.35 && estimatePitch(segment, sampleRate).strength >= 0.4;
    }
    frames.push({ voiced, energy: rms });
  }

  const contour = buildContour(frames, sampleRate / hop);

  // Pass 2: one continuous excitation, so pulses line up across overlapping frames.
  const excitation = new Float64Array(padded.length);
  const isPulse = new Uint8Array(padded.length);
  const random = mulberry32(seed);
  let phase = 0;
  for (let i = 0; i < excitation.length; i++) {
    const f = Math.max(0, Math.min(frameCount - 1, Math.round((i - hop) / hop)));
    const f0 = contour[f];
    if (frames[f].voiced && f0 > 0) {
      isPulse[i] = 1;
      phase += f0 / sampleRate;
      if (phase >= 1) {
        phase -= 1;
        excitation[i] = Math.sqrt(sampleRate / f0);
      }
    } else {
      excitation[i] = (random() * 2 - 1) * Math.sqrt(3);
    }
  }

  // Pass 3: filter each frame through 1/A(z), match its energy, overlap-add.
  const useResidual = unvoiced === 'residual' || residualMix > 0;
  const synthesis = new Float64Array(padded.length);
  const warmUp = hop;
  const history = new Float64Array(order);
  const frameOut = new Float64Array(frameLength);
  const residual = new Float64Array(frameLength + warmUp);
  for (let f = 0; f < frameCount; f++) {
    if (frameEnergy[f] <= 0) continue;
    const a = coefficients[f];
    const start = f * hop;
    const voicedFrame = frames[f].voiced && contour[f] > 0;
    let residualScale = 0;
    if (useResidual) {
      // e[n] = A(z) x[n] over this frame (and its warm-up), at unit power.
      let power = 0;
      for (let i = start - warmUp; i < start + frameLength; i++) {
        let e = 0;
        for (let k = 0; k <= order; k++) {
          const j = i - k;
          if (j >= 0) e += a[k] * padded[j];
        }
        residual[i - start + warmUp] = e;
        power += e * e;
      }
      residualScale = power > 0 ? 1 / Math.sqrt(power / (frameLength + warmUp)) : 0;
    }
    const pulseShare = voicedFrame ? 1 - residualMix : 0;
    const residualShare = voicedFrame ? residualMix : unvoiced === 'residual' ? 1 : 0;
    history.fill(0);
    let synthEnergy = 0;
    for (let i = start - warmUp; i < start + frameLength; i++) {
      let y = 0;
      if (i >= 0) {
        if (!useResidual || (voicedFrame && residualShare === 0) || (!voicedFrame && unvoiced === 'noise')) {
          y = excitation[i];
        } else {
          const pulse = isPulse[i] ? excitation[i] : 0;
          y = pulseShare * pulse + residualShare * residual[i - start + warmUp] * residualScale;
        }
      }
      for (let k = 1; k <= order; k++) y -= a[k] * history[k - 1];
      for (let k = order - 1; k > 0; k--) history[k] = history[k - 1];
      history[0] = y;
      if (i >= start) {
        const v = y * window[i - start];
        frameOut[i - start] = v;
        synthEnergy += v * v;
      }
    }
    if (!(synthEnergy > 0)) continue;
    const gain = Math.sqrt(frameEnergy[f] / synthEnergy);
    for (let k = 0; k < frameLength; k++) synthesis[start + k] += frameOut[k] * gain;
  }

  // Hann windows at 50% overlap sum to 1, so the overlap-add needs no
  // normalisation; analysis used the same window, hence matched energy.
  for (let i = 0; i < length; i++) output[i] = synthesis[i + hop];
  return output;
}

/**
 * Resynthesises speech with the Sbaitso pitch contour. The output has the
 * input's length and, frame by frame, its energy; all-zero input stays zero.
 */
export function lpcMonotone(input: Float32Array, options: LpcMonotoneOptions): Float32Array {
  const { sampleRate, endPunctuation = null, baseHz = PITCH_TARGETS.base, order = 12, seed = 0x5ba1750 } = options;
  return lpcResynthesize(input, {
    sampleRate,
    order,
    seed,
    contour: (frames, frameRate) => buildPitchContour(frames, frameRate, endPunctuation, baseHz),
  });
}
