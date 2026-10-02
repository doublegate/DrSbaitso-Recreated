/**
 * Vintage audio processing for Dr. Sbaitso Recreated.
 *
 * Models the signal path of the original voice, measured from First Byte's
 * SmoothTalker 3.5 engine (ref-docs/02-voice-and-audio.md):
 *
 * - The engine renders 8-bit unsigned mono PCM at 8475 Hz (DSP time constant
 *   138), using about 150-180 of the 256 codes (peak about -2 dBFS, RMS about
 *   -17.5 dBFS). Nothing exists above the 4237 Hz Nyquist limit.
 * - Its default "Bass" tone is dark: content well below 300 Hz, and a steep
 *   roll-off above 1 kHz.
 * - Its pitch is held flat per syllable and follows fixed end-of-sentence rules
 *   (see lpcMonotone.ts).
 * - The Sound Blaster DAC holds each sample until the next (zero-order hold),
 *   followed by an analog low-pass: about 4 kHz on the SB 1.x, about 3.2 kHz on
 *   the SB Pro. The images that filter lets through are the "metallic" edge.
 *
 * Authentic and Ultra apply, in order: a gentle level compressor, an
 * anti-alias low-pass and resample to 8475 Hz, LPC pitch flattening, a -8 dB
 * high shelf from 1.2 kHz, normalisation, unsigned 8-bit quantisation,
 * sample-and-hold back to the playback rate, and the analog band (80 Hz
 * high-pass, 3.8 or 3.2 kHz 2nd-order low-pass). The pitch stage runs at the
 * engine rate rather than before resampling; the result is the same and it is
 * about three times cheaper. Subtle is a light, non-authentic filter; Modern
 * is untouched.
 *
 * Every stage is a pure function on Float32Array data, so the chain is
 * deterministic and testable without an AudioContext.
 *
 * @module vintageAudioProcessing
 * @see ref-docs/02-voice-and-audio.md section 7
 */

import { applyBiquad, applyCascade, BUTTERWORTH_8_Q, designBiquad } from './biquad';
import { lpcMonotone, type EndPunctuation } from './lpcMonotone';

export type { EndPunctuation } from './lpcMonotone';

/**
 * Audio processing authenticity levels.
 */
export enum AuthenticityLevel {
  /** The TTS output as delivered (24 kHz, 16-bit, natural prosody). */
  Modern = 'modern',

  /** Light filtering and compression; a retro feel, not period-accurate. */
  SubtleVintage = 'subtle',

  /** The measured original chain: 8475 Hz, unsigned 8-bit, flattened pitch (default). */
  Authentic = 'authentic',

  /** As Authentic, through the darker SB Pro 3.2 kHz output filter. */
  UltraAuthentic = 'ultra'
}

/**
 * Configuration for the vintage processing pipeline.
 */
export interface VintageProcessingConfig {
  level: AuthenticityLevel;

  /** Engine sample rate (Hz). 8475 for the original; content is resampled to it and held back up. */
  targetSampleRate: number;

  /** Quantisation levels at the engine rate (256 = unsigned 8-bit; 65536 = none). */
  quantizationLevels: number;

  /** Analog-stage high-pass cutoff (Hz); 0 disables it. */
  lowCutoff: number;

  /** Analog-stage 2nd-order low-pass cutoff (Hz). */
  highCutoff: number;

  /** High-shelf gain (dB) that tilts the spectrum towards the original's dark timbre; 0 disables it. */
  highShelfGainDb: number;

  /** High-shelf corner frequency (Hz). */
  highShelfFrequency: number;

  /** Target peak (full scale = 1) before quantising; 0 disables normalisation. */
  normalizePeak: number;

  /** Target RMS (full scale = 1) before quantising; 0 disables normalisation. */
  normalizeRms: number;

  /** Reconstruct with sample-and-hold, like the DAC, instead of linear interpolation. */
  sampleAndHold: boolean;

  /** Level compression (0 = none, 1 = flat). The original is fairly level. */
  volumeVarianceReduction: number;

  /** Replace the TTS intonation with the original's stepped contour (LPC resynthesis). */
  pitchFlattening: boolean;
}

/** About -17 dBFS. */
const ORIGINAL_RMS = 0.141;
/** About -2.5 dBFS. */
const ORIGINAL_PEAK = 0.75;

/**
 * Preset configurations for each authenticity level.
 */
export const AUTHENTICITY_PRESETS: Record<AuthenticityLevel, VintageProcessingConfig> = {
  [AuthenticityLevel.Modern]: {
    level: AuthenticityLevel.Modern,
    targetSampleRate: 24000,
    quantizationLevels: 65536,
    lowCutoff: 0,
    highCutoff: 20000,
    highShelfGainDb: 0,
    highShelfFrequency: 1200,
    normalizePeak: 0,
    normalizeRms: 0,
    sampleAndHold: false,
    volumeVarianceReduction: 0,
    pitchFlattening: false
  },

  [AuthenticityLevel.SubtleVintage]: {
    level: AuthenticityLevel.SubtleVintage,
    targetSampleRate: 22050,
    quantizationLevels: 65536,
    lowCutoff: 200,
    highCutoff: 8000,
    highShelfGainDb: 0,
    highShelfFrequency: 1200,
    normalizePeak: 0,
    normalizeRms: 0,
    sampleAndHold: false,
    volumeVarianceReduction: 0.1,
    pitchFlattening: false
  },

  [AuthenticityLevel.Authentic]: {
    level: AuthenticityLevel.Authentic,
    targetSampleRate: 8475,
    quantizationLevels: 256,
    lowCutoff: 80,
    highCutoff: 3800,
    highShelfGainDb: -8,
    highShelfFrequency: 1200,
    normalizePeak: ORIGINAL_PEAK,
    normalizeRms: ORIGINAL_RMS,
    sampleAndHold: true,
    volumeVarianceReduction: 0.3,
    pitchFlattening: true
  },

  [AuthenticityLevel.UltraAuthentic]: {
    level: AuthenticityLevel.UltraAuthentic,
    targetSampleRate: 8475,
    quantizationLevels: 256,
    lowCutoff: 80,
    highCutoff: 3200,
    highShelfGainDb: -8,
    highShelfFrequency: 1200,
    normalizePeak: ORIGINAL_PEAK,
    normalizeRms: ORIGINAL_RMS,
    sampleAndHold: true,
    volumeVarianceReduction: 0.5,
    pitchFlattening: true
  }
};

/** 8th-order Butterworth low-pass (four cascaded biquads): the resampler's anti-alias filter. */
export function antiAliasLowPass(x: Float32Array, frequency: number, sampleRate: number): Float32Array {
  return applyCascade(x, 'lowpass', frequency, sampleRate, BUTTERWORTH_8_Q);
}

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------

/**
 * Gentle level compressor: each sample's gain pulls its 50 ms local RMS
 * towards the overall speech RMS by `amount` (in the log domain). Near-silent
 * passages are left alone rather than boosted.
 */
function compressLevel(x: Float32Array, sampleRate: number, amount: number): Float32Array {
  const n = x.length;
  const half = Math.max(1, Math.round(sampleRate * 0.025));
  const squares = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) squares[i + 1] = squares[i] + x[i] * x[i];
  const overall = Math.sqrt(squares[n] / n);
  const out = new Float32Array(n);
  if (!(overall > 0)) return out;
  const floor = overall * 0.05;
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(n, i + half);
    const local = Math.sqrt((squares[hi] - squares[lo]) / (hi - lo));
    const gain = local > floor ? (overall / local) ** amount : 1;
    out[i] = x[i] * gain;
  }
  return out;
}

/** Linear-interpolation resampler to `length` samples. */
export function resampleLinear(x: Float32Array, fromRate: number, toRate: number, length: number): Float32Array {
  const out = new Float32Array(length);
  const ratio = fromRate / toRate;
  const last = x.length - 1;
  for (let j = 0; j < length; j++) {
    const position = j * ratio;
    const i = Math.floor(position);
    if (i >= last) {
      out[j] = x[last] ?? 0;
    } else {
      const frac = position - i;
      out[j] = x[i] + (x[i + 1] - x[i]) * frac;
    }
  }
  return out;
}

/**
 * Zero-order hold: repeats each engine sample for as long as the DAC would,
 * producing `length` samples at `toRate`. No interpolation, so the spectral
 * images of the 8475 Hz signal remain, as on the real card.
 */
export function sampleAndHold(engine: Float32Array, engineRate: number, toRate: number, length: number): Float32Array {
  const out = new Float32Array(length);
  if (engine.length === 0) return out;
  const last = engine.length - 1;
  for (let i = 0; i < length; i++) {
    out[i] = engine[Math.min(last, Math.floor((i * engineRate) / toRate + 1e-9))];
  }
  return out;
}

/**
 * Quantises a sample like unsigned PCM centred on the middle code. For 256
 * levels this is 8-bit unsigned: code = clamp(round(x * 128) + 128, 0, 255).
 */
export function quantizeSample(x: number, levels: number): number {
  const half = levels / 2;
  return Math.max(-half, Math.min(half - 1, Math.round(x * half))) / half;
}

function normalise(x: Float32Array, targetPeak: number, targetRms: number): void {
  let peak = 0;
  let sum = 0;
  for (const v of x) {
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  const rms = Math.sqrt(sum / Math.max(1, x.length));
  if (!(peak > 0) || !(rms > 0)) return;
  let gain = Infinity;
  if (targetRms > 0) gain = Math.min(gain, targetRms / rms);
  if (targetPeak > 0) gain = Math.min(gain, targetPeak / peak);
  if (!Number.isFinite(gain)) return;
  for (let i = 0; i < x.length; i++) x[i] *= gain;
}

/**
 * Runs the vintage chain over one channel of samples. Returns a new array of
 * the same length at the same sample rate; Modern returns an unchanged copy.
 */
export function processVintageSamples(
  input: Float32Array,
  sampleRate: number,
  config: VintageProcessingConfig,
  endPunctuation: EndPunctuation = null
): Float32Array {
  const length = input.length;
  if (config.level === AuthenticityLevel.Modern || length === 0) return Float32Array.from(input);

  let signal = config.volumeVarianceReduction > 0
    ? compressLevel(input, sampleRate, config.volumeVarianceReduction)
    : Float32Array.from(input);

  // Into the engine's sample rate.
  const engineRate = Math.min(config.targetSampleRate, sampleRate);
  let engine = signal;
  if (engineRate < sampleRate) {
    const antiAlias = antiAliasLowPass(signal, 0.45 * engineRate, sampleRate);
    engine = resampleLinear(antiAlias, sampleRate, engineRate, Math.max(1, Math.round((length * engineRate) / sampleRate)));
  }

  if (config.pitchFlattening) {
    engine = lpcMonotone(engine, { sampleRate: engineRate, endPunctuation });
  }

  if (config.highShelfGainDb !== 0) {
    engine = applyBiquad(engine, designBiquad('highshelf', config.highShelfFrequency, engineRate, Math.SQRT1_2, config.highShelfGainDb));
  }

  if (config.normalizePeak > 0 || config.normalizeRms > 0) normalise(engine, config.normalizePeak, config.normalizeRms);

  if (config.quantizationLevels < 65536) {
    for (let i = 0; i < engine.length; i++) engine[i] = quantizeSample(engine[i], config.quantizationLevels);
  }

  // Back to the playback rate, through the DAC and the card's analog stage.
  if (engineRate < sampleRate) {
    signal = config.sampleAndHold
      ? sampleAndHold(engine, engineRate, sampleRate, length)
      : resampleLinear(engine, engineRate, sampleRate, length);
  } else {
    signal = engine;
  }
  if (config.lowCutoff > 0) {
    signal = applyBiquad(signal, designBiquad('highpass', config.lowCutoff, sampleRate));
  }
  if (config.highCutoff < sampleRate / 2) {
    signal = applyBiquad(signal, designBiquad('lowpass', config.highCutoff, sampleRate));
  }
  return signal;
}

/**
 * Applies the vintage chain to every channel of an AudioBuffer.
 *
 * @param buffer - Decoded TTS audio
 * @param ctx - Context used to allocate the output buffer
 * @param config - Processing configuration (see AUTHENTICITY_PRESETS)
 * @param endPunctuation - How the utterance ends; drives the final pitch movement
 * @returns A new buffer at the input's rate and length (the input itself for Modern)
 */
export async function applyVintageProcessing(
  buffer: AudioBuffer,
  ctx: AudioContext,
  config: VintageProcessingConfig,
  endPunctuation: EndPunctuation = null
): Promise<AudioBuffer> {
  if (config.level === AuthenticityLevel.Modern) return buffer;

  const output = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const processed = processVintageSamples(buffer.getChannelData(channel), buffer.sampleRate, config, endPunctuation);
    output.getChannelData(channel).set(processed);
  }
  return output;
}

/**
 * Get preset configuration by authenticity level.
 */
export function getPresetConfig(level: AuthenticityLevel): VintageProcessingConfig {
  return { ...AUTHENTICITY_PRESETS[level] };
}

/**
 * User-facing description of an authenticity level.
 */
export function getAuthenticityDescription(level: AuthenticityLevel): string {
  switch (level) {
    case AuthenticityLevel.Modern:
      return 'Modern Quality (24 kHz, 16-bit, natural prosody)';
    case AuthenticityLevel.SubtleVintage:
      return 'Subtle Vintage (light retro filtering, not period-accurate)';
    case AuthenticityLevel.Authentic:
      return 'Authentic (8.5 kHz, 8-bit, flattened pitch, recommended)';
    case AuthenticityLevel.UltraAuthentic:
      return 'Ultra Authentic (8.5 kHz, 8-bit, darker SB Pro filter)';
  }
}

/**
 * Technical specification string for an authenticity level.
 */
export function getAuthenticitySpecs(level: AuthenticityLevel): string {
  const config = AUTHENTICITY_PRESETS[level];
  const bitDepth = Math.log2(config.quantizationLevels);

  return `${(config.targetSampleRate / 1000).toFixed(1)} kHz, ${bitDepth}-bit, ` +
         `${config.lowCutoff}-${config.highCutoff} Hz`;
}
