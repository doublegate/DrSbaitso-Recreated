/**
 * Persona voice chains for HAL 9000 and JOSHUA/WOPR.
 *
 * Both film voices are human performances shaped by editing, not
 * synthesizers (ref-docs/09-hal-and-wopr-voices.md), so neither goes through
 * the Dr. Sbaitso 8475 Hz / 8-bit / LPC chain:
 *
 * - HAL (section 6.2): breaths removed, the whole delivery slowed by about
 *   12% at the same pitch (Kubrick's Eltro pass), a close-miked low end and
 *   gentle compression. No reverb, crush, resampling or pitch flattening.
 * - WOPR (section 6.3): see processWoprVoice below.
 *
 * Everything is a pure, deterministic function on Float32Array data.
 *
 * @module personaVoices
 */
import { applyBiquad, designBiquad } from './biquad';
import { timeStretch, resampleBy } from './timeStretch';

// ---------------------------------------------------------------- shared

const dbToGain = (db: number) => 10 ** (db / 20);

/** Scales to an RMS target, never letting the peak exceed `peak`. */
function normalise(x: Float32Array, targetRms: number, peak: number): void {
  let max = 0;
  let sum = 0;
  for (const v of x) {
    max = Math.max(max, Math.abs(v));
    sum += v * v;
  }
  const rms = Math.sqrt(sum / Math.max(1, x.length));
  if (!(max > 0) || !(rms > 0)) return;
  const gain = Math.min(targetRms > 0 ? targetRms / rms : Infinity, peak / max);
  for (let i = 0; i < x.length; i++) x[i] *= gain;
}

/** Per-frame RMS in dBFS and zero-crossing rate. */
function frameStats(x: Float32Array, frameLength: number): { db: Float64Array; zcr: Float64Array } {
  const count = Math.ceil(x.length / frameLength);
  const db = new Float64Array(count);
  const zcr = new Float64Array(count);
  for (let f = 0; f < count; f++) {
    const from = f * frameLength;
    const to = Math.min(x.length, from + frameLength);
    let sum = 0;
    let crossings = 0;
    for (let i = from; i < to; i++) {
      sum += x[i] * x[i];
      if (i > from && (x[i] >= 0) !== (x[i - 1] >= 0)) crossings++;
    }
    const rms = Math.sqrt(sum / Math.max(1, to - from));
    db[f] = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
    zcr[f] = crossings / Math.max(1, to - from);
  }
  return { db, zcr };
}

/**
 * Rough syllable count: vowel groups per word, a silent final "e" dropped,
 * at least one per word; digits count one each.
 */
export function countSyllables(text: string): number {
  let total = 0;
  for (const raw of text.toLowerCase().split(/[^a-z0-9']+/)) {
    if (!raw) continue;
    if (/^\d+$/.test(raw)) {
      total += raw.length;
      continue;
    }
    const word = raw.replace(/'/g, '');
    let groups = (word.match(/[aeiouy]+/g) ?? []).length;
    if (groups > 1 && /[^aeiouy]e$/.test(word) && !word.endsWith('le')) groups--;
    total += Math.max(1, groups);
  }
  return total;
}

// ---------------------------------------------------------------- HAL

/** Kubrick's stretch was "about 10-20%"; 0.88 lands at the measured 4.3-4.7 syl/s. */
export const HAL_DEFAULT_TEMPO = 0.88;
/** Above this rate the delivery is slowed (ref-docs/09 section 2.2). */
const HAL_MAX_RATE = 4.7;
/** Rate aimed for when slowing. */
const HAL_TARGET_RATE = 4.5;
/** Never slow by more than Kubrick's 20%. */
const HAL_MIN_TEMPO = 0.8;

/**
 * Tempo factor for a rendered utterance of `syllables` over `seconds` of
 * speech: 1 when already at or below 4.7 syllables per second, otherwise
 * enough to land at 4.5, but never below 0.8. Without a usable measurement
 * it returns the default 0.88.
 */
export function halTempoFor(syllables: number, seconds: number): number {
  if (!(syllables > 0) || !(seconds > 0)) return HAL_DEFAULT_TEMPO;
  const rate = syllables / seconds;
  if (rate <= HAL_MAX_RATE) return 1;
  return Math.max(HAL_MIN_TEMPO, HAL_TARGET_RATE / rate);
}

/** Seconds from the first to the last frame within 40 dB of the loudest. */
function speakingSeconds(x: Float32Array, sampleRate: number): number {
  const frame = Math.max(1, Math.round(0.01 * sampleRate));
  const { db } = frameStats(x, frame);
  let peak = -Infinity;
  for (const v of db) peak = Math.max(peak, v);
  if (!Number.isFinite(peak)) return 0;
  let first = -1;
  let last = -1;
  for (let f = 0; f < db.length; f++) {
    if (db[f] > peak - 40) {
      if (first < 0) first = f;
      last = f;
    }
  }
  return first < 0 ? 0 : ((last - first + 1) * frame) / sampleRate;
}

/**
 * Silences breath-like noise between phrases (ref-docs/09 6.2 stage 1): 10 ms
 * frames below -45 dBFS that are noise-like (or near silent). The gate opens
 * 5 ms ahead of speech, holds 30 ms after it and closes over 60 ms, so speech
 * is never clipped and pauses keep their length.
 */
export function breathGate(x: Float32Array, sampleRate: number): Float32Array {
  const frame = Math.max(1, Math.round(0.01 * sampleRate));
  const { db, zcr } = frameStats(x, frame);
  const target = new Float32Array(x.length);
  const hold = Math.round(0.03 * sampleRate);
  for (let f = 0; f < db.length; f++) {
    const gated = db[f] < -45 && (zcr[f] > 0.1 || db[f] < -70);
    if (gated) continue;
    const from = f * frame;
    const to = Math.min(x.length, from + frame + hold);
    target.fill(1, from, to);
  }
  const release = 1 / Math.max(1, Math.round(0.06 * sampleRate));
  const attack = 1 / Math.max(1, Math.round(0.005 * sampleRate));
  const gain = new Float32Array(x.length);
  let g = 0;
  for (let i = 0; i < x.length; i++) {
    g = Math.max(target[i], g - release);
    gain[i] = g;
  }
  g = 0;
  for (let i = x.length - 1; i >= 0; i--) {
    g = Math.max(gain[i], g - attack);
    gain[i] = g;
  }
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] * gain[i];
  return out;
}

export interface CompressorOptions {
  thresholdDb: number;
  ratio: number;
  kneeDb: number;
  attackSeconds: number;
  releaseSeconds: number;
}

/** Feed-forward peak compressor with a soft knee (DynamicsCompressorNode-like). */
export function compress(x: Float32Array, sampleRate: number, o: CompressorOptions): Float32Array {
  const attack = Math.exp(-1 / (o.attackSeconds * sampleRate));
  const release = Math.exp(-1 / (o.releaseSeconds * sampleRate));
  const out = new Float32Array(x.length);
  const halfKnee = o.kneeDb / 2;
  const slope = 1 - 1 / o.ratio;
  let envelope = 0;
  for (let i = 0; i < x.length; i++) {
    const level = Math.abs(x[i]);
    const coefficient = level > envelope ? attack : release;
    envelope = coefficient * envelope + (1 - coefficient) * level;
    if (envelope <= 0) {
      out[i] = x[i];
      continue;
    }
    const over = 20 * Math.log10(envelope) - o.thresholdDb;
    let reductionDb = 0;
    if (over >= halfKnee) reductionDb = slope * over;
    else if (over > -halfKnee) reductionDb = (slope * (over + halfKnee) ** 2) / (2 * o.kneeDb);
    out[i] = x[i] * dbToGain(-reductionDb);
  }
  return out;
}

const HAL_COMPRESSOR: CompressorOptions = {
  thresholdDb: -24,
  ratio: 2.5,
  kneeDb: 10,
  attackSeconds: 0.01,
  releaseSeconds: 0.2,
};

export interface HalVoiceOptions {
  /**
   * Tempo factor (below 1 slows down). Default: from `text` via halTempoFor,
   * or HAL_DEFAULT_TEMPO without text.
   */
  tempo?: number;
  /** What the audio says, used to measure the syllable rate. */
  text?: string;
  /** Remove breath-like noise between phrases (default true). */
  breathGate?: boolean;
}

/**
 * HAL 9000 chain (ref-docs/09 section 6.2): breath gate, pitch-preserving
 * slow-down (WSOLA), 50 Hz high-pass, +2 dB low shelf at 150 Hz, 2.5:1
 * compression, then RMS about -16 dBFS with peaks at or below -3 dBFS. The
 * output length is the input length divided by the tempo.
 */
export function processHalVoice(input: Float32Array, sampleRate: number, options: HalVoiceOptions = {}): Float32Array {
  if (input.length === 0) return new Float32Array(0);
  let signal = options.breathGate === false ? Float32Array.from(input) : breathGate(input, sampleRate);

  const tempo =
    options.tempo ??
    (options.text !== undefined
      ? halTempoFor(countSyllables(options.text), speakingSeconds(input, sampleRate))
      : HAL_DEFAULT_TEMPO);
  if (tempo !== 1) signal = timeStretch(signal, sampleRate, tempo);

  signal = applyBiquad(signal, designBiquad('highpass', 50, sampleRate));
  signal = applyBiquad(signal, designBiquad('lowshelf', 150, sampleRate, Math.SQRT1_2, 2));
  signal = compress(signal, sampleRate, HAL_COMPRESSOR);
  normalise(signal, dbToGain(-16), dbToGain(-3));
  return signal;
}

/**
 * Pitch and tempo factors of the disconnection effect at progress `u` (0-1),
 * from the measured end points (ref-docs/09 section 6.4): semitones
 * -12.5 u^1.8 and tempo 1 - 0.75 u^1.2. The two curves differ on purpose; a
 * single tape slow-down would move both together.
 */
export function halShutdownFactors(u: number): { semitones: number; pitch: number; tempo: number } {
  const p = Math.max(0, Math.min(1, u));
  const semitones = p === 0 ? 0 : -12.5 * p ** 1.8;
  return { semitones, pitch: p === 0 ? 1 : 2 ** (semitones / 12), tempo: 1 - 0.75 * p ** 1.2 };
}

/**
 * Applies the disconnection effect at a fixed progress `u` to one utterance:
 * WSOLA by tempo/pitch (pitch kept), then resampling by pitch. Net effect:
 * pitch multiplied by `pitch`, duration divided by `tempo`. Not yet wired to
 * the UI; the variance compression and final fade from the doc are left to
 * the caller.
 */
export function halShutdown(input: Float32Array, sampleRate: number, u: number): Float32Array {
  const { pitch, tempo } = halShutdownFactors(u);
  if (pitch === 1 && tempo === 1) return Float32Array.from(input);
  return resampleBy(timeStretch(input, sampleRate, tempo / pitch), pitch);
}
