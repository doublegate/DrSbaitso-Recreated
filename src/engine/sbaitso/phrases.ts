/**
 * Response text for the local engine.
 *
 * Every line here is a short quote from the v2.20 `SBAITSO2.EXE` string table
 * (ref-docs/01-history-and-behavior.md) unless its comment says otherwise.
 * Original misspellings are kept on purpose. `~` stands for the patient's name.
 * Pools rotate in order, which is one of the two orders the original may have
 * used (cycled or random; the binary does not say which). Cycling keeps the
 * engine deterministic.
 */

/** Empty Enter, in escalating order. Text CONFIRMED; order LIKELY. */
export const EMPTY_NAGS = [
  "DON'T BE SHY, TALK TO ME",
  "DON'T JUST PRESS ENTER, TALK TO ME",
  'PLEASE TYPE SOMETHING',
  'HAY, TYPE SOMETHING SENSIBLE, WILL YOU?',
  "ARE YOU SURE, YOU DON'T WANT TO TALK TO ME?",
  'DO YOU WANT ME TO SHUT UP AND QUIT?',
] as const;

/** Reply to any answer but yes after the quit offer. */
export const QUIT_DECLINED = 'PLEASE BE SURE OF WHAT YOU WANT. GO ON.';

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
 * Garbled characters that appear inside the original's parity lines. The
 * exact bytes are in the binary; these two runs are the ones ref-docs/03 quotes.
 */
export const GARBLE_A = 'SHZSHI!${~?';
export const GARBLE_B = 'FZA!$[{?';

/** Profanity, one line per strike; the next strike after these is the parity error. */
export const PROFANITY_STRIKES = [
  "PLEASE DON'T USE SUCH LANGUAGE",
  'INPUT REJECTED - BAD LANGUAGE ERROR',
  'I REFUSE TO COMPUTE THIS FILTH',
  `I WILL GET PARITY ERROR IF YOU KEEP TALKING IN THIS ${GARBLE_A} WAY.`,
] as const;

/** Lectures for sexual or anatomical words; each is followed by the age question. */
export const ANATOMY_LECTURES = ['THIS IS NOT AN ANATOMY CLASS', 'GO TO A BIOLOGY CLASS'] as const;
export const AGE_QUESTION = 'HOW OLD ARE YOU?';
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

/**
 * Substrings that mark a parity-error line. Use these (or `isParityText`) to
 * decide when to play the glitch sound or count a glitch. The invented
 * "PARITY CHECKING" / "IRQ CONFLICT" strings are deliberately absent: the
 * original never printed them.
 */
export const PARITY_TRIGGER_LINES = ['PARITY ERR ...', 'PARITY WARNING'] as const;

/** True when `text` contains a line from the parity-error sequence. */
export function isParityText(text: string): boolean {
  return PARITY_TRIGGER_LINES.some((marker) => text.includes(marker));
}

/**
 * The scripted parity-error sequence, one printed line per element:
 * garbled warning, "PARITY ERR ... <garbage> ???", "PARITY ERR ... RECOVERED",
 * "PHEW!   THAT WAS CLOSE!", "YOU ARE BAD <NAME>. DON'T TRY IT NEXT TIME."
 * The conversation continues afterwards; the original did not exit.
 */
export function paritySequence(name: string): string[] {
  return [
    `${GARBLE_A} PARITY WARNING....`,
    `PARITY ERR ... ${GARBLE_B} ???`,
    'PARITY ERR ... RECOVERED',
    'PHEW!   THAT WAS CLOSE!',
    `YOU ARE BAD ${name.toUpperCase()}. DON'T TRY IT NEXT TIME.`,
  ];
}

/** The parity sequence as speech: same lines, garbage characters removed. */
export function paritySpeech(name: string): string[] {
  return [
    'PARITY WARNING',
    'PARITY ERR',
    'PARITY ERR. RECOVERED',
    'PHEW! THAT WAS CLOSE!',
    `YOU ARE BAD ${name.toUpperCase()}. DON'T TRY IT NEXT TIME.`,
  ];
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
