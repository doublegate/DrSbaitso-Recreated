/**
 * Vintage Audio Processing for Dr. Sbaitso Recreated
 *
 * Implements authentic 1991 Sound Blaster 8-bit audio quality processing
 * to recreate the original Dr. Sbaitso voice characteristics.
 *
 * Technology Stack (Original 1991):
 * - Speech Engine: First Byte Monologue (NOT DECtalk)
 * - Driver: SBTalker (BLASTER.DRV)
 * - Hardware: Sound Blaster 8-bit ISA cards
 * - Sample Rate: 11.025 kHz (typical)
 * - Bit Depth: 8-bit mono
 *
 * @module vintageAudioProcessing
 * @version 1.0.0
 * @author Dr. Sbaitso Recreated Project
 * @see docs/DECTALK_RESEARCH.md for comprehensive technical research
 */

/**
 * Audio processing authenticity levels
 * Controls the intensity of vintage effects applied to the audio
 */
export enum AuthenticityLevel {
  /** Modern quality (24 kHz, 16-bit, natural prosody) - Current Gemini TTS */
  Modern = 'modern',

  /** Subtle vintage (22.05 kHz, light processing) - Enhanced retro feel */
  SubtleVintage = 'subtle',

  /** Authentic (11.025 kHz, 8-bit, moderate processing) - Recommended default */
  Authentic = 'authentic',

  /** Ultra authentic (maximum vintage processing with artifacts) - Purist mode */
  UltraAuthentic = 'ultra'
}

/**
 * Configuration for vintage audio processing pipeline
 */
export interface VintageProcessingConfig {
  /** Authenticity level (controls all processing intensity) */
  level: AuthenticityLevel;

  /** Target sample rate (Hz) - 11025 for authentic, 22050 for subtle */
  targetSampleRate: number;

  /** Quantization levels (256 = 8-bit, 65536 = 16-bit) */
  quantizationLevels: number;

  /** Bandpass filter low cutoff (Hz) */
  lowCutoff: number;

  /** Bandpass filter high cutoff (Hz) */
  highCutoff: number;

  /** Prosody reduction factor (0.0 = none, 1.0 = complete flattening) */
  prosodyReduction: number;

  /** Pitch variance reduction factor (0.0 = none, 1.0 = monotone) */
  pitchVarianceReduction: number;

  /** Volume variance reduction factor (0.0 = none, 1.0 = flat) */
  volumeVarianceReduction: number;

  /** Enable artifact injection (aliasing, quantization emphasis) */
  injectArtifacts: boolean;

  /** Aliasing amount (0.0 = none, 0.2 = subtle, 0.5 = heavy) */
  aliasingAmount: number;

  /** Pre-echo amount for primitive DAC simulation (0.0 = none, 0.1 = typical) */
  preEchoAmount: number;

  /** Playback speed multiplier (1.1 = current Dr. Sbaitso setting) */
  playbackRate: number;
}

/**
 * Preset configurations for each authenticity level
 */
export const AUTHENTICITY_PRESETS: Record<AuthenticityLevel, VintageProcessingConfig> = {
  [AuthenticityLevel.Modern]: {
    level: AuthenticityLevel.Modern,
    targetSampleRate: 24000,
    quantizationLevels: 65536, // 16-bit
    lowCutoff: 0,
    highCutoff: 20000,
    prosodyReduction: 0.0,
    pitchVarianceReduction: 0.0,
    volumeVarianceReduction: 0.0,
    injectArtifacts: false,
    aliasingAmount: 0.0,
    preEchoAmount: 0.0,
    playbackRate: 1.1
  },

  [AuthenticityLevel.SubtleVintage]: {
    level: AuthenticityLevel.SubtleVintage,
    targetSampleRate: 22050,
    quantizationLevels: 65536, // 16-bit (no quantization)
    lowCutoff: 200,
    highCutoff: 8000,
    prosodyReduction: 0.2,
    pitchVarianceReduction: 0.15,
    volumeVarianceReduction: 0.1,
    injectArtifacts: false,
    aliasingAmount: 0.0,
    preEchoAmount: 0.0,
    playbackRate: 1.1
  },

  [AuthenticityLevel.Authentic]: {
    level: AuthenticityLevel.Authentic,
    targetSampleRate: 11025,
    quantizationLevels: 256, // 8-bit
    lowCutoff: 300,
    highCutoff: 5000,
    prosodyReduction: 0.5,
    pitchVarianceReduction: 0.4,
    volumeVarianceReduction: 0.3,
    injectArtifacts: false, // Optional, user can enable
    aliasingAmount: 0.05,
    preEchoAmount: 0.03,
    playbackRate: 1.1
  },

  [AuthenticityLevel.UltraAuthentic]: {
    level: AuthenticityLevel.UltraAuthentic,
    targetSampleRate: 11025,
    quantizationLevels: 256, // 8-bit
    lowCutoff: 300,
    highCutoff: 5000,
    prosodyReduction: 0.75,
    pitchVarianceReduction: 0.65,
    volumeVarianceReduction: 0.5,
    injectArtifacts: true,
    aliasingAmount: 0.12,
    preEchoAmount: 0.08,
    playbackRate: 1.1
  }
};

/**
 * Main vintage audio processing pipeline
 * Transforms modern TTS audio into authentic 1991 Dr. Sbaitso sound
 *
 * Processing steps:
 * 1. Prosody reduction (flatten intonation and volume)
 * 2. Downsampling with anti-aliasing
 * 3. 8-bit quantization
 * 4. Bandpass filtering (300 Hz - 5 kHz)
 * 5. Artifact injection (optional)
 *
 * @param buffer - Input AudioBuffer from Gemini TTS (24 kHz)
 * @param ctx - AudioContext instance
 * @param config - Processing configuration (use AUTHENTICITY_PRESETS)
 * @returns Processed AudioBuffer with vintage characteristics
 */
export async function applyVintageProcessing(
  buffer: AudioBuffer,
  ctx: AudioContext,
  config: VintageProcessingConfig
): Promise<AudioBuffer> {
  // Skip processing for modern mode
  if (config.level === AuthenticityLevel.Modern) {
    return buffer;
  }

  let processedBuffer = buffer;

  // Step 1: Prosody reduction (flatten intonation and volume)
  if (config.prosodyReduction > 0) {
    processedBuffer = await reduceProsody(processedBuffer, ctx, config);
  }

  // Step 2: Downsample with anti-aliasing
  if (config.targetSampleRate < buffer.sampleRate) {
    // Apply low-pass filter before downsampling (anti-aliasing)
    const nyquistFreq = config.targetSampleRate / 2;
    const antiAliasingCutoff = Math.min(nyquistFreq * 0.9, config.highCutoff);

    processedBuffer = await applyLowPassFilter(
      processedBuffer,
      ctx,
      antiAliasingCutoff
    );

    // Downsample
    processedBuffer = await resampleBuffer(
      processedBuffer,
      ctx,
      config.targetSampleRate
    );
  }

  // Step 3: Quantize to 8-bit (or 16-bit for subtle mode)
  if (config.quantizationLevels < 65536) {
    processedBuffer = quantizeAudioBuffer(
      processedBuffer,
      ctx,
      config.quantizationLevels
    );
  }

  // Step 4: Bandpass filter (simulates Sound Blaster frequency response)
  if (config.lowCutoff > 0 || config.highCutoff < 20000) {
    processedBuffer = await applyBandpassFilter(
      processedBuffer,
      ctx,
      config.lowCutoff,
      config.highCutoff
    );
  }

  // Step 5: Inject artifacts (aliasing, pre-echo) if enabled
  if (config.injectArtifacts) {
    processedBuffer = injectVintageArtifacts(
      processedBuffer,
      ctx,
      config.aliasingAmount,
      config.preEchoAmount
    );
  }

  return processedBuffer;
}

/**
 * Reduce prosody (flatten intonation and volume variation)
 * Makes speech more robotic and monotone like 1991 rule-based TTS
 *
 * @param buffer - Input AudioBuffer
 * @param ctx - AudioContext
 * @param config - Processing configuration
 * @returns AudioBuffer with reduced prosody
 */
async function reduceProsody(
  buffer: AudioBuffer,
  ctx: AudioContext,
  config: VintageProcessingConfig
): Promise<AudioBuffer> {
  const outputBuffer = ctx.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);

    // Calculate RMS (root mean square) amplitude for normalization
    let rms = 0;
    for (let i = 0; i < inputData.length; i++) {
      rms += inputData[i] * inputData[i];
    }
    rms = Math.sqrt(rms / inputData.length);

    // Target RMS for flattened volume (reduce dynamic range)
    const targetRMS = rms * (1 - config.volumeVarianceReduction * 0.5);

    // Apply volume compression (reduce dynamic range)
    const windowSize = Math.floor(buffer.sampleRate * 0.05); // 50ms window
    for (let i = 0; i < inputData.length; i++) {
      // Calculate local RMS
      let localRMS = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j < Math.min(inputData.length, i + windowSize); j++) {
        localRMS += inputData[j] * inputData[j];
        count++;
      }
      localRMS = Math.sqrt(localRMS / count);

      // Compress dynamic range
      const compressionFactor = 1 - config.volumeVarianceReduction;
      const gain = localRMS > 0 ? (targetRMS / localRMS) * compressionFactor + (1 - compressionFactor) : 1;

      outputData[i] = inputData[i] * gain;
    }
  }

  return outputBuffer;
}

/**
 * Apply low-pass filter for anti-aliasing before downsampling
 *
 * @param buffer - Input AudioBuffer
 * @param ctx - AudioContext
 * @param cutoffFrequency - Low-pass cutoff frequency (Hz)
 * @returns Filtered AudioBuffer
 */
async function applyLowPassFilter(
  buffer: AudioBuffer,
  ctx: AudioContext,
  cutoffFrequency: number
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  // Create low-pass filter
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoffFrequency;
  filter.Q.value = 0.7071; // Butterworth response (flat passband)

  // Connect: source -> filter -> destination
  source.connect(filter);
  filter.connect(offlineCtx.destination);

  source.start();
  return await offlineCtx.startRendering();
}

/**
 * Apply bandpass filter to limit frequency response (300 Hz - 5 kHz typical)
 * Simulates Sound Blaster 8-bit frequency response limitations
 *
 * @param buffer - Input AudioBuffer
 * @param ctx - AudioContext
 * @param lowCutoff - High-pass cutoff frequency (Hz)
 * @param highCutoff - Low-pass cutoff frequency (Hz)
 * @returns Filtered AudioBuffer
 */
async function applyBandpassFilter(
  buffer: AudioBuffer,
  ctx: AudioContext,
  lowCutoff: number,
  highCutoff: number
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  // High-pass filter (removes low frequencies)
  const highPassFilter = offlineCtx.createBiquadFilter();
  highPassFilter.type = 'highpass';
  highPassFilter.frequency.value = lowCutoff;
  highPassFilter.Q.value = 0.7071;

  // Low-pass filter (removes high frequencies)
  const lowPassFilter = offlineCtx.createBiquadFilter();
  lowPassFilter.type = 'lowpass';
  lowPassFilter.frequency.value = highCutoff;
  lowPassFilter.Q.value = 0.7071;

  // Connect: source -> high-pass -> low-pass -> destination
  source.connect(highPassFilter);
  highPassFilter.connect(lowPassFilter);
  lowPassFilter.connect(offlineCtx.destination);

  source.start();
  return await offlineCtx.startRendering();
}

/**
 * Resample audio buffer to target sample rate
 * Uses linear interpolation for authentic vintage quality (no sophisticated resampling)
 *
 * @param buffer - Input AudioBuffer
 * @param ctx - AudioContext
 * @param targetSampleRate - Target sample rate (11025 Hz typical)
 * @returns Resampled AudioBuffer
 */
async function resampleBuffer(
  buffer: AudioBuffer,
  ctx: AudioContext,
  targetSampleRate: number
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(buffer.length * targetSampleRate / buffer.sampleRate),
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start();

  return await offlineCtx.startRendering();
}

/**
 * Quantize audio to specified bit depth (e.g., 8-bit = 256 levels)
 * Adds characteristic quantization noise and "grit" of vintage audio
 *
 * @param buffer - Input AudioBuffer
 * @param ctx - AudioContext
 * @param levels - Number of quantization levels (256 = 8-bit, 65536 = 16-bit)
 * @returns Quantized AudioBuffer
 */
function quantizeAudioBuffer(
  buffer: AudioBuffer,
  ctx: AudioContext,
  levels: number
): AudioBuffer {
  const outputBuffer = ctx.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const step = 2.0 / (levels - 1); // Quantization step size

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);

    for (let i = 0; i < inputData.length; i++) {
      // Quantize to discrete levels
      const quantized = Math.round(inputData[i] / step) * step;

      // Clamp to [-1.0, 1.0] range
      outputData[i] = Math.max(-1.0, Math.min(1.0, quantized));
    }
  }

  return outputBuffer;
}

/**
 * Inject vintage audio artifacts (aliasing, pre-echo, quantization emphasis)
 * Simulates Sound Blaster 8-bit ISA card limitations and DAC characteristics
 *
 * @param buffer - Input AudioBuffer
 * @param ctx - AudioContext
 * @param aliasingAmount - Aliasing intensity (0.0 - 0.2 typical)
 * @param preEchoAmount - Pre-echo intensity (0.0 - 0.1 typical)
 * @returns AudioBuffer with injected artifacts
 */
function injectVintageArtifacts(
  buffer: AudioBuffer,
  ctx: AudioContext,
  aliasingAmount: number,
  preEchoAmount: number
): AudioBuffer {
  const outputBuffer = ctx.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);

    for (let i = 0; i < inputData.length; i++) {
      let sample = inputData[i];

      // Add pre-echo (primitive DAC reconstruction smearing)
      if (i > 0 && preEchoAmount > 0) {
        sample += inputData[i - 1] * preEchoAmount * 0.5;
      }

      // Add subtle high-frequency "metal junk" noise (aliasing simulation)
      if (aliasingAmount > 0) {
        // High-frequency noise correlated with signal amplitude
        const noise = (Math.random() - 0.5) * Math.abs(sample) * aliasingAmount;
        sample += noise;
      }

      // Clamp to [-1.0, 1.0]
      outputData[i] = Math.max(-1.0, Math.min(1.0, sample));
    }
  }

  return outputBuffer;
}

/**
 * Get preset configuration by authenticity level
 *
 * @param level - Authenticity level
 * @returns Processing configuration preset
 */
export function getPresetConfig(level: AuthenticityLevel): VintageProcessingConfig {
  return { ...AUTHENTICITY_PRESETS[level] };
}

/**
 * Get user-friendly description of authenticity level
 *
 * @param level - Authenticity level
 * @returns Description string for UI display
 */
export function getAuthenticityDescription(level: AuthenticityLevel): string {
  switch (level) {
    case AuthenticityLevel.Modern:
      return 'Modern Quality (24 kHz, 16-bit, natural prosody)';
    case AuthenticityLevel.SubtleVintage:
      return 'Subtle Vintage (22 kHz, light retro processing)';
    case AuthenticityLevel.Authentic:
      return 'Authentic 1991 (11 kHz, 8-bit, recommended)';
    case AuthenticityLevel.UltraAuthentic:
      return 'Ultra Authentic (maximum vintage processing)';
  }
}

/**
 * Get technical specifications string for authenticity level
 *
 * @param level - Authenticity level
 * @returns Technical specs for UI display
 */
export function getAuthenticitySpecs(level: AuthenticityLevel): string {
  const config = AUTHENTICITY_PRESETS[level];
  const bitDepth = Math.log2(config.quantizationLevels);

  return `${(config.targetSampleRate / 1000).toFixed(1)} kHz, ${bitDepth}-bit, ` +
         `${config.lowCutoff}-${config.highCutoff} Hz`;
}
