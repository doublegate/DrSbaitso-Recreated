/**
 * The local half of the hybrid Dr. Sbaitso engine.
 *
 * `processInput` handles everything the original program did deterministically
 * (commands, dot commands, empty/short/garbage/repeated input, profanity, the
 * parity error, goodbyes) and returns `{ kind: 'model' }` for everything else,
 * which the caller sends to the language model.
 *
 * The original's control flow is reconstructed from its string table, not from
 * a disassembly (ref-docs/01): the response texts are CONFIRMED, the order in
 * which the handlers run is LIKELY. Comments mark the guesses.
 */
import { calcReply, looksArithmetic } from './calc';
import { DEFAULT_SETTINGS, DOT_MESSAGES, applyParam, applyValue, dotCommand } from './dotCommands';
import {
  AGE_QUESTION,
  AGE_TOO_OLD,
  AGE_TOO_YOUNG,
  ANATOMY_LECTURES,
  AUTHOR_REPLY,
  BYE_REFUSAL_INDEX,
  BYE_REPLIES,
  CRAZY_PARITY_JOKE,
  CRAZY_REPLIES,
  EMPTY_INPUT,
  GARBAGE_INPUT,
  AGE_NONSENSE,
  AGE_QUESTIONS,
  GARBLE,
  GOOD_BYE,
  PARITY_MARKER,
  PROFANITY_GROUP,
  PROFANITY_WORDS,
  REPEAT_TIER_1,
  REPEAT_TIER_2,
  SEXUAL_WORDS,
  SHORT_INPUT,
  SHORT_INPUT_BIG,
  SHORT_INPUT_COLOR,
  SHORT_KEYWORDS,
  SHUT_UP_REPLIES,
  parityFlood,
} from './phrases';
import { nextRandom } from './random';
import { HELP_40_COLUMNS, helpPages } from './screens';
import type { EngineStep, SbaitsoSettings, SbaitsoState } from './types';

const NONE = { kind: 'none' } as const;

/**
 * Inputs shorter than this with no keyword get the SHT7CHR pool. The group
 * name suggests seven characters (LIKELY).
 */
export const SHORT_INPUT_LENGTH = 7;

/** Seed used when the caller does not pass one. */
export const DEFAULT_SEED = 0x5ba1750;

/** Fresh state for a new patient. `seed` drives the random replies. */
export function createSbaitsoState(name: string, seed: number = DEFAULT_SEED): SbaitsoState {
  return {
    name: name.trim().toUpperCase(),
    settings: { ...DEFAULT_SETTINGS },
    lastReply: [],
    lastInput: '',
    repeatCount: 0,
    emptyCount: 0,
    profanityStrikes: 0,
    cursors: {},
    pending: NONE,
    rng: seed >>> 0,
  };
}

/**
 * Remember a reply produced outside the engine (the model's answer) so that
 * `R` can repeat it. Multi-line text is split into lines.
 */
export function recordReply(state: SbaitsoState, text: string | readonly string[]): SbaitsoState {
  const lines = (typeof text === 'string' ? text.split('\n') : [...text])
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return { ...state, lastReply: lines };
}

// ---------------------------------------------------------------------------
// Small helpers

/** Next line of a pool, advancing that pool's cursor. */
function rotate(state: SbaitsoState, key: string, pool: readonly string[]): [string, SbaitsoState] {
  const index = state.cursors[key] ?? 0;
  return [pool[index % pool.length], { ...state, cursors: { ...state.cursors, [key]: index + 1 } }];
}

/** A random line of a pool, advancing the state's generator. */
function pick(state: SbaitsoState, pool: readonly string[]): [string, SbaitsoState] {
  const [value, rng] = nextRandom(state.rng);
  return [pool[Math.floor(value * pool.length)], { ...state, rng }];
}

const withName = (line: string, name: string): string => line.replaceAll('~', name);

/** Remove the deliberate garbage characters before a line is spoken. */
const speakable = (line: string): string => line.replace(GARBLE, '').replace(/\s+/g, ' ').trim();

function reply(state: SbaitsoState, lines: string[], extra: { settings?: Partial<SbaitsoSettings>; stopSpeech?: boolean } = {}): EngineStep {
  const settings = extra.settings ? { ...state.settings, ...extra.settings } : state.settings;
  return {
    state: { ...state, settings, lastReply: lines },
    result: { kind: 'reply', lines, speak: lines.map(speakable), ...extra },
  };
}

/**
 * The parity routine: optional `lead` lines (printed and spoken first), the
 * flood, then the literal reply `PARITY`, printed and spoken (CONFIRMED (DOSBox)).
 */
function parity(state: SbaitsoState, lead: string[] = []): EngineStep {
  const [, rng] = nextRandom(state.rng);
  const lines = [PARITY_MARKER];
  return {
    state: { ...state, rng, lastReply: lines },
    result: {
      kind: 'parity',
      lead,
      leadSpeak: lead.map(speakable),
      flood: parityFlood(state.rng),
      lines,
      speak: lines,
    },
  };
}

function exit(state: SbaitsoState, lines: string[]): EngineStep {
  return { state: { ...state, lastReply: lines }, result: { kind: 'exit', lines, showMenu: true } };
}

const noop = (state: SbaitsoState): EngineStep => ({ state, result: { kind: 'noop' } });

/** Upper-case words with punctuation removed: "Bye, Dr. Sbaitso!" -> "BYE DR SBAITSO". */
function normalise(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesWordList(words: readonly string[], list: readonly string[]): boolean {
  return words.some((word) =>
    list.some((entry) => (entry.endsWith('*') ? word.startsWith(entry.slice(0, -1)) : word === entry)),
  );
}

/**
 * Keyboard mashing or symbol soup (GRBGE). Heuristics, not the original's rule,
 * which is undocumented: no letters, mostly symbols, a long word without a
 * vowel, a run of six consonants, or one letter repeated.
 */
function isGarbage(text: string): boolean {
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  const visible = text.replace(/\s/g, '').length;
  if (letters === 0 || letters / visible < 0.5) return true;
  const words = text.toUpperCase().match(/[A-Z]+/g) ?? [];
  return words.some(
    (word) =>
      (word.length >= 5 && !/[AEIOUY]/.test(word)) ||
      /[BCDFGHJKLMNPQRSTVWXZ]{6,}/.test(word) ||
      /^(.)\1{3,}$/.test(word),
  );
}

// ---------------------------------------------------------------------------
// Handlers

function showHelp(state: SbaitsoState, page: 1 | 2 | 3): EngineStep {
  if (state.settings.width === 40) return reply(state, [HELP_40_COLUMNS]);
  const more = page < 3;
  return {
    state: { ...state, pending: page === 1 || page === 2 ? { kind: 'help', page } : NONE },
    result: { kind: 'help', page, lines: helpPages()[page - 1], more },
  };
}

/** Empty Enter: a random line of the group, never escalating (CONFIRMED (DOSBox)). */
function emptyEnter(state: SbaitsoState): EngineStep {
  const [line, next] = pick({ ...state, emptyCount: state.emptyCount + 1 }, EMPTY_INPUT);
  return reply(next, [line]);
}

function ageReply(state: SbaitsoState, age: number): EngineStep {
  if (age < 18) return reply(state, [AGE_TOO_YOUNG]);
  const [line, next] = rotate(state, 'age', AGE_TOO_OLD);
  return reply(next, [line]);
}

/** The next line of the profanity group (CONFIRMED (DOSBox) order). */
function profanity(state: SbaitsoState): EngineStep {
  const index = state.profanityStrikes % PROFANITY_GROUP.length;
  const next = { ...state, profanityStrikes: (index + 1) % PROFANITY_GROUP.length };
  const line = PROFANITY_GROUP[index];
  if (line === PARITY_MARKER) return parity(next);
  const asksAge = AGE_QUESTIONS.some((question) => line.endsWith(question));
  return reply(asksAge ? { ...next, pending: { kind: 'age' } } : next, [line]);
}

function goodbye(state: SbaitsoState): EngineStep {
  const index = (state.cursors.bye ?? 0) % BYE_REPLIES.length;
  const [line, next] = rotate(state, 'bye', BYE_REPLIES);
  const text = withName(line, state.name);
  return index === BYE_REFUSAL_INDEX ? reply(next, [text]) : exit(next, [text, GOOD_BYE]);
}

function crazy(state: SbaitsoState): EngineStep {
  const pool = [...CRAZY_REPLIES, CRAZY_PARITY_JOKE];
  const [line, next] = rotate(state, 'crazy', pool);
  if (line === CRAZY_PARITY_JOKE) return parity(next, [withName(line, state.name)]);
  return reply(next, [line]);
}

function shortInput(state: SbaitsoState): EngineStep {
  const pool = [...SHORT_INPUT, SHORT_INPUT_BIG, SHORT_INPUT_COLOR];
  const [line, next] = rotate(state, 'short', pool);
  // The original's `2 and `3 control codes: big text and a colour change (LIKELY).
  if (line === SHORT_INPUT_BIG) return reply(next, [line], { settings: { width: 40 } });
  if (line === SHORT_INPUT_COLOR) {
    return reply(next, [line], { settings: { background: (state.settings.background + 1) % 8 } });
  }
  return reply(next, [line]);
}

/** Answer a question the previous turn asked, or fall through to normal handling. */
function answerPending(state: SbaitsoState, raw: string, text: string): EngineStep | null {
  const cleared: SbaitsoState = { ...state, pending: NONE };
  switch (state.pending.kind) {
    case 'help':
      if (/^M$/i.test(text)) return showHelp(cleared, state.pending.page === 1 ? 2 : 3);
      return text ? processInput(cleared, raw) : noop(cleared);
    case 'value':
      return text ? applyValue(cleared, state.pending.command, text) : noop(cleared);
    case 'param':
      return text ? applyParam(cleared, text) : noop(cleared);
    case 'age': {
      const age = /\d+/.exec(text);
      if (age) return ageReply(cleared, Number(age[0]));
      // More bad language instead of an age: an age reply, not the next warning (CONFIRMED (DOSBox)).
      if (matchesWordList(normalise(text).split(' '), PROFANITY_WORDS)) {
        const [line, next] = rotate(cleared, 'ageNonsense', AGE_NONSENSE);
        return reply(next, [line]);
      }
      return processInput(cleared, raw);
    }
    default:
      return null;
  }
}

/** Single-word and fixed-phrase commands. Returns null if `text` is not one. */
function command(state: SbaitsoState, text: string, plain: string): EngineStep | null {
  if (plain === 'HELP') return showHelp(state, 1);
  if (plain === 'R') return { state, result: { kind: 'repeat', lines: [...state.lastReply] } };
  if (plain === 'AUTHOR') return reply(state, [AUTHOR_REPLY]);

  const say = /^SAY\s+(.+)$/is.exec(text);
  if (say) {
    // PARITY is a special word, so SAY PARITY reaches the parity routine (CONFIRMED).
    if (normalise(say[1]) === 'PARITY') return parity(state);
    const spoken = say[1].trim();
    return { state: { ...state, lastReply: [spoken] }, result: { kind: 'say', text: spoken } };
  }

  const calc = /^CALC\b(.*)$/is.exec(text);
  if (calc) return calcStep(state, calc[1]);

  if (/^SHUT UP\b/.test(plain)) {
    const [line, next] = rotate(state, 'shutUp', SHUT_UP_REPLIES);
    return reply(next, [line], { stopSpeech: true });
  }

  if (/^(GOOD ?BYE|BYE( BYE)?)( (DOCTOR|DR)( SBAITSO)?| SBAITSO)?$/.test(plain)) return goodbye(state);

  // No response group exists for a bare QUIT or EXIT; going straight to the
  // menu follows the bertrandom port (UNVERIFIED for the original).
  if (plain === 'QUIT' || plain === 'EXIT') return exit(state, [GOOD_BYE]);

  return null;
}

/** CALC output keeps its mixed case and `Computer:` label, so it is built here rather than by `reply`. */
function calcStep(state: SbaitsoState, expr: string): EngineStep {
  const { lines, speak } = calcReply(expr);
  return { state: { ...state, lastReply: speak }, result: { kind: 'reply', lines, speak } };
}

// ---------------------------------------------------------------------------
// Entry point

/**
 * Handle one line of user input. Pure: returns the next state and what the
 * caller should do. Never throws for any string input.
 */
export function processInput(state: SbaitsoState, rawInput: string): EngineStep {
  const raw = rawInput.replace(/[\r\n]+$/, '');
  const text = raw.trim();

  if (state.pending.kind !== 'none') {
    const answered = answerPending(state, raw, text);
    if (answered) return answered;
  }

  // Dot commands only count in the first column (CONFIRMED rule).
  if (raw.startsWith('.')) return dotCommand(state, raw);
  if (text.startsWith('.')) {
    return { state, result: { kind: 'setting', lines: [DOT_MESSAGES.notFirstColumn], settings: {} } };
  }

  if (!text) return emptyEnter(state);
  let current: SbaitsoState = state.emptyCount === 0 ? state : { ...state, emptyCount: 0 };

  const plain = normalise(text);
  const words = plain.split(' ').filter(Boolean);

  const handled = command(current, text, plain);
  if (handled) return handled;

  if (matchesWordList(words, PROFANITY_WORDS)) return profanity(current);

  if (matchesWordList(words, SEXUAL_WORDS)) {
    const [lecture, next] = rotate(current, 'anatomy', ANATOMY_LECTURES);
    return reply({ ...next, pending: { kind: 'age' } }, [lecture, AGE_QUESTION]);
  }

  // WHAT IS <arithmetic> is evaluated like CALC; WHAT IS <anything else> is conversation.
  const whatIs = /^WHAT\s+IS\s+(.+)$/is.exec(text);
  if (whatIs && looksArithmetic(whatIs[1])) return calcStep(current, whatIs[1]);

  // Repeated input, compared after normalising case and punctuation.
  if (plain === current.lastInput) {
    const repeatCount = current.repeatCount + 1;
    current = { ...current, repeatCount };
    const [line, next] =
      repeatCount === 1 ? rotate(current, 'repeat1', REPEAT_TIER_1) : rotate(current, 'repeat2', REPEAT_TIER_2);
    return reply(next, [line]);
  }
  current = { ...current, lastInput: plain, repeatCount: 0 };

  // CRAZY aimed at the doctor (or on its own) gets the laughing replies and,
  // eventually, the 1 + 1 = 3 joke. "I am crazy about her" is left to the model.
  if (/^CRAZY$|\b(YOU|YOU'RE|YOURE|U|SBAITSO|DOCTOR|DR)\b.*\bCRAZY\b/.test(plain)) return crazy(current);

  if (text.length < SHORT_INPUT_LENGTH && !words.some((word) => SHORT_KEYWORDS.some((k) => word.startsWith(k)))) {
    return shortInput(current);
  }

  if (isGarbage(text)) {
    const [line, next] = rotate(current, 'garbage', GARBAGE_INPUT);
    return reply(next, [line]);
  }

  return { state: current, result: { kind: 'model', message: text } };
}
