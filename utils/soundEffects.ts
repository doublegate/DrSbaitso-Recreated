/**
 * Retro Sound Effects & Audio Atmosphere System (v1.9.0)
 *
 * Provides authentic 1980s-1990s computer sound effects and background ambience
 * for immersive retro computing experience.
 *
 * Features:
 * - Keyboard click sounds (3 variations)
 * - System beeps (error, success, notification)
 * - Boot sequence sounds
 * - Background ambience (computer room atmosphere)
 * - Multiple sound packs (DOS, Apple II, Commodore 64)
 * - Volume controls (UI sounds, ambience, speech separate)
 * - Easter egg sounds triggered by keywords
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SoundSettings {
  uiSoundsEnabled: boolean;
  ambienceEnabled: boolean;
  uiVolume: number; // 0-1
  ambienceVolume: number; // 0-1
  selectedSoundPack: SoundPackId;
  keyboardClicksEnabled: boolean;
  systemBeepsEnabled: boolean;
  bootSoundsEnabled: boolean;
}

export type SoundPackId = 'dos-pc' | 'apple-ii' | 'commodore-64' | 'modern-synth';

export interface SoundPack {
  id: SoundPackId;
  name: string;
  description: string;
  sounds: {
    keyClick1: string; // Base64 encoded WAV or URL to audio file
    keyClick2: string;
    keyClick3: string;
    errorBeep: string;
    successBeep: string;
    notificationBeep: string;
    bootStart: string;
    bootComplete: string;
    diskAccess: string;
  };
}

export type SoundEventType =
  | 'keypress'
  | 'message-send'
  | 'message-receive'
  | 'error'
  | 'success'
  | 'notification'
  | 'boot-start'
  | 'boot-complete'
  | 'disk-access'
  | 'easter-egg';

// ============================================================================
// SOUND GENERATION (Procedural for zero dependencies)
// ============================================================================

/**
 * Generate procedural retro sound effects using Web Audio API
 * This eliminates the need for audio files, keeping bundle size minimal
 */
class SoundGenerator {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate keyboard click sound (authentic mechanical keyboard)
   */
  generateKeyClick(variation: 1 | 2 | 3 = 1): AudioBuffer {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.05; // 50ms
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Different variations for realism
    const baseFreq = variation === 1 ? 1200 : variation === 2 ? 1000 : 1400;
    const decay = variation === 1 ? 0.03 : variation === 2 ? 0.04 : 0.025;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Click is a sharp attack with fast decay
      const envelope = Math.exp(-t / decay);
      const noise = (Math.random() * 2 - 1) * 0.3; // White noise for texture
      const tone = Math.sin(2 * Math.PI * baseFreq * t * (1 - t * 5)); // Pitch bends down
      data[i] = (tone * 0.7 + noise * 0.3) * envelope;
    }

    return buffer;
  }

  /**
   * Generate system beep (like PC speaker)
   */
  generateBeep(type: 'error' | 'success' | 'notification'): AudioBuffer {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;

    let duration: number, freq: number;
    switch (type) {
      case 'error':
        duration = 0.3;
        freq = 300;
        break; // Low buzz
      case 'success':
        duration = 0.15;
        freq = 800;
        break; // Higher chirp
      case 'notification':
        duration = 0.1;
        freq = 1000;
        break; // Quick beep
    }

    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = type === 'error' ? 1 : Math.exp(-t / 0.05); // Error sustains
      const wave = Math.sin(2 * Math.PI * freq * t);
      data[i] = wave * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Generate boot sound (ascending tone sequence)
   */
  generateBootSound(phase: 'start' | 'complete'): AudioBuffer {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = phase === 'start' ? 0.8 : 0.4;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const freqs = phase === 'start' ? [400, 600, 800, 1200] : [800, 1200];
    const stepDuration = duration / freqs.length;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const step = Math.floor(t / stepDuration);
      const freq = freqs[Math.min(step, freqs.length - 1)];
      const localT = t - step * stepDuration;
      const envelope = Math.exp(-localT / 0.1);
      data[i] = Math.sin(2 * Math.PI * freq * localT) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Generate disk access sound (rapid clicks simulating floppy disk)
   */
  generateDiskAccess(): AudioBuffer {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.6;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Series of rapid clicks at irregular intervals
    const clicks = [0.05, 0.12, 0.15, 0.25, 0.35, 0.42, 0.48, 0.55];
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let signal = 0;
      clicks.forEach((clickTime) => {
        const diff = Math.abs(t - clickTime);
        if (diff < 0.01) {
          signal += Math.exp(-diff / 0.002) * (Math.random() * 0.5 + 0.5);
        }
      });
      data[i] = Math.min(1, signal) * 0.4;
    }

    return buffer;
  }

  /**
   * Generate ambient computer room sound (low hum + occasional disk activity)
   */
  generateAmbience(duration: number = 60): AudioBuffer {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Low hum (60Hz + 120Hz harmonics simulating power supply)
      const hum = Math.sin(2 * Math.PI * 60 * t) * 0.05 + Math.sin(2 * Math.PI * 120 * t) * 0.02;
      // Fan noise (filtered white noise)
      const fanNoise = (Math.random() * 2 - 1) * 0.03;
      // Occasional disk activity
      const diskPulse =
        Math.sin(t * 2) > 0.98 ? (Math.random() * 2 - 1) * 0.15 * Math.exp(-(t % 1) / 0.1) : 0;
      data[i] = hum + fanNoise + diskPulse;
    }

    return buffer;
  }
}

// ============================================================================
// SOUND MANAGER
// ============================================================================

export class SoundEffectsManager {
  private audioContext: AudioContext | null = null;
  private soundGenerator: SoundGenerator;
  private settings: SoundSettings;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;
  private soundCache: Map<string, AudioBuffer> = new Map();

  constructor(initialSettings?: Partial<SoundSettings>) {
    this.soundGenerator = new SoundGenerator();
    this.settings = {
      uiSoundsEnabled: true,
      ambienceEnabled: false,
      uiVolume: 0.5,
      ambienceVolume: 0.3,
      selectedSoundPack: 'dos-pc',
      keyboardClicksEnabled: true,
      systemBeepsEnabled: true,
      bootSoundsEnabled: true,
      ...initialSettings,
    };
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Initialize audio context (call after user interaction)
   */
  async initialize(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  /**
   * Play a sound effect
   */
  async playSound(eventType: SoundEventType, volume: number = 1): Promise<void> {
    if (!this.settings.uiSoundsEnabled) return;

    const ctx = this.getAudioContext();
    let buffer: AudioBuffer | null = null;

    // Check cache first
    const cacheKey = `${eventType}`;
    if (this.soundCache.has(cacheKey)) {
      buffer = this.soundCache.get(cacheKey)!;
    } else {
      // Generate sound based on event type
      switch (eventType) {
        case 'keypress':
          if (!this.settings.keyboardClicksEnabled) return;
          buffer = this.soundGenerator.generateKeyClick(
            ((Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3)
          );
          break;
        case 'message-send':
          if (!this.settings.systemBeepsEnabled) return;
          buffer = this.soundGenerator.generateBeep('success');
          break;
        case 'message-receive':
          if (!this.settings.systemBeepsEnabled) return;
          buffer = this.soundGenerator.generateBeep('notification');
          break;
        case 'error':
          if (!this.settings.systemBeepsEnabled) return;
          buffer = this.soundGenerator.generateBeep('error');
          break;
        case 'success':
          if (!this.settings.systemBeepsEnabled) return;
          buffer = this.soundGenerator.generateBeep('success');
          break;
        case 'notification':
          if (!this.settings.systemBeepsEnabled) return;
          buffer = this.soundGenerator.generateBeep('notification');
          break;
        case 'boot-start':
          if (!this.settings.bootSoundsEnabled) return;
          buffer = this.soundGenerator.generateBootSound('start');
          break;
        case 'boot-complete':
          if (!this.settings.bootSoundsEnabled) return;
          buffer = this.soundGenerator.generateBootSound('complete');
          break;
        case 'disk-access':
          buffer = this.soundGenerator.generateDiskAccess();
          break;
      }

      if (buffer) {
        this.soundCache.set(cacheKey, buffer);
      }
    }

    if (!buffer) return;

    // Play the sound
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    source.buffer = buffer;
    gainNode.gain.value = this.settings.uiVolume * volume;
    source.connect(gainNode).connect(ctx.destination);
    source.start(0);
  }

  /**
   * Start background ambience loop
   */
  async startAmbience(): Promise<void> {
    if (!this.settings.ambienceEnabled || this.ambienceSource) return;

    const ctx = this.getAudioContext();

    // Generate or retrieve ambience buffer
    let buffer = this.soundCache.get('ambience');
    if (!buffer) {
      buffer = this.soundGenerator.generateAmbience(60); // 60 seconds
      this.soundCache.set('ambience', buffer);
    }

    // Create looping source
    this.ambienceSource = ctx.createBufferSource();
    this.ambienceGain = ctx.createGain();
    this.ambienceSource.buffer = buffer;
    this.ambienceSource.loop = true;
    this.ambienceGain.gain.value = this.settings.ambienceVolume;

    this.ambienceSource.connect(this.ambienceGain).connect(ctx.destination);
    this.ambienceSource.start(0);
  }

  /**
   * Stop background ambience
   */
  stopAmbience(): void {
    if (this.ambienceSource) {
      this.ambienceSource.stop();
      this.ambienceSource = null;
      this.ambienceGain = null;
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<SoundSettings>): void {
    const wasAmbienceEnabled = this.settings.ambienceEnabled;
    this.settings = { ...this.settings, ...newSettings };

    // Handle ambience state change
    if (this.settings.ambienceEnabled && !wasAmbienceEnabled) {
      this.startAmbience();
    } else if (!this.settings.ambienceEnabled && wasAmbienceEnabled) {
      this.stopAmbience();
    }

    // Update ambience volume if playing
    if (this.ambienceGain) {
      this.ambienceGain.gain.value = this.settings.ambienceVolume;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(): void {
    try {
      localStorage.setItem('soundEffectsSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): void {
    try {
      const stored = localStorage.getItem('soundEffectsSettings');
      if (stored) {
        const loaded = JSON.parse(stored);
        this.updateSettings(loaded);
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  /**
   * Play easter egg sound (special trigger)
   */
  async playEasterEgg(keyword: string): Promise<void> {
    // Custom sounds for specific keywords
    const ctx = this.getAudioContext();

    // Example: "beep boop" plays robot sounds
    if (keyword.toLowerCase().includes('beep')) {
      await this.playSound('notification', 0.8);
      setTimeout(() => this.playSound('notification', 0.6), 200);
      setTimeout(() => this.playSound('notification', 1), 400);
    }
    // Add more easter eggs as needed
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopAmbience();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.soundCache.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let soundManagerInstance: SoundEffectsManager | null = null;

export function getSoundManager(): SoundEffectsManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundEffectsManager();
    soundManagerInstance.loadSettings();
  }
  return soundManagerInstance;
}
