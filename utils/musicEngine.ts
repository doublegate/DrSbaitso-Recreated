/**
 * Procedural Chiptune Music Engine (v1.11.0)
 *
 * Generates retro 8-bit music that adapts to conversation mood.
 * Uses Web Audio API to create chiptune-style sounds procedurally.
 *
 * Features:
 * - Adaptive mood (major = positive, minor = negative)
 * - Dynamic tempo based on conversation pace
 * - Pentatonic/minor scale patterns
 * - 4-bar loop structure with variation
 * - Multiple instrument layers (lead, bass, arpeggio)
 */

export type MusicMood = 'auto' | 'happy' | 'sad' | 'neutral' | 'tense';
export type MusicTempo = 'slow' | 'normal' | 'fast';

export interface MusicSettings {
  enabled: boolean;
  volume: number; // 0-100
  mood: MusicMood;
  tempo: MusicTempo;
}

export class MusicEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private leadGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private arpGain: GainNode | null = null;

  private isPlaying: boolean = false;
  private currentBeat: number = 0;
  private intervalId: number | null = null;

  private settings: MusicSettings = {
    enabled: false,
    volume: 50,
    mood: 'auto',
    tempo: 'normal'
  };

  // Musical scales (MIDI note numbers relative to C)
  private readonly PENTATONIC_MAJOR = [0, 2, 4, 7, 9]; // C, D, E, G, A
  private readonly PENTATONIC_MINOR = [0, 3, 5, 7, 10]; // C, Eb, F, G, Bb
  private readonly NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10]; // C, D, Eb, F, G, Ab, Bb

  // Base frequency for C4
  private readonly BASE_FREQ = 261.63;

  /**
   * Initialize the music engine
   */
  init(): void {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.settings.volume / 100 * 0.3; // Keep music quieter than TTS
    this.masterGain.connect(this.audioContext.destination);

    // Individual channel gains
    this.leadGain = this.audioContext.createGain();
    this.leadGain.gain.value = 0.4;
    this.leadGain.connect(this.masterGain);

    this.bassGain = this.audioContext.createGain();
    this.bassGain.gain.value = 0.6;
    this.bassGain.connect(this.masterGain);

    this.arpGain = this.audioContext.createGain();
    this.arpGain.gain.value = 0.3;
    this.arpGain.connect(this.masterGain);

    console.log('[MusicEngine] Initialized');
  }

  /**
   * Start playing music
   */
  start(): void {
    if (this.isPlaying) return;
    if (!this.audioContext) this.init();

    this.isPlaying = true;
    this.currentBeat = 0;

    const bpm = this.getBPM();
    const beatDuration = 60000 / bpm; // milliseconds per beat

    // Schedule music loop
    this.intervalId = window.setInterval(() => {
      this.playBeat();
      this.currentBeat++;
      if (this.currentBeat >= 16) this.currentBeat = 0; // 4 bars of 4 beats
    }, beatDuration);

    console.log('[MusicEngine] Started playing');
  }

  /**
   * Stop playing music
   */
  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('[MusicEngine] Stopped playing');
  }

  /**
   * Update music settings
   */
  updateSettings(settings: Partial<MusicSettings>): void {
    this.settings = { ...this.settings, ...settings };

    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.volume / 100 * 0.3;
    }

    if (settings.enabled !== undefined) {
      if (settings.enabled && !this.isPlaying) {
        this.start();
      } else if (!settings.enabled && this.isPlaying) {
        this.stop();
      }
    }
  }

  /**
   * Get current settings
   */
  getSettings(): MusicSettings {
    return { ...this.settings };
  }

  /**
   * Play a single beat of music
   */
  private playBeat(): void {
    if (!this.audioContext) return;

    const beat = this.currentBeat % 4;
    const bar = Math.floor(this.currentBeat / 4);

    // Bass plays on beats 0 and 2
    if (beat === 0 || beat === 2) {
      this.playBassNote(bar);
    }

    // Lead melody plays on every beat
    this.playLeadNote(beat, bar);

    // Arpeggio plays on off-beats
    if (beat % 2 === 1) {
      this.playArpeggioNote(beat, bar);
    }
  }

  /**
   * Play bass note
   */
  private playBassNote(bar: number): void {
    if (!this.audioContext || !this.bassGain) return;

    const scale = this.getScale();
    const octave = -1; // One octave below middle C

    // Simple bass pattern: root, root, fifth, root
    const pattern = [0, 0, 4, 0];
    const noteIndex = pattern[bar];

    const freq = this.getFrequency(scale[noteIndex], octave);
    this.playNote(freq, 0.3, 'square', this.bassGain);
  }

  /**
   * Play lead melody note
   */
  private playLeadNote(beat: number, bar: number): void {
    if (!this.audioContext || !this.leadGain) return;

    const scale = this.getScale();
    const octave = 1; // One octave above middle C

    // Melodic patterns for each bar
    const patterns = [
      [0, 2, 4, 2],  // Bar 1: ascending
      [4, 2, 0, 1],  // Bar 2: descending
      [0, 4, 2, 4],  // Bar 3: skip pattern
      [4, 3, 2, 0],  // Bar 4: resolution
    ];

    const noteIndex = patterns[bar][beat];
    const freq = this.getFrequency(scale[noteIndex], octave);
    this.playNote(freq, 0.2, 'square', this.leadGain);
  }

  /**
   * Play arpeggio note
   */
  private playArpeggioNote(beat: number, bar: number): void {
    if (!this.audioContext || !this.arpGain) return;

    const scale = this.getScale();
    const octave = 0; // Middle C octave

    // Fast arpeggios
    const arpPattern = [0, 2, 4];
    const noteIndex = arpPattern[(beat + bar) % arpPattern.length];

    const freq = this.getFrequency(scale[noteIndex], octave);
    this.playNote(freq, 0.1, 'triangle', this.arpGain);
  }

  /**
   * Play a single note
   */
  private playNote(
    frequency: number,
    duration: number,
    waveform: OscillatorType,
    destination: AudioNode
  ): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;

    // Envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + 0.01); // Attack
    envelope.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay

    // Connect
    oscillator.connect(envelope);
    envelope.connect(destination);

    // Play
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Get scale based on current mood
   */
  private getScale(): number[] {
    const mood = this.settings.mood;

    if (mood === 'happy') return this.PENTATONIC_MAJOR;
    if (mood === 'sad') return this.NATURAL_MINOR;
    if (mood === 'tense') return this.NATURAL_MINOR;
    if (mood === 'neutral') return this.PENTATONIC_MAJOR;

    // Auto: could be determined by sentiment later
    return this.PENTATONIC_MAJOR;
  }

  /**
   * Get BPM based on tempo setting
   */
  private getBPM(): number {
    switch (this.settings.tempo) {
      case 'slow': return 100;
      case 'fast': return 150;
      case 'normal':
      default: return 120;
    }
  }

  /**
   * Convert MIDI note and octave to frequency
   */
  private getFrequency(midiNote: number, octave: number): number {
    return this.BASE_FREQ * Math.pow(2, (midiNote / 12) + octave);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.masterGain = null;
    this.leadGain = null;
    this.bassGain = null;
    this.arpGain = null;

    console.log('[MusicEngine] Destroyed');
  }
}

// Export singleton instance
export const musicEngine = new MusicEngine();
