/**
 * Sound Pack Format & Validation
 *
 * Defines the structure for custom sound packs and provides validation.
 * Sound packs allow users to create custom audio collections for different events.
 *
 * Storage format: every sound's `audioData` is base64 of little-endian PCM16,
 * mono, at `sampleRate` (default {@link SOUND_PACK_SAMPLE_RATE}). Uploaded
 * WAV/MP3/OGG files are decoded with the browser's `decodeAudioData` and
 * converted to this form, so a pack plays identically everywhere and never
 * depends on which codecs the playing browser supports. Packs written by
 * v1.10/v1.11 stored the uploaded file's raw bytes instead; the player
 * recognises those by their container magic and decodes them as files.
 */

export interface SoundPackMetadata {
  name: string;
  author: string;
  version: string;
  description: string;
  created: number;
  updated: number;
  tags: string[];
}

export interface SoundEffect {
  id: string;
  name: string;
  description: string;
  /** Base64-encoded little-endian PCM16 mono audio at `sampleRate`. */
  audioData: string;
  /** Duration in milliseconds */
  duration: number;
  /** Volume adjustment 0-100 */
  volume: number;
  /** Sample rate of `audioData`; absent means {@link SOUND_PACK_SAMPLE_RATE}. */
  sampleRate?: number;
}

export const SOUND_TRIGGER_EVENTS = [
  'message_sent',
  'message_received',
  'error',
  'glitch',
  'startup',
  'character_switch',
  'theme_change',
] as const;

export type SoundTriggerEvent = (typeof SOUND_TRIGGER_EVENTS)[number];

export interface SoundTrigger {
  /** When to play this sound */
  event: SoundTriggerEvent;
  /** Sound effect ID to play */
  soundId: string;
  /** Probability 0-100 (for random variation) */
  probability: number;
}

export interface SoundPack {
  metadata: SoundPackMetadata;
  sounds: SoundEffect[];
  triggers: SoundTrigger[];
}

export interface SoundPackValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Sample rate sounds are stored at: matches the speech pipeline and keeps packs small. */
export const SOUND_PACK_SAMPLE_RATE = 24000;

// Maximum sizes to prevent abuse
const MAX_SOUND_SIZE_KB = 500; // 500KB per sound (~10 s at 24 kHz PCM16)
const MAX_PACK_SIZE_KB = 5000; // 5MB total pack size
const MAX_SOUNDS = 50; // Maximum 50 sounds per pack
const MAX_TRIGGERS = 200;
const MIN_SAMPLE_RATE = 3000;
const MAX_SAMPLE_RATE = 192000;

/**
 * Largest JSON document (in UTF-16 code units, ~bytes for base64 payloads)
 * accepted by {@link importSoundPack}. A maximal valid pack is 5 MB of audio,
 * which is ~6.7 MB of base64 plus metadata.
 */
export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// ---------------------------------------------------------------------------
// Binary helpers
// ---------------------------------------------------------------------------

const BASE64_CHUNK = 0x8000;

/**
 * Base64-encodes bytes in fixed-size chunks. The previous implementation
 * appended one character per byte (`reduce` + string concatenation), which is
 * quadratic in the worst case and stalls the tab on a multi-megabyte file.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK) {
    const chunk = bytes.subarray(offset, offset + BASE64_CHUNK);
    parts.push(String.fromCharCode.apply(null, chunk as unknown as number[]));
  }
  return btoa(parts.join(''));
}

/** Decodes base64 to bytes. Throws on malformed input (from `atob`). */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** The subset of AudioBuffer that {@link audioBufferToPcm16} reads. */
export interface PcmSource {
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  readonly length: number;
  getChannelData(channel: number): Float32Array;
}

/**
 * Converts decoded audio to the pack storage format: channels averaged to
 * mono, linearly resampled to `targetRate`, clamped, little-endian PCM16.
 */
export function audioBufferToPcm16(
  buffer: PcmSource,
  targetRate: number = SOUND_PACK_SAMPLE_RATE
): { pcm: Uint8Array; sampleRate: number; durationMs: number } {
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));

  const ratio = buffer.sampleRate / targetRate;
  const outLength = Math.max(0, Math.round(buffer.length / ratio));
  const pcm = new Uint8Array(outLength * 2);
  const view = new DataView(pcm.buffer);

  const monoAt = (index: number): number => {
    let sum = 0;
    for (const data of channels) sum += data[index] ?? 0;
    return channels.length > 0 ? sum / channels.length : 0;
  };

  for (let i = 0; i < outLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const frac = position - index;
    const a = monoAt(index);
    const b = index + 1 < buffer.length ? monoAt(index + 1) : a;
    const sample = Math.max(-1, Math.min(1, a + (b - a) * frac));
    view.setInt16(i * 2, sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767), true);
  }

  return { pcm, sampleRate: targetRate, durationMs: Math.round((outLength / targetRate) * 1000) };
}

/**
 * True when bytes are an encoded audio file (WAV, MP3, OGG, FLAC) rather than
 * raw PCM. Used to play packs saved by older versions, which stored uploads verbatim.
 */
export function isEncodedAudioContainer(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (tag === 'RIFF' || tag === 'OggS' || tag === 'fLaC') return true;
  if (tag.startsWith('ID3')) return true;
  // MPEG audio frame sync: 11 set bits.
  return bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

/**
 * Decodes an uploaded audio file (any format the browser supports) into the
 * pack storage format.
 */
export async function decodeAudioFileForPack(
  file: ArrayBuffer,
  ctx: BaseAudioContext
): Promise<{ audioData: string; duration: number; sampleRate: number }> {
  let decoded: AudioBuffer;
  try {
    // decodeAudioData detaches its argument, so hand it a copy.
    decoded = await ctx.decodeAudioData(file.slice(0));
  } catch {
    throw new Error('This file could not be decoded as audio. Use WAV, MP3 or OGG.');
  }
  const { pcm, sampleRate, durationMs } = audioBufferToPcm16(decoded);
  if (pcm.byteLength / 1024 > MAX_SOUND_SIZE_KB) {
    const maxSeconds = Math.floor((MAX_SOUND_SIZE_KB * 1024) / (SOUND_PACK_SAMPLE_RATE * 2));
    throw new Error(`Sound is too long (${(durationMs / 1000).toFixed(1)} s). The limit is about ${maxSeconds} s.`);
  }
  return { audioData: bytesToBase64(pcm), duration: Math.max(1, durationMs), sampleRate };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate sound pack structure and constraints. Never throws: every type
 * mismatch is reported as an error, so arbitrary parsed JSON is safe input.
 */
export function validateSoundPack(pack: unknown): SoundPackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(pack)) {
    errors.push('Sound pack must be an object');
    return { valid: false, errors, warnings };
  }

  // Metadata
  const meta = pack.metadata;
  if (!isRecord(meta)) {
    errors.push('Missing metadata');
  } else {
    if (!isNonEmptyString(meta.name)) {
      errors.push('Pack name is required');
    } else if (meta.name.length > 100) {
      errors.push('Pack name must be 100 characters or less');
    }

    if (!isNonEmptyString(meta.author)) {
      errors.push('Author name is required');
    } else if (meta.author.length > 100) {
      errors.push('Author name must be 100 characters or less');
    }

    if (typeof meta.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(meta.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    if (meta.description !== undefined && typeof meta.description !== 'string') {
      errors.push('Description must be a string');
    } else if (!isNonEmptyString(meta.description)) {
      warnings.push('Description is recommended');
    } else if (meta.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    if (!isFiniteNumber(meta.created) || meta.created <= 0) {
      errors.push('Created timestamp is required');
    }

    if (!isFiniteNumber(meta.updated) || meta.updated <= 0) {
      errors.push('Updated timestamp is required');
    }

    if (!Array.isArray(meta.tags)) {
      warnings.push('Tags should be an array');
    } else {
      if (meta.tags.some((tag) => typeof tag !== 'string' || tag.length > 30)) {
        errors.push('Tags must be strings of 30 characters or less');
      }
      if (meta.tags.length > 10) {
        warnings.push('Maximum 10 tags recommended');
      }
    }
  }

  // Sounds
  const soundIds = new Set<string>();
  if (!Array.isArray(pack.sounds)) {
    errors.push('Sounds must be an array');
  } else {
    const sounds: unknown[] = pack.sounds;

    if (sounds.length === 0) {
      errors.push('At least one sound is required');
    }

    if (sounds.length > MAX_SOUNDS) {
      errors.push(`Maximum ${MAX_SOUNDS} sounds allowed per pack`);
    }

    let totalSize = 0;

    sounds.slice(0, MAX_SOUNDS + 1).forEach((sound, index) => {
      const label = `Sound ${index + 1}`;
      if (!isRecord(sound)) {
        errors.push(`${label}: must be an object`);
        return;
      }

      if (!isNonEmptyString(sound.id)) {
        errors.push(`${label}: ID is required`);
      } else {
        if (soundIds.has(sound.id)) {
          errors.push(`${label}: Duplicate ID "${sound.id}"`);
        }
        soundIds.add(sound.id);

        if (!/^[a-z0-9_-]{1,64}$/.test(sound.id)) {
          errors.push(`${label}: ID must contain only lowercase letters, numbers, hyphens, and underscores`);
        }
      }

      if (!isNonEmptyString(sound.name)) {
        errors.push(`${label}: Name is required`);
      } else if (sound.name.length > 50) {
        errors.push(`${label}: Name must be 50 characters or less`);
      }

      if (sound.description !== undefined && typeof sound.description !== 'string') {
        errors.push(`${label}: Description must be a string`);
      } else if (typeof sound.description === 'string' && sound.description.length > 500) {
        errors.push(`${label}: Description must be 500 characters or less`);
      }

      if (!isNonEmptyString(sound.audioData)) {
        errors.push(`${label}: Audio data is required and must be a string`);
      } else {
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(sound.audioData) || sound.audioData.length % 4 !== 0) {
          errors.push(`${label}: Audio data must be valid base64`);
        }

        const sizeKB = (sound.audioData.length * 0.75) / 1024;
        totalSize += sizeKB;

        if (sizeKB > MAX_SOUND_SIZE_KB) {
          errors.push(`${label}: Exceeds ${MAX_SOUND_SIZE_KB}KB limit (${Math.round(sizeKB)}KB)`);
        }
      }

      if (!isFiniteNumber(sound.duration) || sound.duration <= 0) {
        errors.push(`${label}: Duration must be a positive number`);
      } else if (sound.duration > 10000) {
        warnings.push(`${label}: Duration over 10 seconds may impact performance`);
      }

      if (!isFiniteNumber(sound.volume) || sound.volume < 0 || sound.volume > 100) {
        errors.push(`${label}: Volume must be between 0 and 100`);
      }

      if (
        sound.sampleRate !== undefined &&
        (!isFiniteNumber(sound.sampleRate) || sound.sampleRate < MIN_SAMPLE_RATE || sound.sampleRate > MAX_SAMPLE_RATE)
      ) {
        errors.push(`${label}: Sample rate must be between ${MIN_SAMPLE_RATE} and ${MAX_SAMPLE_RATE}`);
      }
    });

    if (totalSize > MAX_PACK_SIZE_KB) {
      errors.push(`Total pack size exceeds ${MAX_PACK_SIZE_KB}KB limit (${Math.round(totalSize)}KB)`);
    }
  }

  // Triggers
  if (!Array.isArray(pack.triggers)) {
    errors.push('Triggers must be an array');
  } else {
    const triggers: unknown[] = pack.triggers;
    if (triggers.length > MAX_TRIGGERS) {
      errors.push(`Maximum ${MAX_TRIGGERS} triggers allowed per pack`);
    }

    triggers.slice(0, MAX_TRIGGERS + 1).forEach((trigger, index) => {
      const label = `Trigger ${index + 1}`;
      if (!isRecord(trigger)) {
        errors.push(`${label}: must be an object`);
        return;
      }

      if (typeof trigger.event !== 'string' || !(SOUND_TRIGGER_EVENTS as readonly string[]).includes(trigger.event)) {
        errors.push(`${label}: Invalid event type "${String(trigger.event)}"`);
      }

      if (!isNonEmptyString(trigger.soundId)) {
        errors.push(`${label}: Sound ID is required`);
      } else if (!soundIds.has(trigger.soundId)) {
        errors.push(`${label}: References non-existent sound "${trigger.soundId}"`);
      }

      if (!isFiniteNumber(trigger.probability) || trigger.probability < 0 || trigger.probability > 100) {
        errors.push(`${label}: Probability must be between 0 and 100`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Rebuilds a validated pack from its known fields only, so unknown keys in
 * imported JSON (including `__proto__`-style keys) never reach storage.
 * Call only after {@link validateSoundPack} succeeded.
 */
export function normalizeSoundPack(pack: SoundPack): SoundPack {
  const m = pack.metadata;
  return {
    metadata: {
      name: m.name,
      author: m.author,
      version: m.version,
      description: typeof m.description === 'string' ? m.description : '',
      created: m.created,
      updated: m.updated,
      tags: Array.isArray(m.tags) ? m.tags.filter((t): t is string => typeof t === 'string') : [],
    },
    sounds: pack.sounds.map((s) => {
      const sound: SoundEffect = {
        id: s.id,
        name: s.name,
        description: typeof s.description === 'string' ? s.description : '',
        audioData: s.audioData,
        duration: s.duration,
        volume: s.volume,
      };
      if (s.sampleRate !== undefined) sound.sampleRate = s.sampleRate;
      return sound;
    }),
    triggers: pack.triggers.map((t) => ({ event: t.event, soundId: t.soundId, probability: t.probability })),
  };
}

/**
 * Create a new empty sound pack template
 */
export function createEmptySoundPack(author: string): SoundPack {
  return {
    metadata: {
      name: 'Untitled Sound Pack',
      author,
      version: '1.0.0',
      description: '',
      created: Date.now(),
      updated: Date.now(),
      tags: []
    },
    sounds: [],
    triggers: []
  };
}

/**
 * Export sound pack to JSON string
 */
export function exportSoundPack(pack: SoundPack): string {
  const validation = validateSoundPack(pack);

  if (!validation.valid) {
    throw new Error(`Cannot export invalid sound pack: ${validation.errors.join(', ')}`);
  }

  return JSON.stringify(normalizeSoundPack(pack), null, 2);
}

/**
 * Import sound pack from JSON string. Rejects oversized input before parsing
 * and malformed packs with every validation error listed.
 */
export function importSoundPack(json: string): SoundPack {
  if (typeof json !== 'string') {
    throw new Error('Sound pack must be JSON text');
  }
  if (json.length > MAX_IMPORT_BYTES) {
    throw new Error(`Sound pack file is too large (limit ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB)`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON format');
  }

  const validation = validateSoundPack(parsed);

  if (!validation.valid) {
    throw new Error(`Invalid sound pack: ${validation.errors.join(', ')}`);
  }

  return normalizeSoundPack(parsed as SoundPack);
}

/**
 * Generate shareable code for sound pack
 */
export function generateShareCode(pack: SoundPack): string {
  const json = exportSoundPack(pack);
  // encodeURIComponent makes the text Latin-1 safe for btoa.
  return btoa(encodeURIComponent(json));
}

/**
 * Parse shareable code to sound pack
 */
export function parseShareCode(code: string): SoundPack {
  const trimmed = typeof code === 'string' ? code.trim() : '';
  // A share code is base64 of URI-encoded JSON: at most ~3x the JSON size.
  if (trimmed.length > MAX_IMPORT_BYTES * 3) {
    throw new Error('Share code is too large');
  }
  let json: string;
  try {
    json = decodeURIComponent(atob(trimmed));
  } catch {
    throw new Error('Invalid share code');
  }
  return importSoundPack(json);
}

/**
 */
export function getSoundPackSize(pack: SoundPack): number {
  const json = JSON.stringify(pack);
  return (json.length * 0.75) / 1024; // Approximate bytes to KB
}

/**
 * Clone a sound pack with new metadata
 */
export function cloneSoundPack(pack: SoundPack, newAuthor: string): SoundPack {
  return {
    metadata: {
      ...pack.metadata,
      name: `${pack.metadata.name} (Copy)`,
      author: newAuthor,
      created: Date.now(),
      updated: Date.now()
    },
    sounds: [...pack.sounds],
    triggers: [...pack.triggers]
  };
}

/**
 * Merge multiple sound packs (useful for combining collections)
 */
export function mergeSoundPacks(packs: SoundPack[], author: string): SoundPack {
  const mergedSounds: SoundEffect[] = [];
  const mergedTriggers: SoundTrigger[] = [];
  const soundIdMap = new Map<string, string>(); // Old ID -> New ID

  // Collect all sounds, resolving ID conflicts
  packs.forEach((pack, packIndex) => {
    pack.sounds.forEach(sound => {
      let newId = sound.id;

      // If ID already exists, append pack index
      if (mergedSounds.find(s => s.id === newId)) {
        newId = `${sound.id}_p${packIndex}`;
      }

      soundIdMap.set(`${packIndex}-${sound.id}`, newId);

      mergedSounds.push({
        ...sound,
        id: newId
      });
    });
  });

  // Collect all triggers, updating sound IDs
  packs.forEach((pack, packIndex) => {
    pack.triggers.forEach(trigger => {
      const newSoundId = soundIdMap.get(`${packIndex}-${trigger.soundId}`);

      if (newSoundId) {
        mergedTriggers.push({
          ...trigger,
          soundId: newSoundId
        });
      }
    });
  });

  return {
    metadata: {
      name: 'Merged Sound Pack',
      author,
      version: '1.0.0',
      description: `Merged from ${packs.length} packs`,
      created: Date.now(),
      updated: Date.now(),
      tags: ['merged']
    },
    sounds: mergedSounds,
    triggers: mergedTriggers
  };
}
