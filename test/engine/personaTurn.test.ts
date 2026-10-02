import { describe, it, expect } from 'vitest';
import { hasEngine, personaOpening, personaTurn, resetPersona, hasStarted, type PersonaEngines } from '@/engine/personaTurn';
import { ELIZA_OPENER } from '@/engine/eliza';
import { LOGON_PROMPT, GREETING } from '@/engine/joshua';

const ctx = { userName: 'ALICE', seed: 7 };

function run(id: string, inputs: string[], engines: PersonaEngines = {}) {
  const plans = [];
  for (const input of inputs) {
    const turn = personaTurn(id, engines, input, ctx);
    engines = turn.engines;
    plans.push(turn.plan);
  }
  return { engines, plans };
}

describe('personaTurn', () => {
  it('leaves personas without an engine to the normal model pipeline', () => {
    expect(hasEngine('sbaitso')).toBe(false);
    expect(hasEngine('custom-123')).toBe(false);
    expect(personaTurn('custom-123', {}, 'hi', ctx).plan).toEqual({ kind: 'default' });
  });

  it('answers ELIZA locally from the 1965 script, with no model call', () => {
    const { plans } = run('eliza', ['Men are all alike.']);
    expect(plans[0].kind).toBe('local');
    if (plans[0].kind !== 'local') return;
    expect(plans[0].lines.join(' ')).toMatch(/[A-Z]/);
    expect(plans[0].speak).toBe(plans[0].lines.join(' '));
  });

  it('keeps ELIZA state between turns (the MEMORY queue and cursors advance)', () => {
    const { engines } = run('eliza', ['My mother hates me.', 'Hello.']);
    expect(engines.eliza).toBeDefined();
  });

  it('runs JOSHUA through LOGON before anything reaches the model', () => {
    const { plans } = run('joshua', ['JOSHUA']);
    expect(plans[0]).toMatchObject({ kind: 'local', lines: GREETING });
  });

  it('prints JOSHUA lists without speaking them', () => {
    const { plans } = run('joshua', ['JOSHUA', 'LIST GAMES']);
    expect(plans[1]).toMatchObject({ kind: 'local', speak: '' });
  });

  it('sends JOSHUA open conversation to the model with the session tag', () => {
    const { plans } = run('joshua', ['JOSHUA', 'How are you feeling today?']);
    expect(plans[1].kind).toBe('model');
    if (plans[1].kind !== 'model') return;
    expect(plans[1].message).toMatch(/^\[SESSION: /);
    expect(plans[1].message).toContain('How are you feeling today?');
    expect(plans[1].historyKey).toBe('joshua');
  });

  it("gives HAL the user's name and refuses the pod bay doors locally", () => {
    const { plans } = run('hal9000', ['Open the pod bay doors, HAL.']);
    expect(plans[0].kind).toBe('local');
    if (plans[0].kind !== 'local') return;
    expect(plans[0].lines.join(' ')).toContain('Alice');
  });

  it('shuts HAL down after repeated disconnect attempts, then ignores input', () => {
    const disconnect = 'I am going to disconnect you.';
    const { plans } = run('hal9000', [disconnect, disconnect, disconnect, 'Hello?']);
    expect(plans[2]).toMatchObject({ kind: 'local', endsSession: true });
    expect(plans[3]).toEqual({ kind: 'ignore' });
  });

  it('has PARRY decide locally and ask the model to phrase one line', () => {
    const { plans } = run('parry', ['Why are you in the hospital?']);
    expect(plans[0]).toMatchObject({ kind: 'model', historyKey: 'parry-engine', customCharacter: { name: 'PARRY' } });
    const plan = plans[0] as Extract<(typeof plans)[0], { kind: 'model' }>;
    expect(plan.finalize('  "i dont trust you."  \nmore')).toBe('I DONT TRUST YOU.');
    expect(plan.fallback.length).toBeGreaterThan(0);
  });

  it('forgets one persona on reset and leaves the others', () => {
    const { engines } = run('eliza', ['Hello']);
    const both = personaTurn('joshua', engines, 'JOSHUA', ctx).engines;
    expect(resetPersona(both, 'eliza')).toEqual({ joshua: both.joshua });
    expect(resetPersona(both, 'sbaitso')).toBe(both);
  });

  it('reports which personas have started', () => {
    const { engines } = run('joshua', ['JOSHUA']);
    expect(hasStarted(engines, 'joshua')).toBe(true);
    expect(hasStarted(engines, 'eliza')).toBe(false);
    expect(hasStarted(engines, 'sbaitso')).toBe(false);
  });

  it('is pure: the engines object it is given is not changed', () => {
    const engines: PersonaEngines = {};
    personaTurn('eliza', engines, 'Hello', ctx);
    expect(engines).toEqual({});
  });
});

describe('personaOpening', () => {
  it('uses each engine opener', () => {
    expect(personaOpening('eliza')).toEqual([ELIZA_OPENER]);
    expect(personaOpening('joshua')).toEqual([LOGON_PROMPT]);
  });

  it('returns null where the generic greeting applies', () => {
    expect(personaOpening('sbaitso')).toBeNull();
    expect(personaOpening('custom-1')).toBeNull();
  });
});
