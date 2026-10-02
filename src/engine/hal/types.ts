/**
 * Types for the local HAL 9000 layer. Pure like the other engines: no React,
 * DOM, network, clock or randomness (nothing here needs a random choice).
 */

export interface HalState {
  /** The crew member's name as HAL says it ("Dave"). */
  readonly name: string;
  /** Disconnect or shutdown requests so far. */
  readonly disconnectAttempts: number;
  /** The canned pod-bay refusal has been used (one per session). */
  readonly doorsRefused: boolean;
  /** HAL has been shut down; nothing more is said. */
  readonly offline: boolean;
}

/** `lines` are printed (sentence case); `speak` is what goes to TTS. */
export type HalResult =
  /** A local reply in HAL's voice. */
  | { kind: 'reply'; lines: string[]; speak: string[] }
  /** Open conversation: send `modelMessage` (session line plus `message`) to the model. */
  | { kind: 'model'; message: string; modelMessage: string }
  /**
   * The deactivation ending. Print and speak `lines` in order. From
   * `lines[slowdownFrom]` on (the song, `song`) apply the progressive
   * slow-down and pitch drop (ref-docs/07 8.4); the caller may start the
   * ramp earlier. After this HAL is offline.
   */
  | { kind: 'shutdown'; lines: string[]; speak: string[]; song: string[]; slowdownFrom: number }
  /** HAL is shut down: show nothing (or offer a restart). */
  | { kind: 'offline' };

export interface HalStep {
  state: HalState;
  result: HalResult;
}
