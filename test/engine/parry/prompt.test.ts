import { describe, it, expect } from 'vitest';
import { PERSONA_FACTS, buildParryPrompt, createParryState, finalizeParryLine, parryRespond } from '@/engine/parry';

// The proxy's limits for a custom-character request (api/_lib/gemini.ts LIMITS).
const MAX_INSTRUCTION = 4000;
const MAX_MESSAGE = 2000;
const MAX_NAME = 60;

describe('buildParryPrompt', () => {
  const state = createParryState({ strength: 'STRONG', seed: 1 });

  it('returns a custom-character request within the proxy limits', () => {
    const { state: next, action } = parryRespond(state, 'How old are you?');
    const prompt = buildParryPrompt(action, next);
    expect(prompt.customCharacter.name).toBe('PARRY');
    expect(prompt.customCharacter.name.length).toBeLessThanOrEqual(MAX_NAME);
    expect(prompt.customCharacter.systemInstruction.length).toBeLessThanOrEqual(MAX_INSTRUCTION);
    expect(prompt.message.length).toBeGreaterThan(0);
    expect(prompt.message.length).toBeLessThanOrEqual(MAX_MESSAGE);
  });

  it('states the action, the affect and the facts to convey', () => {
    const { state: next, action } = parryRespond(state, 'How old are you?');
    const { message } = buildParryPrompt(action, next);
    expect(message).toMatch(/ACTION: answer/);
    expect(message).toMatch(/fear=\d+(\.\d)? anger=\d+(\.\d)? mistrust=\d+(\.\d)?/);
    expect(message).toContain(action.facts[0]);
    expect(message).toContain('How old are you?');
  });

  it('pins the persona and forbids inventing facts', () => {
    const { systemInstruction } = buildParryPrompt(parryRespond(state, 'Hi.').action, state).customCharacter;
    for (const fact of ['28', 'post office', 'bookie']) expect(systemInstruction.toLowerCase()).toContain(fact);
    expect(systemInstruction).toMatch(/do not invent/i);
    expect(systemInstruction).toMatch(/ALL CAPS/);
    expect(systemInstruction).toMatch(/question marks/i);
    expect(systemInstruction).toMatch(/exactly one/i);
  });

  it('caps a very long interviewer line so the message stays within limits', () => {
    const { state: next, action } = parryRespond(state, 'blah '.repeat(1000));
    expect(buildParryPrompt(action, next).message.length).toBeLessThanOrEqual(MAX_MESSAGE);
  });

  it('includes the fallback line as an example of the register', () => {
    const { state: next, action } = parryRespond(state, 'How old are you?');
    expect(buildParryPrompt(action, next).message).toContain(action.fallbackLine);
  });
});

describe('finalizeParryLine', () => {
  const s = createParryState({ seed: 1 });

  it('upper-cases one line and strips quotes and stage directions', () => {
    const { action } = parryRespond(s, 'How old are you?');
    expect(finalizeParryLine('"I\'m 28." *shrugs*\nSecond line', action)).toBe("I'M 28.");
  });

  it('falls back to the local line when the model returns nothing usable', () => {
    const { action } = parryRespond(s, 'How old are you?');
    expect(finalizeParryLine('   ', action)).toBe(action.fallbackLine);
    expect(finalizeParryLine(undefined, action)).toBe(action.fallbackLine);
  });

  it('keeps BYE and silence local', () => {
    const swears = ['Damn.', 'Hell.', 'Crap.', 'Bastard.', 'Damn you.'];
    let st = s;
    let action = parryRespond(st, swears[0]).action;
    for (const w of swears) ({ state: st, action } = parryRespond(st, w));
    expect(action.kind).toBe('bye');
    expect(finalizeParryLine('Fine, I am leaving now, goodbye!', action)).toBe('BYE.');
  });

  it('caps the length', () => {
    const { action } = parryRespond(s, 'How old are you?');
    expect(finalizeParryLine('word '.repeat(200), action).length).toBeLessThanOrEqual(160);
  });
});

describe('PERSONA_FACTS', () => {
  it('holds the documented persona', () => {
    const all = PERSONA_FACTS.join(' ').toLowerCase();
    for (const fact of ['28', 'post office', 'single', 'horse', 'bookie', 'beat', 'underworld', 'police', 'week']) {
      expect(all).toContain(fact);
    }
  });
});
