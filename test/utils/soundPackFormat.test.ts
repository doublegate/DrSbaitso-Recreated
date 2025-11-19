import { describe, it, expect } from 'vitest';
import type { SoundPack, SoundEffect, SoundTrigger } from '@/utils/soundPackFormat';
import {
  validateSoundPack,
  createEmptySoundPack,
  exportSoundPack,
  importSoundPack,
  generateShareCode,
  parseShareCode,
  getSoundPackSize,
  cloneSoundPack,
  mergeSoundPacks
} from '@/utils/soundPackFormat';

describe('soundPackFormat', () => {
  const createValidSoundPack = (): SoundPack => ({
    metadata: {
      name: 'Test Pack',
      author: 'Test Author',
      version: '1.0.0',
      description: 'A test sound pack',
      created: Date.now(),
      updated: Date.now(),
      tags: ['test']
    },
    sounds: [
      {
        id: 'test-sound',
        name: 'Test Sound',
        description: 'A test sound',
        audioData: btoa('test audio data'),
        duration: 1000,
        volume: 100
      }
    ],
    triggers: [
      {
        event: 'message_sent',
        soundId: 'test-sound',
        probability: 100
      }
    ]
  });

  describe('validateSoundPack', () => {
    it('should validate a correct sound pack', () => {
      const pack = createValidSoundPack();
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object input', () => {
      const result = validateSoundPack(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require metadata', () => {
      const pack = { ...createValidSoundPack(), metadata: undefined };
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('metadata'))).toBe(true);
    });

    it('should require pack name', () => {
      const pack = createValidSoundPack();
      pack.metadata.name = '';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should require author name', () => {
      const pack = createValidSoundPack();
      pack.metadata.author = '';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Author'))).toBe(true);
    });

    it('should validate version format', () => {
      const pack = createValidSoundPack();
      pack.metadata.version = 'invalid';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Version'))).toBe(true);
    });

    it('should accept valid semantic versions', () => {
      const pack = createValidSoundPack();
      pack.metadata.version = '2.5.13';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(true);
    });

    it('should require sounds array', () => {
      const pack = createValidSoundPack();
      (pack as any).sounds = null;
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Sounds'))).toBe(true);
    });

    it('should require at least one sound', () => {
      const pack = createValidSoundPack();
      pack.sounds = [];
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('At least one sound'))).toBe(true);
    });

    it('should validate sound IDs', () => {
      const pack = createValidSoundPack();
      pack.sounds[0].id = 'Invalid ID!';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('lowercase letters'))).toBe(true);
    });

    it('should detect duplicate sound IDs', () => {
      const pack = createValidSoundPack();
      pack.sounds.push({ ...pack.sounds[0], name: 'Different Name' });
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate ID'))).toBe(true);
    });

    it('should validate sound names', () => {
      const pack = createValidSoundPack();
      pack.sounds[0].name = '';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Name is required'))).toBe(true);
    });

    it('should validate audio data is base64', () => {
      const pack = createValidSoundPack();
      pack.sounds[0].audioData = 'not-base64!@#';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('base64'))).toBe(true);
    });

    it('should validate sound duration', () => {
      const pack = createValidSoundPack();
      pack.sounds[0].duration = -1;
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duration'))).toBe(true);
    });

    it('should validate sound volume range', () => {
      const pack = createValidSoundPack();
      pack.sounds[0].volume = 150;
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Volume'))).toBe(true);
    });

    it('should require triggers array', () => {
      const pack = createValidSoundPack();
      (pack as any).triggers = null;
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Triggers'))).toBe(true);
    });

    it('should validate trigger event types', () => {
      const pack = createValidSoundPack();
      (pack.triggers[0] as any).event = 'invalid_event';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid event'))).toBe(true);
    });

    it('should validate trigger sound references', () => {
      const pack = createValidSoundPack();
      pack.triggers[0].soundId = 'non-existent-sound';
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('non-existent'))).toBe(true);
    });

    it('should validate trigger probability range', () => {
      const pack = createValidSoundPack();
      pack.triggers[0].probability = 150;
      const result = validateSoundPack(pack);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Probability'))).toBe(true);
    });

    it('should generate warnings for long descriptions', () => {
      const pack = createValidSoundPack();
      pack.sounds[0].duration = 15000;
      const result = validateSoundPack(pack);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('createEmptySoundPack', () => {
    it('should create an empty sound pack with author', () => {
      const pack = createEmptySoundPack('Test Author');

      expect(pack.metadata.author).toBe('Test Author');
      expect(pack.sounds).toHaveLength(0);
      expect(pack.triggers).toHaveLength(0);
    });

    it('should set default name', () => {
      const pack = createEmptySoundPack('Test');

      expect(pack.metadata.name).toBe('Untitled Sound Pack');
    });

    it('should set initial version', () => {
      const pack = createEmptySoundPack('Test');

      expect(pack.metadata.version).toBe('1.0.0');
    });

    it('should set timestamps', () => {
      const before = Date.now();
      const pack = createEmptySoundPack('Test');
      const after = Date.now();

      expect(pack.metadata.created).toBeGreaterThanOrEqual(before);
      expect(pack.metadata.created).toBeLessThanOrEqual(after);
    });
  });

  describe('exportSoundPack and importSoundPack', () => {
    it('should export and import a valid pack', () => {
      const original = createValidSoundPack();
      const json = exportSoundPack(original);
      const imported = importSoundPack(json);

      expect(imported.metadata.name).toBe(original.metadata.name);
      expect(imported.sounds).toHaveLength(original.sounds.length);
      expect(imported.triggers).toHaveLength(original.triggers.length);
    });

    it('should throw error on invalid pack export', () => {
      const invalid = createValidSoundPack();
      invalid.sounds = [];

      expect(() => exportSoundPack(invalid)).toThrow();
    });

    it('should throw error on invalid JSON import', () => {
      expect(() => importSoundPack('not valid json')).toThrow();
    });

    it('should throw error on invalid pack import', () => {
      const invalid = JSON.stringify({ invalid: 'pack' });

      expect(() => importSoundPack(invalid)).toThrow();
    });
  });

  describe('generateShareCode and parseShareCode', () => {
    it('should generate and parse share codes', () => {
      const original = createValidSoundPack();
      const code = generateShareCode(original);
      const parsed = parseShareCode(code);

      expect(parsed.metadata.name).toBe(original.metadata.name);
      expect(parsed.sounds).toHaveLength(original.sounds.length);
    });

    it('should throw error on invalid share code', () => {
      expect(() => parseShareCode('invalid-code')).toThrow();
    });

    it('should handle special characters in pack data', () => {
      const pack = createValidSoundPack();
      pack.metadata.description = 'Special chars: @#$%^&*()';

      const code = generateShareCode(pack);
      const parsed = parseShareCode(code);

      expect(parsed.metadata.description).toBe(pack.metadata.description);
    });
  });

  describe('getSoundPackSize', () => {
    it('should calculate pack size in KB', () => {
      const pack = createValidSoundPack();
      const size = getSoundPackSize(pack);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should increase with more sounds', () => {
      const pack1 = createValidSoundPack();
      const size1 = getSoundPackSize(pack1);

      const pack2 = createValidSoundPack();
      pack2.sounds.push({
        id: 'sound-2',
        name: 'Sound 2',
        description: '',
        audioData: btoa('more audio data'),
        duration: 1000,
        volume: 100
      });
      const size2 = getSoundPackSize(pack2);

      expect(size2).toBeGreaterThan(size1);
    });
  });

  describe('cloneSoundPack', () => {
    it('should clone a pack with new author', () => {
      const original = createValidSoundPack();
      const cloned = cloneSoundPack(original, 'New Author');

      expect(cloned.metadata.author).toBe('New Author');
      expect(cloned.metadata.name).toContain('Copy');
    });

    it('should preserve sounds and triggers', () => {
      const original = createValidSoundPack();
      const cloned = cloneSoundPack(original, 'New Author');

      expect(cloned.sounds).toHaveLength(original.sounds.length);
      expect(cloned.triggers).toHaveLength(original.triggers.length);
    });

    it('should update timestamps', () => {
      const original = createValidSoundPack();
      const cloned = cloneSoundPack(original, 'New Author');

      expect(cloned.metadata.created).toBeGreaterThanOrEqual(original.metadata.created);
    });
  });

  describe('mergeSoundPacks', () => {
    it('should merge multiple packs', () => {
      const pack1 = createValidSoundPack();
      const pack2 = createValidSoundPack();
      pack2.sounds[0].id = 'sound-2';

      const merged = mergeSoundPacks([pack1, pack2], 'Merger');

      expect(merged.sounds.length).toBeGreaterThanOrEqual(2);
      expect(merged.metadata.author).toBe('Merger');
    });

    it('should handle ID conflicts', () => {
      const pack1 = createValidSoundPack();
      const pack2 = createValidSoundPack(); // Same IDs

      const merged = mergeSoundPacks([pack1, pack2], 'Merger');

      // Should have unique IDs
      const ids = merged.sounds.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should merge triggers correctly', () => {
      const pack1 = createValidSoundPack();
      const pack2 = createValidSoundPack();
      pack2.sounds[0].id = 'sound-2';
      pack2.triggers[0].soundId = 'sound-2';

      const merged = mergeSoundPacks([pack1, pack2], 'Merger');

      expect(merged.triggers.length).toBeGreaterThanOrEqual(2);
    });

    it('should create valid merged pack', () => {
      const pack1 = createValidSoundPack();
      const pack2 = createValidSoundPack();
      pack2.sounds[0].id = 'sound-2';
      pack2.triggers[0].soundId = 'sound-2';

      const merged = mergeSoundPacks([pack1, pack2], 'Merger');
      const validation = validateSoundPack(merged);

      expect(validation.valid).toBe(true);
    });
  });
});
