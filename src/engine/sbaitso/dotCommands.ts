/**
 * Dot commands. In the original they must start in the first column ("Dot
 * Commands are preceeded with a dot on the first column", sic). Speech values
 * are single digits; a missing value is prompted for ("Enter pitch number
 * (0-9)") and the range is checked ("Pitch number must be between 0 - 9").
 * Those strings are CONFIRMED for pitch and colour; the same pattern is applied
 * to the other commands (LIKELY). The original prints nothing on success
 * (LIKELY), so successful settings carry no lines.
 */
import { GOOD_BYE } from './phrases';
import type { EngineStep, SbaitsoSettings, SbaitsoState, ValueCommand } from './types';

/** Defaults written by `SBAITSO2.EXE` before it starts the engine (LIKELY, ref-docs/02 section 4). */
export const DEFAULT_SETTINGS: Readonly<SbaitsoSettings> = Object.freeze({
  tone: 0,
  volume: 5,
  pitch: 5,
  speed: 5,
  echo: false,
  // The v2.20 screenshots show a bare `>` prompt, so the `User>` label starts off (LIKELY).
  prompt: false,
  width: 80,
  background: 1,
  foreground: 15,
  // Not documented; full mixer volume is assumed (UNVERIFIED).
  master: 15,
});

export const DOT_MESSAGES = {
  notFirstColumn: 'Dot Commands are preceeded with a dot on the first column',
  // Not in the binary: the original's reaction to an unknown dot command is undocumented.
  unknown: 'Invalid Dot Command, type HELP for the list.',
  paramDigits: 'Need to enter 4 digits, try agian.',
  readNoFile: 'Must supply a filename to read.',
  // The web app has no file system to read from, so every name is "not found".
  readNotFound: 'File not Found',
  width: 'Width must be 40 or 80',
  foreground: 'Foreground color number must be between 0 - 15',
} as const;

interface RangeSpec {
  label: string;
  min: number;
  max: number;
  key: 'tone' | 'volume' | 'pitch' | 'speed' | 'master' | 'background';
}

const RANGES: Record<Exclude<ValueCommand, 'width'>, RangeSpec> = {
  tone: { label: 'Tone', min: 0, max: 1, key: 'tone' },
  volume: { label: 'Volume', min: 0, max: 9, key: 'volume' },
  pitch: { label: 'Pitch', min: 0, max: 9, key: 'pitch' },
  speed: { label: 'Speed', min: 0, max: 9, key: 'speed' },
  master: { label: 'Master volume', min: 0, max: 15, key: 'master' },
  color: { label: 'Color', min: 0, max: 7, key: 'background' },
};

const rangeError = (spec: RangeSpec): string => `${spec.label} number must be between ${spec.min} - ${spec.max}`;

const NONE = { kind: 'none' } as const;

/** A dot-command result: print `lines`, apply `settings` (already applied to the returned state). */
function setting(state: SbaitsoState, lines: string[], settings: Partial<SbaitsoSettings> = {}): EngineStep {
  return {
    state: { ...state, settings: { ...state.settings, ...settings }, pending: NONE },
    result: { kind: 'setting', lines, settings },
  };
}

/** Parse a whole number in [min, max], or null. */
function inRange(text: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
}

/**
 * `.COLOR ce`: background 0-7, then an optional foreground 0-15, either as a
 * second argument (`.COLOR 1 14`) or as a hex digit glued on (`.COLOR 1E`).
 * The foreground form is LIKELY; the background range is CONFIRMED.
 */
function applyColor(state: SbaitsoState, arg: string): EngineStep {
  const parts = arg.split(/\s+/);
  const glued = parts.length === 1 && /^\d[0-9A-F]$/i.test(parts[0]);
  const background = inRange(glued ? parts[0][0] : parts[0], 0, 7);
  if (background === null) return setting(state, [rangeError(RANGES.color)]);
  if (!glued && parts.length === 1) return setting(state, [], { background });
  const foreground = glued ? parseInt(parts[0][1], 16) : parts.length === 2 ? inRange(parts[1], 0, 15) : null;
  if (foreground === null) return setting(state, [DOT_MESSAGES.foreground]);
  return setting(state, [], { background, foreground });
}

/** Apply a value to a one-number dot command (also used to answer its prompt). */
export function applyValue(state: SbaitsoState, command: ValueCommand, arg: string): EngineStep {
  if (command === 'width') {
    if (arg === '40' || arg === '80') return setting(state, [], { width: arg === '40' ? 40 : 80 });
    return setting(state, [DOT_MESSAGES.width]);
  }
  if (command === 'color') return applyColor(state, arg);
  const spec = RANGES[command];
  const value = inRange(arg, spec.min, spec.max);
  if (value === null) return setting(state, [rangeError(spec)]);
  return setting(state, [], { [spec.key]: value });
}

/** The prompt shown when a value is missing. */
function valuePrompt(command: ValueCommand): string {
  if (command === 'width') return 'Enter width (40 or 80)';
  const spec = RANGES[command];
  return `Enter ${spec.label.toLowerCase()} number (${spec.min}-${spec.max})`;
}

/** `.PARAM tvps`: four digits, or `D` for the defaults. */
export function applyParam(state: SbaitsoState, arg: string): EngineStep {
  if (/^D$/i.test(arg)) {
    const { tone, volume, pitch, speed } = DEFAULT_SETTINGS;
    return setting(state, [], { tone, volume, pitch, speed });
  }
  if (!/^\d{4}$/.test(arg)) return setting(state, [DOT_MESSAGES.paramDigits]);
  const [tone, volume, pitch, speed] = [...arg].map(Number);
  if (tone > 1) return setting(state, [rangeError(RANGES.tone)]);
  return setting(state, [], { tone, volume, pitch, speed });
}

/** The current tvps digits, as `.PARAM` shows them. */
function paramDigits(settings: Readonly<SbaitsoSettings>): string {
  return `${settings.tone}${settings.volume}${settings.pitch}${settings.speed}`;
}

function onOff(state: SbaitsoState, arg: string, key: 'echo' | 'prompt', name: string): EngineStep {
  const value = arg.toUpperCase();
  if (value === 'ON' || value === 'OFF') return setting(state, [], { [key]: value === 'ON' });
  // Usage text is not in the binary.
  return setting(state, [`Use .${name} ON or .${name} OFF`]);
}

const VALUE_COMMANDS: Record<string, ValueCommand> = {
  TONE: 'tone',
  VOLUME: 'volume',
  PITCH: 'pitch',
  SPEED: 'speed',
  MASTER: 'master',
  COLOR: 'color',
  WIDTH: 'width',
};

/** Handle a line that starts with a dot in column 1. */
export function dotCommand(state: SbaitsoState, raw: string): EngineStep {
  const match = /^\.([A-Za-z]+)\s*(.*)$/s.exec(raw.trim());
  if (!match) return setting(state, [DOT_MESSAGES.unknown]);
  const command = match[1].toUpperCase();
  const arg = match[2].trim();

  const valueCommand = VALUE_COMMANDS[command];
  if (valueCommand) {
    if (arg) return applyValue(state, valueCommand, arg);
    const step = setting(state, [valuePrompt(valueCommand)]);
    return { ...step, state: { ...step.state, pending: { kind: 'value', command: valueCommand } } };
  }

  switch (command) {
    case 'QUIT': {
      // GOOD BYE <NAME>, spoken, then the C/N/Q menu; it does not drop to DOS (CONFIRMED (DOSBox)).
      const lines = [`${GOOD_BYE} ${state.name}`.trim()];
      return { state: { ...state, pending: NONE, lastReply: lines }, result: { kind: 'exit', lines } };
    }
    case 'PARAM': {
      if (arg) return applyParam(state, arg);
      const step = setting(state, [
        `Current Speech Parameters settings are : ${paramDigits(state.settings)}`,
        'Enter 4 digits (tvps), <D> for defaults, <Enter> for no change',
      ]);
      return { ...step, state: { ...step.state, pending: { kind: 'param' } } };
    }
    case 'ECHO':
      return onOff(state, arg, 'echo', 'ECHO');
    case 'PROMPT':
      return onOff(state, arg, 'prompt', 'PROMPT');
    case 'READ':
      return setting(state, [arg ? DOT_MESSAGES.readNotFound : DOT_MESSAGES.readNoFile]);
    default:
      return setting(state, [DOT_MESSAGES.unknown]);
  }
}
