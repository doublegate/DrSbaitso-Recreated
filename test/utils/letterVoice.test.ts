import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  LETTER_CACHE_VERSION,
  LETTER_ORDER,
  forgetLetterMemoryForTests,
  getCachedLetter,
  isSpokenLetter,
  letterSpeechText,
  playLetter,
  resetLetterVoiceForTests,
  warmLetterCache,
} from '@/utils/letterVoice';

/** A synthesiser that answers every letter with a distinct fake clip. */
const synthOk = () => vi.fn(async (text: string, _characterId?: string) => `audio-${text}`);

/** A speech player that records what it is asked to do. */
const player = () => ({ speak: vi.fn(async (_audio: string, _text?: string) => {}), stop: vi.fn() });

/** A fake clock: sleeping advances it instantly. */
function fakeClock() {
  let t = 0;
  return { now: () => t, sleep: async (ms: number) => void (t += ms) };
}

describe('letterVoice', () => {
  beforeEach(() => {
    resetLetterVoiceForTests();
    globalThis.indexedDB = new IDBFactory();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('letter text', () => {
    it('speaks a letter as the upper-case letter and a full stop, so TTS says its name', () => {
      expect(letterSpeechText('a')).toBe('A.');
      expect(letterSpeechText('Z')).toBe('Z.');
    });

    it('has no text for anything but a single letter A-Z', () => {
      for (const ch of [' ', '1', '.', '', 'ab', 'é']) expect(letterSpeechText(ch)).toBe('');
    });

    it('recognises the letters that are spoken', () => {
      expect(isSpokenLetter('q')).toBe(true);
      expect(isSpokenLetter('Q')).toBe(true);
      expect(isSpokenLetter(' ')).toBe(false);
      expect(isSpokenLetter('7')).toBe(false);
      expect(isSpokenLetter('ab')).toBe(false);
    });

    it('fetches all 26 letters, each once', () => {
      expect(LETTER_ORDER).toHaveLength(26);
      expect(new Set(LETTER_ORDER)).toEqual(new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
    });
  });

  describe('versioning', () => {
    it('ties the cache to the classic voice, so a voice change invalidates it', () => {
      expect(LETTER_CACHE_VERSION).toContain('Charon');
    });
  });

  describe('warmLetterCache', () => {
    it('renders every letter in the doctor voice and serves it from memory afterwards', async () => {
      const synthesize = synthOk();
      await warmLetterCache({ synthesize, ...fakeClock() });
      expect(synthesize).toHaveBeenCalledTimes(26);
      for (const [text, characterId] of synthesize.mock.calls) {
        expect(characterId).toBe('sbaitso');
        expect(text).toMatch(/^[A-Z]\.$/);
      }
      expect(getCachedLetter('a')).toBe('audio-A.');
      expect(getCachedLetter('Z')).toBe('audio-Z.');

      await warmLetterCache({ synthesize, ...fakeClock() });
      expect(synthesize).toHaveBeenCalledTimes(26);
    });

    it('returns nothing for a letter that is not cached yet', () => {
      expect(getCachedLetter('a')).toBeNull();
      expect(getCachedLetter(' ')).toBeNull();
    });

    it('keeps the letters in IndexedDB, so a later visit makes no requests', async () => {
      await warmLetterCache({ synthesize: synthOk(), ...fakeClock() });
      forgetLetterMemoryForTests();
      expect(getCachedLetter('m')).toBeNull();

      const again = synthOk();
      await warmLetterCache({ synthesize: again, ...fakeClock() });
      expect(again).not.toHaveBeenCalled();
      expect(getCachedLetter('m')).toBe('audio-M.');
    });

    it('ignores letters stored under another version and fetches them again', async () => {
      await warmLetterCache({ synthesize: synthOk(), version: 'old-voice', ...fakeClock() });
      forgetLetterMemoryForTests();

      const fresh = vi.fn(async (text: string) => `new-${text}`);
      await warmLetterCache({ synthesize: fresh, ...fakeClock() });
      expect(fresh).toHaveBeenCalledTimes(26);
      expect(getCachedLetter('b')).toBe('new-B.');
    });

    it('shares one run between overlapping calls', async () => {
      const synthesize = synthOk();
      const clock = fakeClock();
      await Promise.all([warmLetterCache({ synthesize, ...clock }), warmLetterCache({ synthesize, ...clock })]);
      expect(synthesize).toHaveBeenCalledTimes(26);
    });

    it('fetches only a few letters at a time', async () => {
      let inFlight = 0;
      let peak = 0;
      const synthesize = vi.fn(async (text: string) => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 1));
        inFlight--;
        return `audio-${text}`;
      });
      await warmLetterCache({ synthesize, concurrency: 2, ...fakeClock() });
      expect(synthesize).toHaveBeenCalledTimes(26);
      expect(peak).toBeLessThanOrEqual(2);
      expect(peak).toBeGreaterThan(0);
    });

    it('spreads the requests so no minute uses more than its budget', async () => {
      const clock = fakeClock();
      const starts: number[] = [];
      const synthesize = vi.fn(async (text: string) => {
        starts.push(clock.now());
        return `audio-${text}`;
      });
      await warmLetterCache({ synthesize, perMinute: 10, ...clock });
      expect(starts).toHaveLength(26);
      for (const t of starts) {
        expect(starts.filter((s) => s >= t && s < t + 60_000).length).toBeLessThanOrEqual(10);
      }
      // Three windows: 10, 10 and 6.
      expect(clock.now()).toBeGreaterThanOrEqual(120_000);
    });

    it('stops at the first failure without throwing, keeps what it has, and resumes later', async () => {
      let calls = 0;
      const flaky = vi.fn(async (text: string) => {
        calls++;
        if (calls === 4) throw new Error('429 RATE_LIMITED');
        return `audio-${text}`;
      });
      await expect(warmLetterCache({ synthesize: flaky, concurrency: 1, ...fakeClock() })).resolves.toBeUndefined();
      expect(flaky).toHaveBeenCalledTimes(4);
      expect(getCachedLetter(LETTER_ORDER[0])).toBe(`audio-${LETTER_ORDER[0]}.`);
      expect(getCachedLetter(LETTER_ORDER[3])).toBeNull();

      const rest = synthOk();
      await warmLetterCache({ synthesize: rest, ...fakeClock() });
      expect(rest).toHaveBeenCalledTimes(23);
    });

    it('does not cache an empty clip', async () => {
      const synthesize = vi.fn(async (text: string) => (text === 'A.' ? '' : `audio-${text}`));
      await warmLetterCache({ synthesize, ...fakeClock() });
      expect(getCachedLetter('a')).toBeNull();
    });

    it('works from memory alone when IndexedDB is unavailable', async () => {
      // @ts-expect-error simulate a browser with storage disabled
      delete globalThis.indexedDB;
      const synthesize = synthOk();
      await warmLetterCache({ synthesize, ...fakeClock() });
      expect(synthesize).toHaveBeenCalledTimes(26);
      expect(getCachedLetter('e')).toBe('audio-E.');
    });
  });

  describe('playLetter', () => {
    it('cuts the previous letter and plays a cached one through the speech player', async () => {
      await warmLetterCache({ synthesize: synthOk(), ...fakeClock() });
      const p = player();
      expect(playLetter('k', p)).toBe(true);
      expect(p.stop).toHaveBeenCalled();
      expect(p.speak).toHaveBeenCalledWith('audio-K.', 'K.');
    });

    it('stays silent for a letter that is not cached, and for anything else', () => {
      const p = player();
      expect(playLetter('k', p)).toBe(false);
      expect(playLetter(' ', p)).toBe(false);
      expect(p.speak).not.toHaveBeenCalled();
    });

    it('swallows playback errors', async () => {
      await warmLetterCache({ synthesize: synthOk(), ...fakeClock() });
      const p = { speak: vi.fn(() => Promise.reject(new Error('no audio'))), stop: vi.fn() };
      const unhandled = vi.fn();
      process.on('unhandledRejection', unhandled);
      expect(playLetter('a', p)).toBe(true);
      await new Promise((r) => setTimeout(r, 10));
      process.off('unhandledRejection', unhandled);
      expect(unhandled).not.toHaveBeenCalled();
    });
  });
});
