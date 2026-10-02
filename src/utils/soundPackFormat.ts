/**
 * Sound Pack Format & Validation (v1.10.0)
 *
 * Defines the structure for custom sound packs and provides validation.
 * Sound packs allow users to create custom audio collections for different events.
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
  /** Base64-encoded audio data (PCM, 24kHz, mono, Int16) */
  audioData: string;
  /** Duration in milliseconds */
  duration: number;
  /** Volume adjustment 0-100 */
  volume: number;
}

export interface SoundTrigger {
  /** When to play this sound */
  event: 'message_sent' | 'message_received' | 'error' | 'startup' | 'character_switch' | 'theme_change';
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

// Maximum file sizes to prevent abuse
const MAX_SOUND_SIZE_KB = 500; // 500KB per sound
const MAX_PACK_SIZE_KB = 5000; // 5MB total pack size
const MAX_SOUNDS = 50; // Maximum 50 sounds per pack

/**
 * Validate sound pack structure and constraints
 */
export function validateSoundPack(pack: unknown): SoundPackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Type guard
  if (!pack || typeof pack !== 'object') {
    errors.push('Sound pack must be an object');
    return { valid: false, errors, warnings };
  }

  const soundPack = pack as Partial<SoundPack>;

  // Validate metadata
  if (!soundPack.metadata) {
    errors.push('Missing metadata');
  } else {
    const meta = soundPack.metadata;

    if (!meta.name || meta.name.trim().length === 0) {
      errors.push('Pack name is required');
    } else if (meta.name.length > 100) {
      errors.push('Pack name must be 100 characters or less');
    }

    if (!meta.author || meta.author.trim().length === 0) {
      errors.push('Author name is required');
    } else if (meta.author.length > 100) {
      errors.push('Author name must be 100 characters or less');
    }

    if (!meta.version || !/^\d+\.\d+\.\d+$/.test(meta.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    if (!meta.description || meta.description.trim().length === 0) {
      warnings.push('Description is recommended');
    } else if (meta.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    if (!meta.created || typeof meta.created !== 'number') {
      errors.push('Created timestamp is required');
    }

    if (!meta.updated || typeof meta.updated !== 'number') {
      errors.push('Updated timestamp is required');
    }

    if (!Array.isArray(meta.tags)) {
      warnings.push('Tags should be an array');
    } else if (meta.tags.length > 10) {
      warnings.push('Maximum 10 tags recommended');
    }
  }

  // Validate sounds array
  if (!Array.isArray(soundPack.sounds)) {
    errors.push('Sounds must be an array');
  } else {
    const sounds = soundPack.sounds;

    if (sounds.length === 0) {
      errors.push('At least one sound is required');
    }

    if (sounds.length > MAX_SOUNDS) {
      errors.push(`Maximum ${MAX_SOUNDS} sounds allowed per pack`);
    }

    const soundIds = new Set<string>();
    let totalSize = 0;

    sounds.forEach((sound, index) => {
      if (!sound.id || sound.id.trim().length === 0) {
        errors.push(`Sound ${index + 1}: ID is required`);
      } else {
        if (soundIds.has(sound.id)) {
          errors.push(`Sound ${index + 1}: Duplicate ID "${sound.id}"`);
        }
        soundIds.add(sound.id);

        if (!/^[a-z0-9_-]+$/.test(sound.id)) {
          errors.push(`Sound ${index + 1}: ID must contain only lowercase letters, numbers, hyphens, and underscores`);
        }
      }

      if (!sound.name || sound.name.trim().length === 0) {
        errors.push(`Sound ${index + 1}: Name is required`);
      } else if (sound.name.length > 50) {
        errors.push(`Sound ${index + 1}: Name must be 50 characters or less`);
      }

      if (!sound.audioData || typeof sound.audioData !== 'string') {
        errors.push(`Sound ${index + 1}: Audio data is required and must be a string`);
      } else {
        // Validate base64 format
        if (!/^[A-Za-z0-9+/=]+$/.test(sound.audioData)) {
          errors.push(`Sound ${index + 1}: Audio data must be valid base64`);
        }

        // Calculate size
        const sizeKB = (sound.audioData.length * 0.75) / 1024; // Base64 to bytes conversion
        totalSize += sizeKB;

        if (sizeKB > MAX_SOUND_SIZE_KB) {
          errors.push(`Sound ${index + 1}: Exceeds ${MAX_SOUND_SIZE_KB}KB limit (${Math.round(sizeKB)}KB)`);
        }
      }

      if (typeof sound.duration !== 'number' || sound.duration <= 0) {
        errors.push(`Sound ${index + 1}: Duration must be a positive number`);
      } else if (sound.duration > 10000) {
        warnings.push(`Sound ${index + 1}: Duration over 10 seconds may impact performance`);
      }

      if (typeof sound.volume !== 'number' || sound.volume < 0 || sound.volume > 100) {
        errors.push(`Sound ${index + 1}: Volume must be between 0 and 100`);
      }
    });

    if (totalSize > MAX_PACK_SIZE_KB) {
      errors.push(`Total pack size exceeds ${MAX_PACK_SIZE_KB}KB limit (${Math.round(totalSize)}KB)`);
    }
  }

  // Validate triggers array
  if (!Array.isArray(soundPack.triggers)) {
    errors.push('Triggers must be an array');
  } else {
    const triggers = soundPack.triggers;
    const validEvents = ['message_sent', 'message_received', 'error', 'startup', 'character_switch', 'theme_change'];

    triggers.forEach((trigger, index) => {
      if (!trigger.event || !validEvents.includes(trigger.event)) {
        errors.push(`Trigger ${index + 1}: Invalid event type "${trigger.event}"`);
      }

      if (!trigger.soundId || typeof trigger.soundId !== 'string') {
        errors.push(`Trigger ${index + 1}: Sound ID is required`);
      } else if (soundPack.sounds && !soundPack.sounds.find(s => s.id === trigger.soundId)) {
        errors.push(`Trigger ${index + 1}: References non-existent sound "${trigger.soundId}"`);
      }

      if (typeof trigger.probability !== 'number' || trigger.probability < 0 || trigger.probability > 100) {
        errors.push(`Trigger ${index + 1}: Probability must be between 0 and 100`);
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

  return JSON.stringify(pack, null, 2);
}

/**
 * Import sound pack from JSON string
 */
export function importSoundPack(json: string): SoundPack {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  const validation = validateSoundPack(parsed);

  if (!validation.valid) {
    throw new Error(`Invalid sound pack: ${validation.errors.join(', ')}`);
  }

  return parsed as SoundPack;
}

/**
 * Generate shareable code for sound pack (compressed)
 */
export function generateShareCode(pack: SoundPack): string {
  const json = exportSoundPack(pack);

  // For simplicity, using base64 encoding
  // In production, consider using compression like pako/zlib
  return btoa(encodeURIComponent(json));
}

/**
 * Parse shareable code to sound pack
 */
export function parseShareCode(code: string): SoundPack {
  try {
    const json = decodeURIComponent(atob(code));
    return importSoundPack(json);
  } catch (error) {
    throw new Error('Invalid share code');
  }
}

/**
 * Get sound pack size in KB
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
