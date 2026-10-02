/**
 * Sound Pack Player
 *
 * Runtime system for playing custom sound packs: decodes a pack's sounds
 * once into AudioBuffers on the shared AudioContext and plays the ones bound
 * to an app event.
 *
 * App code calls {@link playSoundPackEvent}; it is fire-and-forget, never
 * throws, and restores the pack the user last activated (remembered across
 * reloads) the first time it is needed.
 */

import {
  base64ToBytes,
  isEncodedAudioContainer,
  SOUND_PACK_SAMPLE_RATE,
  type SoundPack,
  type SoundEffect,
  type SoundTriggerEvent,
} from './soundPackFormat';
import { getSharedAudioContext } from './sharedAudio';

/** App events a sound pack can react to. */
export type SoundPackEvent =
  | 'message-send'
  | 'message-receive'
  | 'error'
  | 'glitch'
  | 'startup'
  | 'character-switch'
  | 'theme-change';

const EVENT_TO_TRIGGER: Record<SoundPackEvent, SoundTriggerEvent> = {
  'message-send': 'message_sent',
  'message-receive': 'message_received',
  error: 'error',
  glitch: 'glitch',
  startup: 'startup',
  'character-switch': 'character_switch',
  'theme-change': 'theme_change',
};

export function toTriggerEvent(event: SoundPackEvent): SoundTriggerEvent {
  return EVENT_TO_TRIGGER[event];
}

/** localStorage key holding the name of the pack the user activated. */
export const ACTIVE_SOUND_PACK_KEY = 'dr_sbaitso_active_sound_pack';

export class SoundPackPlayer {
  private currentPack: SoundPack | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private audioContext: BaseAudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 70; // 0-100

  /**
   * Decode and cache every sound of a pack. Sounds that fail to decode are
   * skipped (and logged) so one bad sound does not disable the pack.
   */
  async loadPack(pack: SoundPack, audioContext: BaseAudioContext): Promise<void> {
    this.currentPack = pack;
    this.audioContext = audioContext;
    this.audioBuffers.clear();

    await Promise.all(
      pack.sounds.map(async (sound) => {
        try {
          this.audioBuffers.set(sound.id, await this.loadSound(sound, audioContext));
        } catch (error) {
          console.error(`Failed to load sound "${sound.name}":`, error);
        }
      })
    );
  }

  private async loadSound(sound: SoundEffect, ctx: BaseAudioContext): Promise<AudioBuffer> {
    const bytes = base64ToBytes(sound.audioData);

    // Packs saved before v2.0 stored the uploaded file itself.
    if (isEncodedAudioContainer(bytes)) {
      // slice() copies into a fresh ArrayBuffer (decodeAudioData detaches it).
      return ctx.decodeAudioData(bytes.slice().buffer);
    }

    // Current format: little-endian PCM16 mono. DataView avoids Int16Array's
    // even-length requirement; a stray trailing byte is ignored.
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const frames = Math.floor(bytes.byteLength / 2);
    if (frames === 0) throw new Error('Sound has no audio data');
    const buffer = ctx.createBuffer(1, frames, sound.sampleRate ?? SOUND_PACK_SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      channel[i] = view.getInt16(i * 2, true) / 32768;
    }
    return buffer;
  }

  /**
   * Play sound by ID
   */
  async playSound(soundId: string): Promise<void> {
    const ctx = this.audioContext;
    if (!this.enabled || !this.currentPack || !ctx) {
      return;
    }

    const audioBuffer = this.audioBuffers.get(soundId);
    if (!audioBuffer) {
      console.warn(`Sound "${soundId}" not found in current pack`);
      return;
    }

    const sound = this.currentPack.sounds.find(s => s.id === soundId);
    if (!sound) return;

    try {
      if ('state' in ctx && ctx.state === 'suspended' && 'resume' in ctx) {
        await (ctx as AudioContext).resume().catch(() => {});
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = (sound.volume / 100) * (this.masterVolume / 100);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound "${soundId}":`, error);
    }
  }

  /**
   * Play the sounds bound to a pack trigger event, each with its probability.
   */
  async triggerEvent(event: SoundTriggerEvent): Promise<void> {
    if (!this.enabled || !this.currentPack) {
      return;
    }

    const playPromises = this.currentPack.triggers
      .filter(t => t.event === event && Math.random() * 100 < t.probability)
      .map(trigger => this.playSound(trigger.soundId));

    await Promise.all(playPromises);
  }

  /**
   * Unload current pack
   */
  unload(): void {
    this.currentPack = null;
    this.audioBuffers.clear();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Set master volume (0-100) */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(100, volume));
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getCurrentPack(): SoundPack | null {
    return this.currentPack;
  }

  getLoadedSoundCount(): number {
    return this.audioBuffers.size;
  }
}

// Singleton instance
export const soundPackPlayer = new SoundPackPlayer();

function readActiveName(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SOUND_PACK_KEY);
  } catch {
    return null;
  }
}

function writeActiveName(name: string | null): void {
  try {
    if (name === null) localStorage.removeItem(ACTIVE_SOUND_PACK_KEY);
    else localStorage.setItem(ACTIVE_SOUND_PACK_KEY, name);
  } catch {
    // Storage blocked: the pack still plays for this page load.
  }
}

/**
 * Loads a pack into the shared player on the shared AudioContext and
 * remembers it as the active pack across reloads.
 */
export async function activateSoundPack(pack: SoundPack): Promise<void> {
  const ctx = getSharedAudioContext();
  if (!ctx) throw new Error('Audio is not available in this browser');
  await soundPackPlayer.loadPack(pack, ctx);
  writeActiveName(pack.metadata.name);
  restorePromise = Promise.resolve();
}

/** Unloads the active pack and forgets it. */
export function deactivateSoundPack(): void {
  soundPackPlayer.unload();
  writeActiveName(null);
}

let restorePromise: Promise<void> | null = null;

/** Loads the remembered active pack once per page load (no-op if none). */
function restoreActivePack(): Promise<void> {
  if (restorePromise) return restorePromise;
  restorePromise = (async () => {
    if (soundPackPlayer.getCurrentPack()) return;
    const name = readActiveName();
    if (!name) return;
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    // Imported lazily: IndexedDB code is only needed once a pack is active.
    const { getSoundPack } = await import('./soundPackStore');
    const pack = await getSoundPack(name);
    if (pack) {
      await soundPackPlayer.loadPack(pack, ctx);
    } else {
      writeActiveName(null);
    }
  })().catch((error: unknown) => {
    console.warn('[soundPacks] Could not restore the active sound pack:', error);
  });
  return restorePromise;
}

/**
 * Plays the active sound pack's sounds for an app event. Fire-and-forget:
 * resolves when playback has started and never rejects.
 */
export async function playSoundPackEvent(event: SoundPackEvent): Promise<void> {
  try {
    await restoreActivePack();
    await soundPackPlayer.triggerEvent(toTriggerEvent(event));
  } catch (error) {
    console.warn(`[soundPacks] Could not play "${event}" sounds:`, error);
  }
}
