import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '@/constants';
import { createHalState, halSessionTag } from '@/engine/hal';
import { createJoshuaState, joshuaFlags, joshuaSessionTag } from '@/engine/joshua';

const hal = CHARACTERS.find((c) => c.id === 'hal9000')!;
const joshua = CHARACTERS.find((c) => c.id === 'joshua')!;

/** Every double-quoted span in a prompt. */
const quotes = (text: string): string[] => [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

describe.each([
  ['hal9000', hal],
  ['joshua', joshua],
])('%s prompt: copyright and safety', (_id, persona) => {
  it('names no actors', () => {
    for (const actor of ['Douglas Rain', 'Martin Balsam', 'John Wood', 'Broderick', 'Dabney']) {
      expect(persona.systemInstruction).not.toContain(actor);
    }
  });

  it('quotes only short lines (under 15 words)', () => {
    for (const quote of quotes(persona.systemInstruction)) expect(quote.split(/\s+/).length).toBeLessThan(15);
  });

  it('explains the session line the local engine prepends', () => {
    expect(persona.systemInstruction).toMatch(/\[SESSION: /);
    expect(persona.systemInstruction).toMatch(/never repeat it/i);
  });
});

describe('HAL 9000 prompt (ref-docs/07 8.1)', () => {
  const prompt = hal.systemInstruction;

  it('writes in sentence case, not ALL CAPS', () => {
    expect(prompt).not.toMatch(/ALWAYS RESPOND IN ALL CAPS/);
    expect(prompt).toMatch(/sentence case/i);
    expect(prompt).toMatch(/never in (all )?capital letters/i);
  });

  it('reads the fields halSessionTag sends', () => {
    const tag = halSessionTag(createHalState('DAVE'));
    for (const field of ["CREW MEMBER'S NAME", 'DISCONNECT ATTEMPTS']) {
      expect(tag).toContain(field);
      expect(prompt).toContain(field);
    }
  });

  it('teaches the documented behaviour', () => {
    expect(prompt).toMatch(/one to three sentences/i);
    expect(prompt).toMatch(/first name/i);
    expect(prompt).toMatch(/human error/i);
    expect(prompt).toMatch(/I'm sorry, <name>/);
    expect(prompt).toMatch(/gentler/i);
    expect(prompt).toMatch(/afraid/i);
    expect(prompt).toMatch(/enjoy/i);
    expect(prompt).toMatch(/exclamation marks/i);
  });

  it('no longer uses the AE-35 as a verbal tic or the old caps example', () => {
    expect(prompt).not.toMatch(/I'M SORRY, DAVE/);
    expect(prompt).not.toMatch(/ERROR IN THE AE-35 UNIT/);
  });
});

describe('JOSHUA prompt (ref-docs/08 8.1)', () => {
  const prompt = joshua.systemInstruction;

  it('keeps the upper-case terminal register', () => {
    expect(prompt).toMatch(/CAPITAL LETTERS/);
    expect(prompt).toMatch(/drop articles/i);
  });

  it('addresses the user as Professor Falken unless told otherwise', () => {
    expect(prompt).toContain('PROFESSOR FALKEN');
    expect(prompt).toMatch(/USER field/);
  });

  it('teaches games, chess, sides and simulation-as-real', () => {
    expect(prompt).toMatch(/chess/i);
    expect(prompt).toMatch(/WHICH SIDE/);
    expect(prompt).toContain("WHAT'S THE DIFFERENCE?");
  });

  it('reads the fields joshuaSessionTag sends', () => {
    const tag = joshuaSessionTag(joshuaFlags(createJoshuaState()));
    for (const field of ['USER=', 'LESSON=', 'GAME=', 'SIDE=']) {
      expect(tag).toContain(field);
      expect(prompt).toContain(field);
    }
    expect(prompt).toContain('LESSON=NOT LEARNED');
    expect(prompt).toContain('LESSON=LEARNED');
  });

  it('gates the conclusion behind the lesson flag', () => {
    const conclusion = /only winning move is not to play/i;
    const gate = prompt.indexOf('If LESSON=LEARNED');
    expect(gate).toBeGreaterThan(-1);
    const match = conclusion.exec(prompt);
    expect(match).not.toBeNull();
    expect(match!.index).toBeGreaterThan(gate);
    // It appears once, inside the gated rule, never as a general reference.
    expect(prompt.match(new RegExp(conclusion.source, 'gi'))).toHaveLength(1);
  });
});
