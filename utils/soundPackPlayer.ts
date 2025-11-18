/**
 * Sound Pack Player (v1.10.0)
 *
 * Runtime system for playing custom sound packs.
 * Manages sound loading, caching, and event-based playback.
 */

import type { SoundPack, SoundEffect, SoundTrigger } from './soundPackFormat';
import { decode, decodeAudioData } from './audio';

export class SoundPackPlayer {
  private currentPack: SoundPack | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 70; // 0-100

  /**
   * Load and cache a sound pack
   */
  async loadPack(pack: SoundPack, audioContext: AudioContext): Promise<void> {
    this.currentPack = pack;
    this.audioContext = audioContext;
    this.audioBuffers.clear();

    // Pre-load all sounds
    const loadPromises = pack.sounds.map(async (sound) => {
      try {
        const audioBuffer = await this.loadSound(sound);
        this.audioBuffers.set(sound.id, audioBuffer);
      } catch (error) {
        console.error(`Failed to load sound "${sound.name}":`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Load a single sound effect
   */
  private async loadSound(sound: SoundEffect): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // Decode base64 audio data
    const audioData = decode(sound.audioData);

    // Convert to AudioBuffer (24kHz, mono for sound packs)
    const audioBuffer = await decodeAudioData(audioData, this.audioContext, 24000, 1);

    return audioBuffer;
  }

  /**
   * Play sound by ID
   */
  async playSound(soundId: string): Promise<void> {
    if (!this.enabled || !this.currentPack || !this.audioContext) {
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
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Apply volume
      const gainNode = this.audioContext.createGain();
      const volume = (sound.volume / 100) * (this.masterVolume / 100);
      gainNode.gain.value = volume;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play
      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound "${soundId}":`, error);
    }
  }

  /**
   * Trigger sounds based on event
   */
  async triggerEvent(
    event: SoundTrigger['event']
  ): Promise<void> {
    if (!this.enabled || !this.currentPack) {
      return;
    }

    // Find all triggers for this event
    const triggers = this.currentPack.triggers.filter(t => t.event === event);

    // Play sounds based on probability
    const playPromises = triggers
      .filter(trigger => {
        const roll = Math.random() * 100;
        return roll < trigger.probability;
      })
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

  /**
   * Enable/disable sound playback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if player is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set master volume (0-100)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(100, volume));
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Get current pack
   */
  getCurrentPack(): SoundPack | null {
    return this.currentPack;
  }

  /**
   * Get loaded sound count
   */
  getLoadedSoundCount(): number {
    return this.audioBuffers.size;
  }
}

// Singleton instance
export const soundPackPlayer = new SoundPackPlayer();
