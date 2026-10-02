/**
 * Fixed screens of the original: name prompt and its validation, the v2.20
 * greeting, the help pages and the end-of-session menu.
 * Sources: ref-docs/01-history-and-behavior.md and ref-docs/03-screen-and-ui.md.
 */
import type { ExitChoice, NameValidation } from './types';

/** Mixed case, as on the v2.20 screen (CONFIRMED). */
export const NAME_PROMPT = 'Please enter your name ...';

/**
 * Longest accepted name. The original rejects long names with "NAME TOO LONG"
 * (CONFIRMED) but its limit is not documented; 20 is a guess (UNVERIFIED).
 */
export const MAX_NAME_LENGTH = 20;

/** On-screen text for a rejected name (CONFIRMED strings). */
export const NAME_ERROR_TEXT = {
  'letters-only': 'Enter alphabets only',
  'too-long': 'NAME TOO LONG',
  empty: NAME_PROMPT,
} as const;

/** True if one typed character may go into a name: a letter or a space. */
export function isNameCharAllowed(char: string): boolean {
  return /^[A-Za-z ]$/.test(char);
}

/**
 * The original accepts letters and spaces only, and upper-cases the name for
 * use in replies. Runs of spaces collapse to one.
 */
export function validateName(raw: string): NameValidation {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length === 0) return { ok: false, reason: 'empty' };
  if (!/^[A-Za-z ]+$/.test(name)) return { ok: false, reason: 'letters-only' };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, reason: 'too-long' };
  return { ok: true, name: name.toUpperCase() };
}

/**
 * The v2.20 greeting exactly as printed: one-space indent, two spaces after the
 * comma in the first line, a blank line after it and before the last line, and
 * the MEMORY line ending in a comma (CONFIRMED, ref-docs/03 step 3).
 */
export function greetingLines(name: string): string[] {
  return [
    ` HELLO ${name.toUpperCase()},  MY NAME IS DOCTOR SBAITSO.`,
    '',
    ' I AM HERE TO HELP YOU.',
    ' SAY WHATEVER IS IN YOUR MIND FREELY,',
    ' OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.',
    ' MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,',
    '',
    ' SO, TELL ME ABOUT YOUR PROBLEMS.',
  ];
}

/** The greeting as speech: one entry per printed sentence, no indent, no blanks. */
export function greetingSpeech(name: string): string[] {
  return greetingLines(name)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** The end-of-session menu (CONFIRMED string, including the trailing dots). */
export function exitMenuText(): string {
  return '<C>ontinue  <N>ew patient  <Q>uit  .....';
}

/**
 * Map a key pressed at the exit menu to its action. C resumes the session; N
 * wipes it and returns to the name prompt; Q quits. Anything else is ignored.
 */
export function resolveExitChoice(key: string): ExitChoice | null {
  switch (key.trim().toUpperCase()) {
    case 'C':
      return 'continue';
    case 'N':
      return 'new';
    case 'Q':
      return 'quit';
    default:
      return null;
  }
}

/** What HELP prints in 40-column mode (CONFIRMED). */
export const HELP_40_COLUMNS = 'NO HELP FOR 40 COLUMNS. TRY:  .WIDTH 80';

/** Prompt at the foot of help pages 1 and 2 (CONFIRMED). */
export const HELP_MORE = 'Hit <M> now for More HELPs';

/**
 * The three help pages. Structure follows the original (page 1: what it is and
 * the dot commands; page 2: hints; page 3: keywords). Short phrases the
 * original used are kept, original spelling included ("preceeded",
 * "speical"); the rest is paraphrased.
 */
export function helpPages(): string[][] {
  return [
    [
      'DOCTOR SBAITSO - Sound Blaster Acting Intelligent Text to Speech Operator',
      '',
      'Dr. Sbaitso attempts to fake intelligence. Speech was added to give him',
      'more life. Type whatever is on your mind and press <Enter>.',
      'Enter <R> to listen to the last response.',
      '',
      'Dot Commands are preceeded with a dot on the first column:',
      '  .QUIT             - quit the program',
      '  .TONE    t        - 0=Bass and 1=Treble tone',
      '  .VOLUME  v        - 0-9, 0 for lowest volume',
      '  .PITCH   p        - 0-9, 0 for lowest pitch',
      '  .SPEED   s        - 0-9, 0 for lowest speed',
      '  .PARAM   tvps     - Tone/Volume/Pitch/Speed at once, <D> for defaults',
      '  .ECHO    ON/OFF   - ON will read out what you typed in',
      '  .WIDTH   40 or 80 - set to 40 column screen or 80 column screen',
      '  .COLOR   ce       - background color 0-7, foreground color 0-F',
      '  .MASTER  m        - 0-15 for Master volume',
      '',
      'There are other commands, but you get more fun exploring them yourself.',
      HELP_MORE,
    ],
    [
      'HINTS',
      '',
      'Talk to him about your friends, school, family, love, money, dreams or',
      'emotions. They may arouse his speical interest.',
      '',
      'CALC <expression>  - he will work out simple arithmetic, e.g. CALC 6/3',
      'WHAT IS 2 + 2      - works too',
      'SAY <anything>     - he will say anything you ask him to SAY',
      'AUTHOR             - who wrote him',
      'BYE                - end the session',
      '',
      'Bad language can make him go haywire.',
      HELP_MORE,
    ],
    [
      'SOME WORDS HE KNOWS',
      '',
      'HOW ARE YOU   WHO IS   WHERE IS   HOW TO   I LOVE YOU   YOUR NAME',
      'CAN YOU   CAN I   YOU ARE   I DON\'T   I FEEL   WHY DON\'T YOU',
      'WHY CAN\'T I   ARE YOU   I CAN\'T   I AM   I WANT   I HAVE',
      'WHAT IS   WHY   SORRY   HELLO   MAYBE   ALWAYS   THINK   YES   NO',
      'PLEASE   SHUT   CRAZY   SILLY   STUPID   CLEVER   SMART   THANK   BYE',
    ],
  ];
}
