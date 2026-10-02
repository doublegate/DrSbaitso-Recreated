import {
  AuthenticityLevel,
  getPresetConfig,
  applyVintageProcessing,
  type EndPunctuation,
} from './vintageAudioProcessing';

import type { VoiceProcessing } from '../constants';
import { processPersonaSamples, resolveVoiceRoute, type AudioModeId } from './voiceRoutes';

// Re-export for convenience
export { AuthenticityLevel } from './vintageAudioProcessing';
export type { AudioModeId } from './voiceRoutes';

export interface DecodeOptions {
  /**
   * The persona's processing route (default 'sbaitso': the vintage chain
   * chosen by `audioMode`). See src/utils/voiceRoutes.ts.
   */
  processing?: VoiceProcessing;
  /** What the audio says; the WOPR and HAL chains use its words and punctuation. */
  text?: string;
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Returns the PCM payload of a RIFF/WAVE buffer, or the input unchanged when
 * it is already raw PCM. Gemini 3.x TTS returns WAV; the proxy strips the
 * header, so this is a defensive second line.
 */
function stripWavHeader(data: Uint8Array): Uint8Array {
  const tag = (o: number) => String.fromCharCode(data[o], data[o + 1], data[o + 2], data[o + 3]);
  if (data.byteLength < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return data;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 12;
  while (offset + 8 <= data.byteLength) {
    const size = view.getUint32(offset + 4, true);
    if (tag(offset) === 'data') {
      return data.subarray(offset + 8, Math.min(offset + 8 + size, data.byteLength));
    }
    offset += 8 + size + (size % 2);
  }
  return data.subarray(data.byteLength);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
  audioMode?: AudioModeId,
  endPunctuation: EndPunctuation = null,
  options: DecodeOptions = {},
): Promise<AudioBuffer> {
  const pcm = stripWavHeader(data);
  // DataView respects byteOffset and avoids Int16Array's even-length and
  // alignment requirements; a trailing odd byte is ignored.
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const sampleCount = Math.floor(pcm.byteLength / 2);
  const frameCount = Math.floor(sampleCount / numChannels);
  let buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = view.getInt16((i * numChannels + channel) * 2, true) / 32768.0;
    }
  }

  const route = resolveVoiceRoute(options.processing ?? 'sbaitso', audioMode);
  if (route === 'vintage' && audioMode) {
    const authenticityLevel = mapAudioModeToAuthenticityLevel(audioMode);
    const config = getPresetConfig(authenticityLevel);
    buffer = await applyVintageProcessing(buffer, ctx, config, endPunctuation);
  } else if (route === 'hal' || route === 'wopr') {
    // These chains change the length, so the output gets a new buffer.
    const channels: Float32Array[] = [];
    for (let channel = 0; channel < numChannels; channel++) {
      channels.push(processPersonaSamples(route, buffer.getChannelData(channel), sampleRate, options.text));
    }
    const length = Math.max(1, ...channels.map((c) => c.length));
    const output = ctx.createBuffer(numChannels, length, sampleRate);
    channels.forEach((samples, channel) => output.getChannelData(channel).set(samples));
    buffer = output;
  }

  return buffer;
}

/**
 * Playback settings applied after vintage processing. Vintage processing
 * (decodeAudioData) already band-limits and quantises the vintage modes to
 * full unsigned 8-bit, as the original engine output, so no mode adds a
 * further crush. Every mode plays at 1.0x: a playbackRate above 1 resamples
 * and so raises the pitch, while the original's pitch was fixed by the Sound
 * Blaster time constant (ref-docs/02-voice-and-audio.md section 7.2).
 */
const PLAYBACK_BY_MODE: Record<AudioModeId, { bitDepth: number; playbackRate: number }> = {
  modern: { bitDepth: 0, playbackRate: 1 },
  subtle: { bitDepth: 0, playbackRate: 1 },
  authentic: { bitDepth: 0, playbackRate: 1 },
  ultra: { bitDepth: 0, playbackRate: 1 },
};

export function getPlaybackSettings(mode: AudioModeId): { bitDepth: number; playbackRate: number } {
  return { ...PLAYBACK_BY_MODE[mode] };
}

/**
 * Map audio mode string to AuthenticityLevel enum
 */
function mapAudioModeToAuthenticityLevel(mode: 'modern' | 'subtle' | 'authentic' | 'ultra'): AuthenticityLevel {
  switch (mode) {
    case 'modern':
      return AuthenticityLevel.Modern;
    case 'subtle':
      return AuthenticityLevel.SubtleVintage;
    case 'authentic':
      return AuthenticityLevel.Authentic;
    case 'ultra':
      return AuthenticityLevel.UltraAuthentic;
  }
}

/**
 * Play audio buffer with configurable bit-crushing effect
 *
 * Attempts to use AudioWorklet for bit-crushing (modern, efficient).
 * Falls back to ScriptProcessorNode if AudioWorklet is unavailable (legacy browsers).
 *
 * @param buffer - AudioBuffer to play
 * @param ctx - AudioContext instance
 * @param bitDepth - Number of quantization levels (0 = disabled, 16 = 4-bit, 64 = 6-bit, 256 = 8-bit)
 * @param playbackRate - Playback speed multiplier. Above 1 it also raises the pitch.
 * @param useWorklet - Whether to attempt AudioWorklet (true) or force ScriptProcessorNode fallback (false)
 * @param onStart - Receives the source node once playback starts (to stop or visualise it)
 * @returns Promise<void> - Resolves when playback completes or the source is stopped
 *
 * @version 1.2.0 - Added AudioWorklet support with ScriptProcessorNode fallback
 */
export function playAudio(
  buffer: AudioBuffer,
  ctx: AudioContext,
  bitDepth: number = 0,
  playbackRate: number = 1,
  useWorklet: boolean = true,
  onStart?: (source: AudioBufferSourceNode) => void,
): Promise<void> {
  return new Promise((resolve) => {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    // If bit-crushing is disabled, connect directly and return
    if (bitDepth === 0) {
      source.connect(ctx.destination);
      source.onended = () => {
        source.disconnect();
        resolve();
      };
      source.start();
      onStart?.(source);
      return;
    }

    // Attempt AudioWorklet if supported and requested
    if (useWorklet && 'audioWorklet' in ctx) {
      try {
        // Try to create AudioWorkletNode
        const bitCrusher = new AudioWorkletNode(ctx, 'bit-crusher-processor', {
          processorOptions: { bitDepth },
        });

        source.connect(bitCrusher);
        bitCrusher.connect(ctx.destination);

        source.onended = () => {
          source.disconnect();
          bitCrusher.disconnect();
          resolve();
        };

        source.start();
        onStart?.(source);
        return;
      } catch (error) {
        console.warn('AudioWorklet failed, falling back to ScriptProcessorNode:', error);
        // Fall through to ScriptProcessorNode fallback
      }
    }

    // Fallback: ScriptProcessorNode (deprecated but widely supported)
    const bufferSize = 2048;
    const bitCrusher = ctx.createScriptProcessor(bufferSize, 1, 1);
    const numLevels = bitDepth;
    const step = 2.0 / (numLevels - 1);

    bitCrusher.onaudioprocess = function (e) {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        const val = input[i];
        output[i] = Math.round(val / step) * step;
      }
    };

    source.connect(bitCrusher);
    bitCrusher.connect(ctx.destination);

    source.onended = () => {
      source.disconnect();
      bitCrusher.disconnect();
      resolve();
    };

    source.start();
    onStart?.(source);
  });
}

export function playGlitchSound(ctx: AudioContext): void {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // Generate random samples for white noise
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // Start at lower volume
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); // Fade out quickly

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
  source.onended = () => {
    source.disconnect();
    gainNode.disconnect();
  };
}

/**
 * The buzz under the parity flood: a continuous tone falling from about 1 kHz
 * to about 0.7 kHz over the flood (about 4 s; CONFIRMED (DOSBox), ref-docs/04
 * section 4). Best effort: never throws, so a missing or broken audio context
 * only loses the sound.
 */
export function playParityTone(ctx: AudioContext, seconds: number = 4): void {
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime;
    const end = start + Math.max(0.05, seconds);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, start);
    oscillator.frequency.exponentialRampToValueAtTime(700, end);
    gain.gain.setValueAtTime(0.06, start);
    gain.gain.setValueAtTime(0.06, Math.max(start, end - 0.1));
    gain.gain.linearRampToValueAtTime(0, end);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(end);
  } catch (error) {
    console.warn('[audio] Parity tone unavailable:', error);
  }
}

export function playErrorBeep(ctx: AudioContext): void {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'square'; // A square wave sounds more retro/8-bit
  oscillator.frequency.setValueAtTime(300, ctx.currentTime); // A low, jarring frequency

  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); // Quick fade out

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.3); // Play for 0.3 seconds
}
