import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  listSoundPacks,
  saveSoundPack,
  deleteSoundPack,
  LEGACY_SOUND_PACKS_KEY,
  resetSoundPackStoreForTests,
} from '@/utils/soundPackStore';
import type { SoundPack } from '@/utils/soundPackFormat';

const pack = (name: string): SoundPack => ({
  metadata: { name, author: 'A', version: '1.0.0', description: 'x', created: 1, updated: 1, tags: [] },
  sounds: [{ id: 's', name: 'S', description: '', audioData: 'AAAA', duration: 5, volume: 80 }],
  triggers: [{ event: 'message_sent', soundId: 's', probability: 100 }],
});

describe('soundPackStore (IndexedDB)', () => {
  beforeEach(() => {
    resetSoundPackStoreForTests();
    globalThis.indexedDB = new IDBFactory();
  });

  it('saves, lists and deletes packs', async () => {
    await saveSoundPack(pack('One'));
    await saveSoundPack(pack('Two'));
    expect((await listSoundPacks()).map((p) => p.metadata.name).sort()).toEqual(['One', 'Two']);

    await deleteSoundPack('One');
    expect((await listSoundPacks()).map((p) => p.metadata.name)).toEqual(['Two']);
  });

  it('replaces a pack with the same name', async () => {
    await saveSoundPack(pack('One'));
    const updated = pack('One');
    updated.metadata.author = 'B';
    await saveSoundPack(updated);
    const all = await listSoundPacks();
    expect(all).toHaveLength(1);
    expect(all[0].metadata.author).toBe('B');
  });

  it('refuses to store an invalid pack', async () => {
    const bad = pack('Bad');
    bad.sounds = [];
    await expect(saveSoundPack(bad)).rejects.toThrow(/Invalid sound pack/);
  });

  it('migrates packs from the legacy localStorage key once, skipping invalid ones', async () => {
    const broken = { metadata: { name: 'Broken' } };
    localStorage.setItem(LEGACY_SOUND_PACKS_KEY, JSON.stringify([pack('Old'), broken]));

    const first = await listSoundPacks();
    expect(first.map((p) => p.metadata.name)).toEqual(['Old']);
    expect(localStorage.getItem(LEGACY_SOUND_PACKS_KEY)).toBeNull();

    // Still there on a later read, from IndexedDB alone.
    expect((await listSoundPacks()).map((p) => p.metadata.name)).toEqual(['Old']);
  });

  it('picks up packs written to the legacy key after migration', async () => {
    await listSoundPacks();
    localStorage.setItem(LEGACY_SOUND_PACKS_KEY, JSON.stringify([pack('Late')]));
    expect((await listSoundPacks()).map((p) => p.metadata.name)).toEqual(['Late']);
  });

  it('survives corrupt legacy JSON', async () => {
    localStorage.setItem(LEGACY_SOUND_PACKS_KEY, '{not json');
    expect(await listSoundPacks()).toEqual([]);
  });
});
