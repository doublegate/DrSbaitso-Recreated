/**
 * The spoken alphabet for the classic name prompt.
 *
 * The original speaks each letter of the name as it is typed, about 0.06 s
 * after the echo (ref-docs/04-dosbox-verification.md section 1). A TTS round
 * trip is far slower than that, so the 26 letters are rendered once in Dr.
 * Sbaitso's voice and kept in the browser: in memory for this page, and in
 * IndexedDB for later visits. A key press then plays its letter at once.
 *
 * The warm-up is quota-aware. The proxy allows 20 requests a minute per
 * client (api/_lib/http.ts), and the doctor's own speech must not be starved,
 * so letters are fetched a few at a time, at most `perMinute` per minute, in
 * the order they are most often typed in names. The first failure ends a run
 * (a 429 or an outage would only repeat); the next call resumes with the
 * letters still missing. Nothing here throws into the UI: a failure only
 * means silent letters.
 */
import { CHARACTERS, VOICE_PROFILES } from '../constants';
import { synthesizeSpeech } from '../services/geminiService';

const DB_NAME = 'DrSbaitsoLetterVoice';
const DB_VERSION = 1;
const STORE = 'letters';

/** Letters by how often they appear in first names, so the first batch covers most keystrokes. */
export const LETTER_ORDER: readonly string[] = [...'AEINRLOSTMDHCYBKJGUVPWFZXQ'];

/** 32-bit FNV-1a, as hex: a short, stable fingerprint of the voice settings. */
function fingerprint(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Identifies the voice the cached letters were rendered with: the classic
 * profile's voice name plus a fingerprint of the style the proxy sends with
 * it. Changing either makes every stored letter stale.
 */
export const LETTER_CACHE_VERSION = (() => {
  const profile = VOICE_PROFILES.classic;
  const style = [CHARACTERS.find((c) => c.id === 'sbaitso')?.voiceStyle ?? '', profile.style].join('|');
  return `1:${profile.voiceName}:${fingerprint(style)}`;
})();

interface LetterRecord {
  /** `${version}:${letter}` */
  id: string;
  version: string;
  letter: string;
  /** Base64 PCM16, 24 kHz, as /api/tts returns it. */
  audio: string;
  savedAt: number;
}

export interface WarmOptions {
  /** Defaults to the proxy client; tests inject a fake. */
  synthesize?: (text: string, characterId: string) => Promise<string>;
  /** Requests in flight at once (default 2). */
  concurrency?: number;
  /** Requests started per window (default 10, half the proxy's limit). */
  perMinute?: number;
  windowMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  /** Cache version (default LETTER_CACHE_VERSION). */
  version?: string;
}

/** What playLetter needs from the speech player (useSpeechPlayer). */
export interface LetterPlayer {
  speak: (audio: string, text?: string) => Promise<void>;
  stop: () => void;
}

const memory = new Map<string, string>();
const loaded = new Set<string>();
let warming: Promise<void> | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

const memoryKey = (version: string, letter: string) => `${version}:${letter}`;

/** True for a single letter A-Z (either case): the keys that are spoken. */
export function isSpokenLetter(char: string): boolean {
  return /^[A-Za-z]$/.test(char);
}

/**
 * The text sent to TTS for a letter. Dr. Sbaitso's text goes to TTS in
 * capitals unchanged (ttsCase 'upper'), and a lone capital with a full stop is
 * read as the letter's name ("A." is "ay", not the article).
 */
export function letterSpeechText(char: string): string {
  return isSpokenLetter(char) ? `${char.toUpperCase()}.` : '';
}

/** The cached clip for a letter, or null if it is not cached (yet). */
export function getCachedLetter(char: string, version = LETTER_CACHE_VERSION): string | null {
  if (!isSpokenLetter(char)) return null;
  return memory.get(memoryKey(version, char.toUpperCase())) ?? null;
}

/**
 * Plays a letter at once if it is cached, cutting the previous one. Returns
 * whether anything was played. Never throws; playback errors are dropped.
 */
export function playLetter(char: string, player: LetterPlayer): boolean {
  const audio = getCachedLetter(char);
  if (!audio) return false;
  try {
    player.stop();
    player.speak(audio, letterSpeechText(char)).catch(() => {});
  } catch {
    return false;
  }
  return true;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB request failed')));
  });
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.addEventListener('upgradeneeded', () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error ?? new Error('Could not open letter storage')));
  }).catch((error: unknown) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

/** Copies stored letters of this version into memory and removes stale versions. Best effort. */
async function loadStored(version: string): Promise<void> {
  if (loaded.has(version)) return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const records = await requestToPromise(store.getAll() as IDBRequest<LetterRecord[]>);
    for (const record of records) {
      if (record.version === version && typeof record.audio === 'string' && record.audio) {
        memory.set(memoryKey(version, record.letter), record.audio);
      } else if (record.version !== version && version === LETTER_CACHE_VERSION) {
        store.delete(record.id);
      }
    }
  } catch {
    // No storage: this page keeps its letters in memory only.
  }
  loaded.add(version);
}

async function saveLetter(version: string, letter: string, audio: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const record: LetterRecord = { id: memoryKey(version, letter), version, letter, audio, savedAt: Date.now() };
    await requestToPromise(tx.objectStore(STORE).put(record));
  } catch {
    // Not persisted; it is still in memory for this page.
  }
}

async function runWarm(options: WarmOptions): Promise<void> {
  const {
    synthesize = synthesizeSpeech,
    concurrency = 2,
    perMinute = 10,
    windowMs = 60_000,
    now = Date.now,
    sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    version = LETTER_CACHE_VERSION,
  } = options;

  await loadStored(version);
  const queue = LETTER_ORDER.filter((l) => !memory.has(memoryKey(version, l)));
  if (queue.length === 0) return;

  let stopped = false;
  const starts: number[] = [];
  // Slots are taken one caller at a time so the window count cannot race.
  let slotChain: Promise<void> = Promise.resolve();
  const takeSlot = () => {
    const slot = slotChain.then(async () => {
      for (;;) {
        const t = now();
        while (starts.length > 0 && starts[0] <= t - windowMs) starts.shift();
        if (starts.length < perMinute) {
          starts.push(t);
          return;
        }
        await sleep(starts[0] + windowMs - t);
      }
    });
    slotChain = slot;
    return slot;
  };

  const worker = async () => {
    while (!stopped) {
      const letter = queue.shift();
      if (!letter) return;
      await takeSlot();
      if (stopped) return;
      try {
        const audio = await synthesize(letterSpeechText(letter), 'sbaitso');
        if (!audio) continue;
        memory.set(memoryKey(version, letter), audio);
        await saveLetter(version, letter, audio);
      } catch {
        // Rate limited, offline or unconfigured: retrying now would only fail again.
        stopped = true;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, worker));
}

/**
 * Renders the missing letters in the background. Overlapping calls share one
 * run. Always resolves.
 */
export function warmLetterCache(options: WarmOptions = {}): Promise<void> {
  if (warming) return warming;
  warming = runWarm(options)
    .catch(() => {})
    .finally(() => {
      warming = null;
    });
  return warming;
}

/** Test-only: drop the in-memory letters (IndexedDB is kept), as a new page load would. */
export function forgetLetterMemoryForTests(): void {
  memory.clear();
  loaded.clear();
  warming = null;
}

/** Test-only: forget everything, including the cached connection. */
export function resetLetterVoiceForTests(): void {
  forgetLetterMemoryForTests();
  dbPromise = null;
}
