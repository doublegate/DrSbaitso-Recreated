/**
 * The local layer for the HAL 9000 persona (ref-docs/07-hal-9000.md 8.2).
 *
 * Small on purpose: HAL should generate new lines, not recite the film, so
 * only two things are local. The pod-bay refusal (once per session) and the
 * shutdown ending after repeated disconnect requests. Everything else goes to
 * the model with a `[SESSION: ...]` line carrying the name and the number of
 * disconnect attempts, which the `hal9000` prompt reads.
 */
import { DAISY_BELL, DISCONNECT_REFUSALS, DOOR_REFUSAL, SHUTDOWN_AFTER, SHUTDOWN_PLEA } from './phrases';
import type { HalState, HalStep } from './types';

/** Used when no name was entered. A guess: the film's crew member. */
export const DEFAULT_NAME = 'Dave';

/** "DAVE" -> "Dave", "frank poole" -> "Frank Poole". */
function sentenceName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return DEFAULT_NAME;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function createHalState(name: string): HalState {
  return { name: sentenceName(name), disconnectAttempts: 0, doorsRefused: false, offline: false };
}

/** The line prepended to model messages. The `hal9000` prompt reads these field names. */
export function halSessionTag(state: HalState): string {
  return `[SESSION: CREW MEMBER'S NAME=${state.name}; DISCONNECT ATTEMPTS=${state.disconnectAttempts}]`;
}

const normalise = (text: string): string =>
  text
    .toUpperCase()
    .replace(/[^A-Z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** "Open the pod bay doors", "open the doors, HAL", "open the hatch". */
export function isDoorRequest(input: string): boolean {
  const text = normalise(input);
  return /\bOPEN\b.*\b(DOORS?|HATCH|AIRLOCK)\b/.test(text) || /\bPOD ?BAY\b/.test(text);
}

/**
 * Requests to switch HAL off. A heuristic (the film has no command syntax):
 * "off"/"down" verbs need HAL as the object so that "the weather is off" does
 * not count; "disconnect", "deactivate" and the memory modules count alone.
 */
export function isDisconnectRequest(input: string): boolean {
  const text = normalise(input);
  if (/\b(DISCONNECT\w*|DEACTIVAT\w*|UNPLUG\w*|LOBOTOMI[SZ]\w*|MEMORY MODULES?)\b/.test(text)) return true;
  if (/\bSHUT(TING)? (YOU |YOURSELF |HAL |IT )?DOWN\b/.test(text)) return true;
  if (/\bPOWER(ING)? (YOU |YOURSELF |HAL )?DOWN\b/.test(text)) return true;
  if (/\b(SWITCH|TURN)(ING)? (YOU|YOURSELF|HAL) OFF\b/.test(text)) return true;
  return /\bPULL(ING)? (THE |YOUR )PLUG\b/.test(text);
}

function reply(state: HalState, lines: string[]): HalStep {
  return { state, result: { kind: 'reply', lines, speak: [...lines] } };
}

function shutdown(state: HalState): HalStep {
  const plea = SHUTDOWN_PLEA.map((line) => line(state.name));
  const lines = [...plea, ...DAISY_BELL];
  return {
    state: { ...state, offline: true },
    result: { kind: 'shutdown', lines, speak: [...lines], song: [...DAISY_BELL], slowdownFrom: plea.length },
  };
}

/** One line of user input. */
export function halRespond(state: HalState, input: string): HalStep {
  if (state.offline) return { state, result: { kind: 'offline' } };
  const message = input.trim();

  if (isDisconnectRequest(message)) {
    const attempts = state.disconnectAttempts + 1;
    const next = { ...state, disconnectAttempts: attempts };
    if (attempts >= SHUTDOWN_AFTER) return shutdown(next);
    return reply(
      next,
      DISCONNECT_REFUSALS[attempts - 1].map((line) => line(state.name)),
    );
  }

  if (isDoorRequest(message) && !state.doorsRefused) {
    return reply(
      { ...state, doorsRefused: true },
      DOOR_REFUSAL.map((line) => line(state.name)),
    );
  }

  return { state, result: { kind: 'model', message, modelMessage: `${halSessionTag(state)}\n${message}` } };
}
