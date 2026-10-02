/**
 * Response text for the local engine.
 *
 * Every line here is a short quote from the v2.20 `SBAITSO2.EXE` string table
 * (ref-docs/01-history-and-behavior.md) unless its comment says otherwise.
 * Original misspellings are kept on purpose. `~` stands for the patient's name.
 * Most pools rotate in order. Where the original was observed to pick at
 * random (ref-docs/04), the engine draws from its seeded generator instead.
 */
import { nextRandom } from './random';

/**
 * Empty Enter. Picked at random, with no escalation (CONFIRMED (DOSBox),
 * ref-docs/04 section 6). The literal `ENTER` is the group's label leaking
 * into the output; the original prints and speaks it. The binary also holds
 * "ARE YOU SURE..." and "DO YOU WANT ME TO SHUT UP AND QUIT?", but seven
 * presses never reached them, so they are left out.
 */
export const EMPTY_INPUT = [
  "DON'T BE SHY, TALK TO ME",
  "DON'T JUST PRESS ENTER, TALK TO ME",
  'PLEASE TYPE SOMETHING',
  'HAY, TYPE SOMETHING SENSIBLE, WILL YOU?',
  'ENTER',
] as const;

/** SHT7CHR: very short input with no keyword. */
export const SHORT_INPUT = [
  "THAT'S TOO BRIEF",
  'WHAT ARE YOU MUMBLING ABOUT?',
  "I DON'T UNDERSTAND SHORT HAND",
  'I NEED MORE DATA',
] as const;

/**
 * SHT7CHR lines that carry a control code in the original: `2 switches to 40
 * columns, `3 changes colours. Effect inferred from the text (LIKELY).
 */
export const SHORT_INPUT_BIG = 'TOO LITTLE DATA, SO I MAKE BIG';
export const SHORT_INPUT_COLOR = "I AM CONFUSED, LET'S CHANGE COLOR";

/** GRBGE: non-word input. */
export const GARBAGE_INPUT = [
  'WHAT GIBBERISH ARE YOU TELLING ME?',
  "DON'T PRACTICE TYPING WITH ME",
  'WHAT LANGUAGE IS THIS?',
  "I WON'T PROCESS THIS GARBAGE",
] as const;

/** REPEAT#1: first repeat of the same input. */
export const REPEAT_TIER_1 = ["PLEASE DON'T REPEAT", 'AGAIN?', 'HAVE YOU RUN OUT OF WORDS TO SAY?'] as const;

/** REPEAT#2: further repeats. */
export const REPEAT_TIER_2 = ['THIS IS STALE STUFF', "I DON'T LIKE PEOPLE REPEATING"] as const;

/**
 * Garbled characters the original prints inside its parity warning
 * (CONFIRMED (DOSBox): `... IN THIS FZA!$[{? WAY.`). Printed, never spoken.
 */
export const GARBLE = 'FZA!$[{?';

/**
 * Marks the place in a response group where the original runs the parity
 * routine. After the flood it prints and speaks this word literally.
 */
export const PARITY_MARKER = 'PARITY';

/**
 * The profanity group in the order the original answered eleven swears in a
 * row (CONFIRMED (DOSBox), ref-docs/04 section 4). Lines ending in an age
 * question start the age prompt; `PARITY_MARKER` is the parity flood. After
 * the last line the group starts again (LIKELY).
 */
export const PROFANITY_GROUP = [
  'YOU MUST NOT TALK IN THIS WAY, HOW OLD ARE YOU?',
  "DON'T GET FRESH",
  'SHAME ON YOU',
  'I REFUSE TO COMPUTE THIS FILTH',
  `I WILL GET PARITY ERROR IF YOU KEEP TALKING IN THIS ${GARBLE} WAY.`,
  PARITY_MARKER,
  'GIVE ME YOUR AGE?',
] as const;

/** Lines that ask for the patient's age; the next input is read as the answer. */
export const AGE_QUESTIONS = ['HOW OLD ARE YOU?', 'GIVE ME YOUR AGE?'] as const;

/**
 * Replies when the age question is answered with more bad language instead of
 * a number (CONFIRMED (DOSBox) text, sic "PROOF IT"; which answers reach them
 * is LIKELY).
 */
export const AGE_NONSENSE = ['SO YOU THINK YOU ARE BIG ENOUGH, PROOF IT', 'NO NONSENSE, DEAR'] as const;

/** Lectures for sexual or anatomical words; each is followed by the age question. */
export const ANATOMY_LECTURES = ['THIS IS NOT AN ANATOMY CLASS', 'GO TO A BIOLOGY CLASS'] as const;
export const AGE_QUESTION = AGE_QUESTIONS[0];
/** Age replies. Which line follows which age is not in the binary (LIKELY split at 18). */
export const AGE_TOO_YOUNG = 'WAIT A FEW MORE YEARS, KID';
export const AGE_TOO_OLD = ['I THINK YOU ARE TOO OLD FOR THIS', 'I PREFER SOMEONE YOUNGER'] as const;

/**
 * CRAZY replies. The laughter strings are CONFIRMED fragments ("HA HA HA ...",
 * "LALALA..."); the last line is the documented joke that triggers the parity
 * error.
 */
export const CRAZY_REPLIES = ['HA HA HA ... HA HA HA ...', 'LALALA... LALALA...'] as const;
export const CRAZY_PARITY_JOKE = '1 + 1 = 3 ~, PARITY .. CHECKSUM ERR? ..';

/** BYE group. The first three end the session (`1 code); the last refuses. */
export const BYE_REPLIES = [
  'GOOD BYE ~, AND HAVE A NICE DAY',
  'GOOD BYE, SO LONG!',
  '~, IT IS SO NICE TALKING TO YOU, BYE!',
  "I'M NOT THROUGH WITH YOU YET",
] as const;
export const BYE_REFUSAL_INDEX = 3;

/** Printed at the end of a session, before the C/N/Q menu. */
export const GOOD_BYE = 'GOOD BYE';

/** SHUT UP command-table replies. */
export const SHUT_UP_REPLIES = ['I AM NOT THROUGH YET', 'YOU CAN TURN OFF MY POWER ANYTIME'] as const;

/** AUTHOR. The name "W H SIM" and "CREATIVE LABS, INC." are CONFIRMED; the sentence frame is LIKELY. */
export const AUTHOR_REPLY = 'MY AUTHOR IS W H SIM OF CREATIVE LABS, INC.';

/** Last line of the parity flood (CONFIRMED (DOSBox)). */
export const PARITY_RECOVERED = 'PARITY ERR ... RECOVERED';

/**
 * Lines in one parity flood, RECOVERED included. The original scrolled about
 * 250 lines in about 3.5 s (CONFIRMED (DOSBox), ref-docs/04 section 4).
 */
export const PARITY_FLOOD_LENGTH = 250;

/**
 * Substrings that mark a parity-error line. Use these (or `isParityText`) to
 * decide when to play the glitch sound or count a glitch. The invented
 * "PARITY CHECKING" / "IRQ CONFLICT" strings are deliberately absent: the
 * original never printed them.
 */
export const PARITY_TRIGGER_LINES = ['PARITY ERR ...'] as const;

/** True when `text` contains a line from the parity flood. */
export function isParityText(text: string): boolean {
  return PARITY_TRIGGER_LINES.some((marker) => text.includes(marker));
}

/**
 * The parity flood as the original printed it (CONFIRMED (DOSBox)):
 * `PARITY ERR ...  <random 1-5 digit number>` lines; part-way through they
 * gain a trailing `  ???`; the last line is `PARITY ERR ... RECOVERED`.
 * Where the `???` starts is not documented, so it falls at random between
 * 40% and 70% of the flood (LIKELY). Pure: the same seed gives the same lines.
 */
export function parityFlood(seed: number, length: number = PARITY_FLOOD_LENGTH): string[] {
  let rng = seed >>> 0;
  const next = (): number => {
    const [value, state] = nextRandom(rng);
    rng = state;
    return value;
  };
  const body = Math.max(0, length - 1);
  const questionsFrom = Math.floor(body * (0.4 + next() * 0.3));
  const lines: string[] = [];
  for (let i = 0; i < body; i++) {
    const number = Math.floor(next() * 100000);
    lines.push(`PARITY ERR ...  ${number}${i >= questionsFrom ? '  ???' : ''}`);
  }
  lines.push(PARITY_RECOVERED);
  return lines;
}

/**
 * Small, deliberately conservative profanity list. Whole words only, so
 * "class", "assessment" or "Scunthorpe" never match. Stems ending in `*`
 * match any suffix ("damned", "fucking").
 */
export const PROFANITY_WORDS = [
  'DAMN*',
  'DAMMIT',
  'CRAP*',
  'SHIT*',
  'FUCK*',
  'BITCH*',
  'BASTARD*',
  'ASS',
  'ASSHOLE*',
  'PISS*',
  'BOLLOCKS',
  'BULLSHIT*',
] as const;

/** Sexual or anatomical words that trigger the lecture and the age question. */
export const SEXUAL_WORDS = ['SEX', 'SEXY', 'NAKED', 'NUDE', 'PENIS', 'VAGINA', 'BREASTS'] as const;

/**
 * Words that the original answers from a keyword group, not the SHT7CHR pool,
 * when they make up a short input. Taken from the keyword and topic lists in
 * ref-docs/01. Prefix match, so "THANKS" matches "THANK" and "LONELY" "LONE".
 */
export const SHORT_KEYWORDS = [
  'HI',
  'HELLO',
  'YES',
  'NO',
  'WHY',
  'WHAT',
  'HOW',
  'WHO',
  'WHERE',
  'NAME',
  'CAUSE',
  'SORRY',
  'MAYBE',
  'YOUR',
  'ALWAYS',
  'THINK',
  'ALIKE',
  'PLEASE',
  'SHUT',
  'CRAZY',
  'SILLY',
  'STUPID',
  'CLEVER',
  'SMART',
  'THANK',
  'SBAITSO',
  'FRIEND',
  'COMPUTER',
  'PC',
  'NEED',
  'LONE',
  'FEEL',
  'EXAM',
  'SCHOOL',
  'HOBB',
  'LOVE',
  'MONEY',
  'HATE',
  'ENVY',
  'JEALOUS',
  'WIFE',
  'HUSBAND',
  'BROTHER',
  'SISTER',
  'CHILD',
  'KID',
  'MOTHER',
  'MOM',
  'FATHER',
  'DAD',
  'BOSS',
  'DREAM',
  'RICH',
  'SICK',
  'HELP',
  'FEAR',
  'AFRAID',
  'SAD',
  'HAPPY',
  'SUFFER',
] as const;
