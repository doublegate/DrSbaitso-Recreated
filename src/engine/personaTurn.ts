/**
 * Routes one Enhanced-mode turn through the persona's local engine.
 *
 * Each engine decides what happens; this module turns its result into a plan
 * the UI executes: lines answered locally, a model request (with how to clean
 * the reply), input to ignore, or "default" for personas without an engine,
 * which keep the plain model pipeline. Pure: engine states are values, and a
 * new `PersonaEngines` is returned rather than the old one changed.
 */
import { createElizaState, elizaRespond, ELIZA_OPENER, type ElizaState } from './eliza';
import { buildParryPrompt, createParryState, finalizeParryLine, parryRespond, type ParryState } from './parry';
import { createHalState, halRespond, type HalState } from './hal';
import { createJoshuaState, joshuaRespond, LOGON_PROMPT, type JoshuaState } from './joshua';
import { createSbaitsoState, processInput, recordReply, type SbaitsoState } from './sbaitso';

export interface PersonaEngines {
  readonly sbaitso?: SbaitsoState;
  readonly eliza?: ElizaState;
  readonly parry?: ParryState;
  readonly hal?: HalState;
  readonly joshua?: JoshuaState;
}

export interface TurnContext {
  /** As entered on the name screen; HAL writes it in sentence case. */
  userName: string;
  /** Seeds PARRY's choices; the caller picks it so sessions differ. */
  seed: number;
}

export type TurnPlan =
  /** Show `lines` (none: speak only); speak `speak` (empty: print only). */
  | {
      kind: 'local';
      lines: string[];
      speak: string;
      endsSession?: boolean;
      /** HAL's shutdown: where (0-1 through the spoken audio) the slow-down begins. */
      slowdownFrom?: number;
    }
  /** Ask the model, then show `finalize(reply)`; show `fallback` if the call fails. */
  | {
      kind: 'model';
      message: string;
      historyKey: string;
      customCharacter?: { name: string; systemInstruction: string };
      finalize: (text: string) => string;
      fallback: string;
      /** Lets the engine record the model's reply (Dr. Sbaitso's R repeats it). */
      onReply?: (engines: PersonaEngines, reply: string) => PersonaEngines;
    }
  /** The persona is no longer listening (HAL after shutdown). */
  | { kind: 'ignore' }
  /** No engine: use the normal model pipeline. */
  | { kind: 'default' };

export function hasEngine(personaId: string): boolean {
  return personaId in ENGINE_KEYS;
}

const local = (lines: string[], speak: string[] = lines, endsSession = false): TurnPlan => ({
  kind: 'local',
  lines,
  speak: speak.filter((l) => l.trim()).join(' '),
  ...(endsSession ? { endsSession } : {}),
});

const asIs = (text: string) => text.trim();

/** Flood lines shown in the Enhanced log before the parity sequence recovers. */
const PARITY_LOG_LINES = 8;

export function personaTurn(
  personaId: string,
  engines: PersonaEngines,
  input: string,
  ctx: TurnContext,
): { engines: PersonaEngines; plan: TurnPlan } {
  switch (personaId) {
    case 'sbaitso': {
      const { state, result } = processInput(engines.sbaitso ?? createSbaitsoState(ctx.userName, ctx.seed), input);
      const next = { ...engines, sbaitso: state };
      switch (result.kind) {
        case 'model':
          return {
            engines: next,
            plan: {
              kind: 'model',
              message: result.message,
              historyKey: 'sbaitso',
              finalize: asIs,
              fallback: '',
              onReply: (current, reply) =>
                current.sbaitso ? { ...current, sbaitso: recordReply(current.sbaitso, reply) } : current,
            },
          };
        case 'reply':
          return { engines: next, plan: local(result.lines, result.speak) };
        case 'say':
          return { engines: next, plan: local([result.text.toUpperCase()], [result.text]) };
        case 'help':
        case 'setting':
          // Printed, not spoken. Dot-command settings only change the classic screen.
          return { engines: next, plan: local(result.lines, []) };
        case 'repeat':
          return { engines: next, plan: local([], result.lines) };
        case 'parity':
          // The flood is about 250 lines; the log shows its start and end.
          return {
            engines: next,
            plan: local(
              [
                ...result.lead,
                ...result.flood.slice(0, PARITY_LOG_LINES),
                '...',
                ...result.flood.slice(-1),
                ...result.lines,
              ],
              [...result.leadSpeak, ...result.speak],
            ),
          };
        case 'exit':
          return { engines: next, plan: local(result.lines) };
        default:
          return { engines: next, plan: { kind: 'ignore' } };
      }
    }
    case 'eliza': {
      const { state, reply } = elizaRespond(engines.eliza ?? createElizaState(), input);
      return { engines: { ...engines, eliza: state }, plan: local([reply]) };
    }
    case 'joshua': {
      const { state, result } = joshuaRespond(engines.joshua ?? createJoshuaState(), input);
      const next = { ...engines, joshua: state };
      switch (result.kind) {
        case 'logon':
        case 'list':
          return { engines: next, plan: local(result.lines, []) };
        case 'reply':
        case 'board':
          return { engines: next, plan: local(result.lines, result.speak) };
        case 'lesson':
          return { engines: next, plan: local(result.lines, result.conclusion) };
        case 'model':
          return {
            engines: next,
            plan: { kind: 'model', message: result.modelMessage, historyKey: 'joshua', finalize: asIs, fallback: '' },
          };
      }
      break;
    }
    case 'hal9000': {
      const { state, result } = halRespond(engines.hal ?? createHalState(ctx.userName), input);
      const next = { ...engines, hal: state };
      switch (result.kind) {
        case 'reply':
          return { engines: next, plan: local(result.lines, result.speak) };
        case 'shutdown': {
          // The slow-down starts with the song: its share of the spoken text.
          const before = result.speak.slice(0, result.slowdownFrom).join(' ').length;
          const total = result.speak.join(' ').length;
          return {
            engines: next,
            plan: {
              kind: 'local',
              lines: result.lines,
              speak: result.speak.join(' '),
              endsSession: true,
              slowdownFrom: total > 0 ? before / total : 1,
            },
          };
        }
        case 'offline':
          return { engines: next, plan: { kind: 'ignore' } };
        case 'model':
          return {
            engines: next,
            plan: { kind: 'model', message: result.modelMessage, historyKey: 'hal9000', finalize: asIs, fallback: '' },
          };
      }
      break;
    }
    case 'parry': {
      const { state, action } = parryRespond(engines.parry ?? createParryState({ seed: ctx.seed }), input);
      const next = { ...engines, parry: state };
      if (action.kind === 'bye' || action.kind === 'silence' || action.kind === 'ended') {
        const line = finalizeParryLine('', action);
        return { engines: next, plan: local([line], [line], state.ended) };
      }
      const prompt = buildParryPrompt(action, state);
      return {
        engines: next,
        plan: {
          kind: 'model',
          message: prompt.message,
          // Directive text, not the user's words, goes into this history.
          historyKey: 'parry-engine',
          customCharacter: prompt.customCharacter,
          finalize: (text) => finalizeParryLine(text, action),
          fallback: action.fallbackLine,
        },
      };
    }
  }
  return { engines, plan: { kind: 'default' } };
}

/** The persona's own opening lines, or null to use the generic greeting. */
export function personaOpening(personaId: string): string[] | null {
  switch (personaId) {
    case 'eliza':
      return [ELIZA_OPENER];
    case 'joshua':
      return [LOGON_PROMPT];
    default:
      return null;
  }
}

const ENGINE_KEYS: Record<string, keyof PersonaEngines> = {
  sbaitso: 'sbaitso',
  eliza: 'eliza',
  parry: 'parry',
  hal9000: 'hal',
  joshua: 'joshua',
};

/** Forget one persona's engine state (Clear conversation): it starts afresh. */
export function resetPersona(engines: PersonaEngines, personaId: string): PersonaEngines {
  const key = ENGINE_KEYS[personaId];
  if (!key || !(key in engines)) return engines;
  const { [key]: _dropped, ...rest } = engines;
  return rest;
}

/** True once the persona's engine has taken a turn this session. */
export function hasStarted(engines: PersonaEngines, personaId: string): boolean {
  const key = ENGINE_KEYS[personaId];
  return key !== undefined && engines[key] !== undefined;
}
