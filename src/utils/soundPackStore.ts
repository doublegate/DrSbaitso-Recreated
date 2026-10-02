/**
 * Sound pack persistence in IndexedDB.
 *
 * Packs used to live in localStorage, whose ~5 MB per-origin quota one
 * decoded pack can exhaust on its own (and which every other feature shares).
 * IndexedDB has a far larger quota and stores structured objects without a
 * JSON round trip.
 *
 * Migration: packs under the old localStorage key are copied in on every
 * read and the key is then removed. Reading it on every call, rather than
 * once, also picks up packs that code still writing the old key saves later.
 * Remove the legacy read one release after v2.0.0.
 */

import { validateSoundPack, normalizeSoundPack, type SoundPack } from './soundPackFormat';

export const LEGACY_SOUND_PACKS_KEY = 'dr_sbaitso_sound_packs';

const DB_NAME = 'DrSbaitsoSoundPacks';
const DB_VERSION = 1;
const STORE = 'packs';

interface PackRecord {
  /** Pack name: the identity used by the manager UI. */
  id: string;
  pack: SoundPack;
  savedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB request failed')));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error ?? new Error('IndexedDB transaction failed')));
    tx.addEventListener('abort', () => reject(tx.error ?? new Error('IndexedDB transaction aborted')));
  });
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Sound packs need IndexedDB, which this browser has disabled'));
  }
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.addEventListener('upgradeneeded', () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error ?? new Error('Could not open sound pack storage')));
  }).catch((error: unknown) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

function validated(pack: unknown): SoundPack {
  const result = validateSoundPack(pack);
  if (!result.valid) {
    throw new Error(`Invalid sound pack: ${result.errors.join(', ')}`);
  }
  return normalizeSoundPack(pack as SoundPack);
}

async function putAll(packs: SoundPack[]): Promise<void> {
  if (packs.length === 0) return;
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const savedAt = Date.now();
  for (const pack of packs) {
    const record: PackRecord = { id: pack.metadata.name, pack, savedAt };
    store.put(record);
  }
  await transactionDone(tx);
}

/** Copies valid packs from the legacy localStorage key, then removes it. */
async function migrateLegacy(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_SOUND_PACKS_KEY);
  } catch {
    return; // storage blocked
  }
  if (raw === null) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[soundPacks] Discarding unreadable legacy sound pack data');
    parsed = [];
  }

  const packs: SoundPack[] = [];
  if (Array.isArray(parsed)) {
    for (const candidate of parsed) {
      try {
        packs.push(validated(candidate));
      } catch (error) {
        console.warn('[soundPacks] Skipping invalid legacy sound pack:', error);
      }
    }
  }

  await putAll(packs);
  try {
    localStorage.removeItem(LEGACY_SOUND_PACKS_KEY);
  } catch {
    // Ignore: the next read retries, and re-putting the same packs is harmless.
  }
}

/** All installed packs (oldest first), after migrating any legacy ones. */
export async function listSoundPacks(): Promise<SoundPack[]> {
  await migrateLegacy();
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const records = await requestToPromise(tx.objectStore(STORE).getAll() as IDBRequest<PackRecord[]>);
  return [...records].sort((a, b) => a.savedAt - b.savedAt).map((r) => r.pack);
}

/** Loads one pack by name, or null. */
export async function getSoundPack(name: string): Promise<SoundPack | null> {
  await migrateLegacy();
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const record = await requestToPromise(tx.objectStore(STORE).get(name) as IDBRequest<PackRecord | undefined>);
  return record?.pack ?? null;
}

/** Validates and stores a pack, replacing any pack with the same name. */
export async function saveSoundPack(pack: SoundPack): Promise<void> {
  await putAll([validated(pack)]);
}

export async function deleteSoundPack(name: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(name);
  await transactionDone(tx);
}

/** Test-only: forget the cached connection so a fresh IDBFactory is used. */
export function resetSoundPackStoreForTests(): void {
  dbPromise = null;
}
