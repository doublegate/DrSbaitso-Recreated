/**
 * Types for the local Dr. Sbaitso conversation engine.
 *
 * The engine is pure: no React, no DOM, no network, no clock and no global
 * random source. Randomness comes from a seeded generator carried in the
 * state (`rng`). Every function takes a state and returns a new one, so the
 * caller owns the state (for example in a React ref) and the engine can be
 * tested exhaustively.
 */

/** The settings the original's dot commands change. */
export interface SbaitsoSettings {
  /** `.TONE`: 0 = bass, 1 = treble. */
  tone: number;
  /** `.VOLUME`: 0-9, 0 lowest. */
  volume: number;
  /** `.PITCH`: 0-9, 0 lowest. */
  pitch: number;
  /** `.SPEED`: 0-9, 0 slowest. */
  speed: number;
  /** `.ECHO ON|OFF`: speak what the user typed. */
  echo: boolean;
  /** `.PROMPT ON|OFF`: show the `User>` label on input lines. */
  prompt: boolean;
  /** `.WIDTH 40|80`: text columns. */
  width: 40 | 80;
  /** `.COLOR c`: background colour, DOS palette index 0-7. */
  background: number;
  /** `.COLOR ce`: foreground colour, DOS palette index 0-15. */
  foreground: number;
  /** `.MASTER`: mixer master volume, 0-15. */
  master: number;
}

/** Commands that take one number and prompt for it when it is missing. */
export type ValueCommand = 'tone' | 'volume' | 'pitch' | 'speed' | 'master' | 'color' | 'width';

/** What the engine is waiting for, if the previous turn asked a question. */
export type Pending =
  | { kind: 'none' }
  /** A help page was shown; `M` shows the next one. */
  | { kind: 'help'; page: 1 | 2 }
  /** A dot command was typed without its value. */
  | { kind: 'value'; command: ValueCommand }
  /** `.PARAM` was typed without its four digits. */
  | { kind: 'param' }
  /** "HOW OLD ARE YOU?" was asked. */
  | { kind: 'age' };

export interface SbaitsoState {
  /** Patient name, upper case, as typed at the name prompt. */
  readonly name: string;
  readonly settings: Readonly<SbaitsoSettings>;
  /** The last thing the doctor said, for `R`. */
  readonly lastReply: readonly string[];
  /** The last conversational input, normalised, for repeat detection. */
  readonly lastInput: string;
  /** How many times in a row `lastInput` has been repeated. */
  readonly repeatCount: number;
  /** Consecutive empty Enters. */
  readonly emptyCount: number;
  /** Position in the profanity response group (the next line to use). */
  readonly profanityStrikes: number;
  /** Rotation position of each response pool. */
  readonly cursors: Readonly<Record<string, number>>;
  readonly pending: Pending;
  /**
   * Seeded random state (32-bit). The original picks some replies at random
   * (empty Enter, the parity flood's numbers); a seed keeps that reproducible.
   */
  readonly rng: number;
}

/**
 * What the caller should do with one line of user input.
 *
 * `lines` are printed; `speak` (where present) are spoken. They differ when a
 * printed line is not meant for the speech synthesiser (labels, garbage
 * characters).
 */
export type EngineResult =
  /** A local answer in the doctor's voice. `settings` carries a side effect (40 columns, colour). */
  | {
      kind: 'reply';
      lines: string[];
      speak: string[];
      settings?: Partial<SbaitsoSettings>;
      /** Stop any speech in progress before answering (SHUT UP). */
      stopSpeech?: boolean;
    }
  /** Open conversation: send `message` to the model. */
  | { kind: 'model'; message: string }
  /**
   * The parity-error routine. Print and speak `lead` (if any), then print
   * `flood` very fast (about 250 lines in 3.5 s) with the falling buzz tone,
   * then print and speak `lines` (the literal `PARITY`).
   */
  | { kind: 'parity'; lead: string[]; leadSpeak: string[]; flood: string[]; lines: string[]; speak: string[] }
  /** A help page. `more` means `M` will show another. Printed, not spoken. */
  | { kind: 'help'; page: 1 | 2 | 3; lines: string[]; more: boolean }
  /** A dot command. Apply `settings`; print `lines` (prompts and errors), do not speak them. */
  | { kind: 'setting'; lines: string[]; settings: Partial<SbaitsoSettings> }
  /** `R`: speak `lines` again (empty if nothing was said yet). */
  | { kind: 'repeat'; lines: string[] }
  /** `SAY <text>`: speak `text` verbatim instead of answering. */
  | { kind: 'say'; text: string }
  /**
   * End of session. Print and speak `lines` (none for a bare QUIT), then show
   * `exitMenuText()` on the next row and wait for C/N/Q (see
   * `resolveExitChoice`). Every route, `.QUIT` included, goes through the menu
   * (CONFIRMED (DOSBox)).
   */
  | { kind: 'exit'; lines: string[] }
  /** Nothing to do (a prompt was dismissed with Enter). */
  | { kind: 'noop' };

export interface EngineStep {
  state: SbaitsoState;
  result: EngineResult;
}

export type NameValidation =
  | { ok: true; name: string }
  | { ok: false; reason: 'letters-only' | 'too-long' | 'empty' };

export type ExitChoice = 'continue' | 'new' | 'quit';
