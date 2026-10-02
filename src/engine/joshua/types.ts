/**
 * Types for the local JOSHUA (WOPR) engine.
 *
 * Like the Dr. Sbaitso engine it is pure: no React, no DOM, no network, no
 * clock. Randomness (which of several equally good tic-tac-toe moves to play)
 * comes from a seed carried in the state.
 */
import type { Board, Outcome, SelfPlayGame } from './tictactoe';

export type WarSide = 'UNITED STATES' | 'SOVIET UNION';

/** Session facts the model needs; sent as a `[SESSION: ...]` line (see `joshuaSessionTag`). */
export interface JoshuaFlags {
  /** How JOSHUA addresses the user. `PROFESSOR FALKEN` unless the user gave a name. */
  user: string;
  /** Set by the zero-player tic-tac-toe lesson. Unlocks "the only winning move". */
  learnedFutility: boolean;
  /** The game in progress, if any (a title from `GAME_LIST`, or `TIC-TAC-TOE`). */
  game: string | null;
  /** The side chosen for GLOBAL THERMONUCLEAR WAR. */
  side: WarSide | null;
}

/** What the engine is waiting for, if the previous turn asked a question. */
export type JoshuaPending =
  | { kind: 'none' }
  /** "WOULDN'T YOU PREFER A GOOD GAME OF CHESS?" was asked. */
  | { kind: 'chess-offer' }
  /** The side menu is showing. */
  | { kind: 'side' }
  /** "NUMBER OF PLAYERS:" was asked. */
  | { kind: 'players' }
  /** A tic-tac-toe game against the user is running; the user (X) is to move. */
  | { kind: 'ttt'; board: Board };

export interface JoshuaState {
  /** False until something is typed at `LOGON:`. */
  readonly loggedOn: boolean;
  readonly user: string;
  readonly learnedFutility: boolean;
  readonly game: string | null;
  readonly side: WarSide | null;
  /** Seed for the next random choice. */
  readonly seed: number;
  readonly pending: JoshuaPending;
}

/**
 * What the caller should do with one line of input. `lines` are printed in
 * upper case; `speak` (where present) are the lines to send to TTS.
 */
export type JoshuaResult =
  /** A local answer. */
  | { kind: 'reply'; lines: string[]; speak: string[] }
  /** Still logged off: print `lines` (ending with `LOGON:`). Not spoken. */
  | { kind: 'logon'; lines: string[] }
  /** A listing (game list, help text). Printed, not spoken. */
  | { kind: 'list'; lines: string[] }
  /**
   * A tic-tac-toe turn. `board` is the position after the user's move and
   * JOSHUA's reply; `lines` include the drawn board. `outcome` is set when
   * the game ended on this turn.
   */
  | { kind: 'board'; board: Board; outcome: Outcome; lines: string[]; speak: string[] }
  /**
   * The zero-player lesson. `games` are the self-play games (for an animated
   * board, if the UI wants one); `lines` are the full printout, ending with
   * `conclusion`, which is also what should be spoken.
   */
  | { kind: 'lesson'; games: SelfPlayGame[]; lines: string[]; speak: string[]; conclusion: string[] }
  /**
   * Open conversation: send `modelMessage` (the `[SESSION: ...]` line plus
   * the user's `message`) to the model.
   */
  | { kind: 'model'; message: string; modelMessage: string; flags: JoshuaFlags };

export interface JoshuaStep {
  state: JoshuaState;
  result: JoshuaResult;
}
