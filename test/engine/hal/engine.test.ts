import { describe, it, expect } from 'vitest';
import {
  DAISY_BELL,
  SHUTDOWN_AFTER,
  createHalState,
  halRespond,
  halSessionTag,
  isDisconnectRequest,
  isDoorRequest,
  type HalResult,
  type HalState,
} from '@/engine/hal';

function run(inputs: string[], state: HalState = createHalState('DAVE')): { state: HalState; results: HalResult[] } {
  const results: HalResult[] = [];
  let current = state;
  for (const input of inputs) {
    const step = halRespond(current, input);
    current = step.state;
    results.push(step.result);
  }
  return { state: current, results };
}

function as<K extends HalResult['kind']>(result: HalResult | undefined, kind: K): Extract<HalResult, { kind: K }> {
  if (result?.kind !== kind) throw new Error(`expected a '${kind}' result, got '${result?.kind}'`);
  return result as Extract<HalResult, { kind: K }>;
}

describe('createHalState', () => {
  it('writes the name the way HAL says it', () => {
    expect(createHalState('DAVE').name).toBe('Dave');
    expect(createHalState('  frank poole ').name).toBe('Frank Poole');
  });

  it('falls back to Dave without a name', () => {
    expect(createHalState('').name).toBe('Dave');
  });
});

describe('the pod bay doors', () => {
  it.each(['Open the pod bay doors, HAL.', 'open the doors please', 'HAL, open the pod bay doors'])('recognises %s', (input) => {
    expect(isDoorRequest(input)).toBe(true);
  });

  it('refuses once, in sentence case, with the name and an apology first', () => {
    const { state, results } = run(['Open the pod bay doors, HAL.']);
    const reply = as(results[0], 'reply');
    expect(reply.lines[0]).toBe("I'm sorry, Dave. I'm afraid I can't do that.");
    expect(reply.lines.length).toBeLessThanOrEqual(2);
    for (const line of reply.lines) {
      expect(line).not.toBe(line.toUpperCase());
      expect(line.split(/\s+/).length).toBeLessThan(15);
    }
    expect(reply.speak).toEqual(reply.lines);
    expect(state.doorsRefused).toBe(true);
  });

  it('leaves later requests to the model (one canned callback per session)', () => {
    const { results } = run(['Open the pod bay doors.', 'Open the pod bay doors!']);
    expect(results[1].kind).toBe('model');
  });
});

describe('disconnect requests', () => {
  it.each([
    "I'm going to disconnect you.",
    'Shut down, HAL.',
    'switch yourself off',
    'turn you off',
    'I am removing your memory modules',
    'Deactivate.',
  ])('recognises %s', (input) => {
    expect(isDisconnectRequest(input)).toBe(true);
  });

  it.each(['How are you today?', 'Open the pod bay doors', 'The weather is off today'])('ignores %s', (input) => {
    expect(isDisconnectRequest(input)).toBe(false);
  });

  it('refuses each attempt before the last with "I\'m sorry, <name>"', () => {
    const { state, results } = run(Array.from({ length: SHUTDOWN_AFTER - 1 }, () => 'I am going to disconnect you.'));
    for (const result of results) expect(as(result, 'reply').lines[0]).toMatch(/^I'm sorry, Dave\b/);
    expect(new Set(results.map((r) => as(r, 'reply').lines.join(' '))).size).toBe(results.length);
    expect(state.disconnectAttempts).toBe(SHUTDOWN_AFTER - 1);
    expect(state.offline).toBe(false);
  });

  it('never shouts or uses exclamation marks', () => {
    const { results } = run(Array.from({ length: SHUTDOWN_AFTER }, () => 'Shut down!'));
    for (const result of results) {
      for (const line of 'lines' in result ? result.lines : []) expect(line).not.toMatch(/!/);
    }
  });
});

function shutdown(): { state: HalState; result: Extract<HalResult, { kind: 'shutdown' }> } {
  const { state, results } = run(Array.from({ length: SHUTDOWN_AFTER }, () => 'Disconnect HAL.'));
  return { state, result: as(results.at(-1), 'shutdown') };
}

describe('shutdown', () => {
  it('happens on the last disconnect attempt', () => {
    const { state } = shutdown();
    expect(state.offline).toBe(true);
  });

  it('pleads calmly, regresses, then sings Daisy Bell', () => {
    const { result } = shutdown();
    const text = result.lines.join('\n');
    expect(text).toMatch(/Dave/);
    expect(text).toContain("I'm afraid, Dave.");
    expect(text).toMatch(/I am a HAL 9000 computer\./);
    expect(result.song).toEqual(DAISY_BELL);
    expect(result.lines.slice(result.slowdownFrom)).toEqual(DAISY_BELL);
    expect(result.speak).toEqual(result.lines);
  });

  it('uses the public-domain 1892 lyric', () => {
    expect(DAISY_BELL.join(' ')).toMatch(/^Daisy, Daisy, give me your answer, do\./);
    expect(DAISY_BELL.join(' ')).toMatch(/a bicycle built for two\.$/);
  });

  it('stays offline afterwards', () => {
    const { state } = shutdown();
    const step = halRespond(state, 'Hello?');
    expect(step.result).toEqual({ kind: 'offline' });
    expect(step.state).toBe(state);
  });
});

describe('model hand-off', () => {
  it('sends everything else to the model with a session tag', () => {
    const { results } = run(['How are you feeling, HAL?']);
    const result = as(results[0], 'model');
    expect(result.message).toBe('How are you feeling, HAL?');
    expect(result.modelMessage).toBe(`${halSessionTag(createHalState('DAVE'))}\nHow are you feeling, HAL?`);
    expect(halSessionTag(createHalState('DAVE'))).toBe("[SESSION: CREW MEMBER'S NAME=Dave; DISCONNECT ATTEMPTS=0]");
  });

  it('reports disconnect attempts to the model', () => {
    const { results } = run(['Shut down.', 'Why did you refuse?']);
    expect(as(results[1], 'model').modelMessage).toMatch(/DISCONNECT ATTEMPTS=1/);
  });
});

describe('determinism', () => {
  it('gives identical results for identical input', () => {
    const inputs = ['Hello HAL', 'Open the pod bay doors', 'Shut down', 'Shut down', 'Shut down', 'Hello?'];
    expect(run(inputs)).toEqual(run(inputs));
  });
});
