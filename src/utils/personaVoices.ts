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
 * - WOPR (section 6.3): the actor read each word in isolation (in reverse
 *   order) and the takes were spliced; so each word is cut out, re-pitched
 *   flat with LPC, given even loudness and fixed gaps, and band-limited.
 *
 * Everything is a pure, deterministic function on Float32Array data.
 *
 * @module personaVoices
 */
import { applyBiquad, applyCascade, BUTTERWORTH_4_Q, designBiquad } from './biquad';
import { endPunctuationOf, lpcResynthesize, type EndPunctuation } from './lpcMonotone';
import { timeStretch, resampleBy } from './timeStretch';
import { antiAliasLowPass, resampleLinear } from './vintageAudioProcessing';

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
      if (i > from && x[i] >= 0 !== x[i - 1] >= 0) crossings++;
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

// ---------------------------------------------------------------- WOPR

/** Pitch levels in Hz (ref-docs/09 sections 3.2 and 6.3). */
export const WOPR_LEVELS = {
  /** Plateau, and the two step-down levels between words. */
  body: [90, 79, 68] as const,
  question: 128,
  /** Sag at the very end of a question, over the last 60 ms. */
  questionSag: 122,
  statement: 79,
  exclamation: 105,
  level: 90,
} as const;

/** Rate the WOPR chain works at: everything it keeps is below 4 kHz. */
export const WOPR_RATE = 16000;
const WOPR_LPC_ORDER = 18;
const WOPR_SEED = 0x3f0b;
const GAP_SECONDS = { word: 0.08, comma: 0.11, sentence: 0.25 } as const;

/** FNV-1a hash of a string, for deterministic per-word choices. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function finalLevel(end: EndPunctuation): number {
  switch (end) {
    case '?':
      return WOPR_LEVELS.question;
    case '.':
      return WOPR_LEVELS.statement;
    case '!':
      return WOPR_LEVELS.exclamation;
    default:
      return WOPR_LEVELS.level;
  }
}

/**
 * One flat pitch per word. Non-final words sit at 90 Hz; every 3rd to 5th
 * steps down to 79 or 68 Hz, chosen from a hash of the seed and the word, so
 * the same line always sounds the same. The final word follows the end
 * punctuation: "?" 128, "." 79, "!" 105, none 90 Hz.
 */
export function planWoprLevels(count: number, end: EndPunctuation, seed: number, words?: readonly string[]): number[] {
  const levels: number[] = [];
  if (count <= 0) return levels;
  const key = (i: number) => `${seed}:${i}:${words?.[i]?.toUpperCase().replace(/[^A-Z0-9']/g, '') ?? ''}`;
  let interval = 3 + (hash(`${seed}:start`) % 3);
  let since = 0;
  for (let i = 0; i < count - 1; i++) {
    since++;
    if (since === interval) {
      const h = hash(key(i));
      levels.push(h & 4 ? WOPR_LEVELS.body[1] : WOPR_LEVELS.body[2]);
      since = 0;
      interval = 3 + ((h >>> 3) % 3);
    } else {
      levels.push(WOPR_LEVELS.body[0]);
    }
  }
  levels.push(finalLevel(end));
  return levels;
}

export interface WordSegment {
  /** First sample of the word. */
  start: number;
  /** One past the last sample. */
  end: number;
}

/**
 * Splits speech into words at energy dips (ref-docs/09 6.3 stage 1): 10 ms
 * frames; a dip is at least 12 dB below the loudest frame within 250 ms on
 * both sides (or below the speech floor, 35 dB under the peak) and lasts at
 * least 30 ms. With `expectedWords`, only the deepest dips are used; with no
 * dip at all the speech is divided evenly. Words shorter than 60 ms merge
 * into a neighbour, and each word is trimmed of its silent edges.
 */
export function segmentWords(x: Float32Array, sampleRate: number, expectedWords?: number): WordSegment[] {
  const frame = Math.max(1, Math.round(0.01 * sampleRate));
  const { db } = frameStats(x, frame);
  const count = db.length;
  let peak = -Infinity;
  for (const v of db) peak = Math.max(peak, v);
  if (!Number.isFinite(peak)) return [];
  const floor = peak - 35;
  const level = Float64Array.from(db, (v) => Math.max(v, peak - 100));
  const speech = Array.from(level, (v) => v > floor);
  const first = speech.indexOf(true);
  const last = speech.lastIndexOf(true);

  const reach = 25;
  const depth = new Float64Array(count);
  for (let f = 0; f < count; f++) {
    let left = -Infinity;
    let right = -Infinity;
    for (let k = Math.max(0, f - reach); k < f; k++) left = Math.max(left, level[k]);
    for (let k = f + 1; k <= Math.min(count - 1, f + reach); k++) right = Math.max(right, level[k]);
    depth[f] = Math.min(left, right) - level[f];
  }

  const gaps: { from: number; to: number; score: number }[] = [];
  for (let f = first; f <= last;) {
    if (speech[f] && depth[f] < 12) {
      f++;
      continue;
    }
    const from = f;
    let score = 0;
    while (f <= last && (!speech[f] || depth[f] >= 12)) score += Math.max(0, depth[f++]);
    if (f - from >= 3 && from > first && f <= last) gaps.push({ from, to: f, score });
  }

  // Keep the deepest dips, in time order: drop the shallowest until they fit.
  const kept = [...gaps];
  if (expectedWords !== undefined && expectedWords >= 1) {
    while (kept.length > expectedWords - 1) {
      let weakest = 0;
      for (let i = 1; i < kept.length; i++) if (kept[i].score < kept[weakest].score) weakest = i;
      kept.splice(weakest, 1);
    }
  }

  let spans: [number, number][] = [];
  if (kept.length === 0 && expectedWords !== undefined && expectedWords > 1) {
    const span = last - first + 1;
    for (let w = 0; w < expectedWords; w++) {
      spans.push([
        first + Math.floor((w * span) / expectedWords),
        first + Math.floor(((w + 1) * span) / expectedWords),
      ]);
    }
  } else {
    let from = first;
    for (const gap of kept) {
      spans.push([from, gap.from]);
      from = gap.to;
    }
    spans.push([from, last + 1]);
  }

  // Trim silent edges, then merge words shorter than 60 ms into a neighbour.
  spans = spans
    .map(([a, b]): [number, number] => {
      while (a < b && !speech[a]) a++;
      while (b > a && !speech[b - 1]) b--;
      return [a, b];
    })
    .filter(([a, b]) => b > a);
  const merged: [number, number][] = [];
  for (const span of spans) {
    if (span[1] - span[0] < 6 && merged.length > 0) merged[merged.length - 1][1] = span[1];
    else merged.push([span[0], span[1]]);
  }
  if (merged.length > 1 && merged[0][1] - merged[0][0] < 6) {
    merged[1][0] = merged[0][0];
    merged.shift();
  }
  return merged.map(([a, b]) => ({ start: a * frame, end: Math.min(x.length, b * frame) }));
}

/**
 * The WOPR band (ref-docs/09 6.3 stage 7): 4th-order high-pass at 220 Hz,
 * 4th-order low-pass at 3.8 kHz, and +2 dB at 2.5 kHz to keep consonants
 * crisp. Matches the measured -20 dB at 100-200 Hz and -25 dB at 3.5-4 kHz.
 */
export function woprBandLimit(x: Float32Array, sampleRate: number): Float32Array {
  let y = applyCascade(x, 'highpass', 220, sampleRate, BUTTERWORTH_4_Q);
  y = applyCascade(y, 'lowpass', 3800, sampleRate, BUTTERWORTH_4_Q);
  return applyBiquad(y, designBiquad('peaking', 2500, sampleRate, 1, 2));
}

interface TextWord {
  word: string;
  /** Pause after this word, in seconds. */
  gap: number;
}

function wordsOf(text: string): TextWord[] {
  return text
    .split(/\s+/)
    .filter((token) => /[A-Za-z0-9]/.test(token))
    .map((token) => {
      const trailing = /[^A-Za-z0-9']*$/.exec(token)?.[0] ?? '';
      const gap = /[.?!]/.test(trailing)
        ? GAP_SECONDS.sentence
        : /[,;:]/.test(trailing)
          ? GAP_SECONDS.comma
          : GAP_SECONDS.word;
      return { word: token, gap };
    });
}

const rmsOf = (x: Float32Array) => Math.sqrt(x.reduce((sum, v) => sum + v * v, 0) / Math.max(1, x.length));

export interface WoprVoiceOptions {
  /** What the audio says: word count, punctuation pauses and the final pitch. */
  text?: string;
  /** Seed for the step-down pattern (default fixed). */
  seed?: number;
}

/**
 * JOSHUA/WOPR chain (ref-docs/09 section 6.3), at 16 kHz internally:
 * 1. split into words at energy dips (segmentWords);
 * 2. LPC-resynthesise each word at one flat pitch (planWoprLevels), voiced
 *    frames 85% pulse and 15% residual, unvoiced frames on their own residual
 *    so fricatives stay human;
 * 3. band-limit each word (woprBandLimit), equalise word RMS, 5 ms
 *    raised-cosine fades for the spliced-tape edges;
 * 4. join with 80 ms gaps (110 ms after commas, 250 ms after sentence ends,
 *    when the text's words match the words found);
 * 5. back to the input rate, peak at -3 dBFS.
 * The output is usually shorter or longer than the input.
 */
export function processWoprVoice(
  input: Float32Array,
  sampleRate: number,
  options: WoprVoiceOptions = {},
): Float32Array {
  const { text, seed = WOPR_SEED } = options;
  const rate = Math.min(WOPR_RATE, sampleRate);
  const work =
    rate < sampleRate
      ? resampleLinear(
          antiAliasLowPass(input, 0.45 * rate, sampleRate),
          sampleRate,
          rate,
          Math.max(1, Math.round((input.length * rate) / sampleRate)),
        )
      : Float32Array.from(input);

  const textWords = text === undefined ? [] : wordsOf(text);
  const segments = segmentWords(work, rate, textWords.length > 0 ? textWords.length : undefined);
  if (segments.length === 0) return new Float32Array(input.length);
  const matched = textWords.length === segments.length;
  const end = text === undefined ? null : endPunctuationOf(text);
  const levels = planWoprLevels(segments.length, end, seed, matched ? textWords.map((w) => w.word) : undefined);

  const sagSamples = Math.round(0.06 * rate);
  const resynth = lpcResynthesize(work, {
    sampleRate: rate,
    order: WOPR_LPC_ORDER,
    seed,
    unvoiced: 'residual',
    residualMix: 0.15,
    contour: (frames, frameRate) => {
      const contour = new Float64Array(frames.length);
      let w = 0;
      for (let f = 0; f < frames.length; f++) {
        if (!frames[f].voiced) continue;
        const sample = (f / frameRate) * rate;
        while (w < segments.length - 1 && sample >= segments[w].end) w++;
        const { start, end: stop } = segments[w];
        if (sample < start || sample >= stop) continue;
        let hz = levels[w];
        if (end === '?' && w === segments.length - 1 && sample > stop - sagSamples) {
          hz += (WOPR_LEVELS.questionSag - WOPR_LEVELS.question) * ((sample - (stop - sagSamples)) / sagSamples);
        }
        contour[f] = hz;
      }
      return contour;
    },
  });

  const fade = Math.max(1, Math.round(0.005 * rate));
  const words = segments.map(({ start, end: stop }) => woprBandLimit(resynth.slice(start, stop), rate));
  const wordRms = words.map(rmsOf);
  const audible = wordRms.filter((v) => v > 0);
  const target = audible.length ? audible.reduce((a, b) => a + b, 0) / audible.length : 0;
  const gapSamples = segments.map((_, i) =>
    i < segments.length - 1 ? Math.round((matched ? textWords[i].gap : GAP_SECONDS.word) * rate) : 0,
  );

  const total = words.reduce((n, word, i) => n + word.length + gapSamples[i], 0);
  const joined = new Float32Array(total);
  let offset = 0;
  words.forEach((word, i) => {
    const gain = wordRms[i] > 0 ? target / wordRms[i] : 0;
    const n = word.length;
    for (let k = 0; k < n; k++) {
      const edge = Math.min(k, n - 1 - k);
      const ramp = edge < fade ? 0.5 - 0.5 * Math.cos((Math.PI * edge) / fade) : 1;
      joined[offset + k] = word[k] * gain * ramp;
    }
    offset += n + gapSamples[i];
  });

  const out =
    rate < sampleRate
      ? resampleLinear(joined, rate, sampleRate, Math.round((joined.length * sampleRate) / rate))
      : joined;
  normalise(out, 0, dbToGain(-3));
  return out;
}
