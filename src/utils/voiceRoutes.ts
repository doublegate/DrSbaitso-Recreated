/**
 * Chooses how a persona's TTS audio is processed (ref-docs/09 section 6.1).
 *
 * The audio-mode selector means "Dr. Sbaitso authenticity" only: it picks
 * the vintage chain for the `sbaitso` route and is ignored by the others.
 * HAL and JOSHUA always get their own chains; ELIZA and PARRY are played
 * clean, since neither program ever spoke through a Sound Blaster.
 *
 * @module voiceRoutes
 */
import type { VoiceProcessing } from '../constants';
import { processHalVoice, processWoprVoice } from './personaVoices';

export type AudioModeId = 'modern' | 'subtle' | 'authentic' | 'ultra';

/** What decodeAudioData does with the samples. */
export type VoiceRoute = 'none' | 'vintage' | 'hal' | 'wopr';

export function resolveVoiceRoute(processing: VoiceProcessing, mode?: AudioModeId): VoiceRoute {
  switch (processing) {
    case 'sbaitso':
      return mode && mode !== 'modern' ? 'vintage' : 'none';
    case 'hal':
      return 'hal';
    case 'wopr':
      return 'wopr';
    case 'clean':
      return 'none';
  }
}

/** Runs one persona chain over one channel. `text` is what the audio says. */
export function processPersonaSamples(
  route: 'hal' | 'wopr',
  samples: Float32Array,
  sampleRate: number,
  text?: string,
): Float32Array {
  return route === 'hal'
    ? processHalVoice(samples, sampleRate, { text })
    : processWoprVoice(samples, sampleRate, { text });
}
