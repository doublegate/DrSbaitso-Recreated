import { describe, it, expect } from 'vitest';
import {
  validateName,
  isNameCharAllowed,
  NAME_ERROR_TEXT,
  NAME_PROMPT,
  MAX_NAME_LENGTH,
  greetingLines,
  greetingSpeech,
  exitMenuText,
  resolveExitChoice,
  helpPages,
  HELP_40_COLUMNS,
} from '@/engine/sbaitso';

describe('validateName', () => {
  it('upper-cases a valid name and keeps single spaces', () => {
    expect(validateName('  john   smith ')).toEqual({ ok: true, name: 'JOHN SMITH' });
  });

  it('rejects an empty name', () => {
    expect(validateName('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it.each(['R2D2', 'jo-ann', "o'brien", 'bob!'])('accepts letters and spaces only: %s', (raw) => {
    expect(validateName(raw)).toEqual({ ok: false, reason: 'letters-only' });
  });

  it('rejects names longer than the limit', () => {
    expect(validateName('A'.repeat(MAX_NAME_LENGTH))).toEqual({ ok: true, name: 'A'.repeat(MAX_NAME_LENGTH) });
    expect(validateName('A'.repeat(MAX_NAME_LENGTH + 1))).toEqual({ ok: false, reason: 'too-long' });
  });

  it('has the original error and prompt text', () => {
    expect(NAME_ERROR_TEXT['letters-only']).toBe('Enter alphabets only');
    expect(NAME_ERROR_TEXT['too-long']).toBe('NAME TOO LONG');
    expect(NAME_PROMPT).toBe('Please enter your name ...');
  });

  it('checks single keypresses', () => {
    expect(isNameCharAllowed('a')).toBe(true);
    expect(isNameCharAllowed(' ')).toBe(true);
    expect(isNameCharAllowed('1')).toBe(false);
    expect(isNameCharAllowed('ab')).toBe(false);
  });
});

describe('greetingLines', () => {
  it('reproduces the v2.20 greeting layout exactly', () => {
    expect(greetingLines('john')).toEqual([
      ' HELLO JOHN,  MY NAME IS DOCTOR SBAITSO.',
      '',
      ' I AM HERE TO HELP YOU.',
      ' SAY WHATEVER IS IN YOUR MIND FREELY,',
      ' OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.',
      ' MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,',
      '',
      ' SO, TELL ME ABOUT YOUR PROBLEMS.',
    ]);
  });

  it('gives the spoken lines without indent or blanks', () => {
    const spoken = greetingSpeech('john');
    expect(spoken).toHaveLength(6);
    expect(spoken[0]).toBe('HELLO JOHN,  MY NAME IS DOCTOR SBAITSO.');
    expect(spoken.every((line) => line.trim() === line && line.length > 0)).toBe(true);
  });
});

describe('exit menu', () => {
  it('has the original menu text', () => {
    expect(exitMenuText()).toBe('<C>ontinue  <N>ew patient  <Q>uit  .....');
  });

  it.each([
    ['c', 'continue'],
    ['N', 'new'],
    ['q', 'quit'],
    ['x', null],
    ['', null],
  ] as const)('maps %s to %s', (key, choice) => {
    expect(resolveExitChoice(key)).toBe(choice);
  });
});

describe('helpPages', () => {
  const pages = helpPages();

  it('has three pages', () => {
    expect(pages).toHaveLength(3);
  });

  it('lists every dot command on page 1 and offers more', () => {
    const page = pages[0].join('\n');
    for (const cmd of ['.QUIT', '.TONE', '.VOLUME', '.PITCH', '.SPEED', '.PARAM', '.ECHO', '.WIDTH', '.COLOR', '.MASTER']) {
      expect(page).toContain(cmd);
    }
    expect(page).toContain('Dot Commands are preceeded with a dot on the first column');
    expect(page).toContain('Sound Blaster Acting Intelligent Text to Speech Operator');
    expect(page).toContain('Hit <M> now for More HELPs');
  });

  it('gives hints on page 2 and keywords on page 3', () => {
    expect(pages[1].join('\n')).toMatch(/CALC/);
    expect(pages[1].join('\n')).toMatch(/SAY/);
    expect(pages[2].join('\n')).toMatch(/I LOVE YOU/);
    expect(pages[2].join('\n')).not.toContain('Hit <M>');
  });

  it('fits every line in 80 columns', () => {
    for (const line of pages.flat()) expect(line.length).toBeLessThanOrEqual(79);
  });

  it('has the 40-column refusal', () => {
    expect(HELP_40_COLUMNS).toBe('NO HELP FOR 40 COLUMNS. TRY:  .WIDTH 80');
  });
});
