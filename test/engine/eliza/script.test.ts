import { describe, it, expect } from 'vitest';
import { DOCTOR_SCRIPT_1965, DOCTOR_SCRIPT_1965_TEXT, ELIZA_OPENER, parseElizaScript } from '@/engine/eliza';

const s = DOCTOR_SCRIPT_1965;
const rank = (k: string) => s.entries.get(k)?.rank;
const sub = (k: string) => s.entries.get(k)?.substitute;

describe('DOCTOR script (.TAPE. 100, 1965, CC0)', () => {
  it('has the original greeting as the opener', () => {
    expect(ELIZA_OPENER).toBe(
      'HOW DO YOU DO. I AM THE DOCTOR. PLEASE SIT DOWN AT THE TYPEWRITER AND TELL ME YOUR PROBLEM.',
    );
    expect(ELIZA_OPENER).not.toContain('?');
  });

  it('keeps the script as data: the raw text is the verbatim tape listing', () => {
    expect(DOCTOR_SCRIPT_1965_TEXT.trimStart().startsWith('(HOW DO YOU DO.  I AM THE DOCTOR.')).toBe(true);
    expect(DOCTOR_SCRIPT_1965_TEXT.trimEnd().endsWith('()')).toBe(true);
    // the 1966 CACM script is not shipped: none of its distinctive keywords appear
    for (const word of ['COMPUTER', 'DREAM', 'ALIKE', 'NAME', 'SORRY', 'DEUTSCH']) {
      expect(DOCTOR_SCRIPT_1965_TEXT).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });

  it('parses ranks: EVERYONE family 2, ALWAYS 1, IF 3, the rest 0', () => {
    expect(rank('EVERYONE')).toBe(2);
    expect(rank('EVERYBODY')).toBe(2);
    expect(rank('NOBODY')).toBe(2);
    expect(rank('NOONE')).toBe(2);
    expect(rank('ALWAYS')).toBe(1);
    expect(rank('IF')).toBe(3);
    expect(rank('MY')).toBe(0);
    expect(rank('WHAT')).toBe(0);
  });

  it('parses substitutions, including substitution-only entries', () => {
    expect(sub('I')).toBe('YOU');
    expect(sub('YOU')).toBe('I');
    expect(sub('MY')).toBe('YOUR');
    expect(sub('YOUR')).toBe('MY');
    expect(sub('AM')).toBe('ARE');
    expect(sub('ARE')).toBe('AM');
    expect(sub('ME')).toBe('YOU');
    expect(sub("YOU'RE")).toBe("I'M");
    expect(sub('MYSELF')).toBe('YOURSELF');
    expect(s.entries.get('ME')?.rules).toHaveLength(0);
    expect(s.entries.get('ME')?.link).toBeUndefined();
  });

  it('parses DLIST tags into tag classes', () => {
    expect(s.entries.get('MOTHER')?.tags).toEqual(['NOUN', 'FAMILY']);
    expect(s.entries.get('SISTER')?.tags).toEqual(['FAMILY']);
    expect(s.tags.get('FAMILY')).toEqual(new Set(['BROTHER', 'CHILDREN', 'FATHER', 'MOTHER', 'SISTER', 'WIFE']));
    expect(s.tags.get('NOUN')).toEqual(new Set(['FATHER', 'MOTHER']));
  });

  it('parses decomposition patterns with 0, words and tag classes', () => {
    const my = s.entries.get('MY');
    expect(my?.rules[0]?.decomposition).toEqual([
      { kind: 'any' },
      { kind: 'word', word: 'YOUR' },
      { kind: 'any' },
      { kind: 'tag', tags: ['FAMILY'] },
      { kind: 'any' },
    ]);
    expect(my?.rules[0]?.reassemblies[1]).toEqual(['WHO', 'ELSE', 'IN', 'YOUR', 'FAMILY', 5]);
  });

  it('parses links at the rule level, with or without a space after =', () => {
    expect(s.entries.get('HOW')?.link).toBe('WHAT');
    expect(s.entries.get('MAYBE')?.link).toBe('PERHAPS');
    expect(s.entries.get('EVERYBODY')?.link).toBe('EVERYONE');
    const why = s.entries.get('WHY');
    expect(why?.rules).toHaveLength(2);
    expect(why?.link).toBe('WHAT');
  });

  it('parses MEMORY (keyword MY, exactly four pairs) and NONE', () => {
    expect(s.memory.keyword).toBe('MY');
    expect(s.memory.pairs).toHaveLength(4);
    expect(s.memory.pairs[1]).toEqual({
      decomposition: [{ kind: 'any' }, { kind: 'word', word: 'YOUR' }, { kind: 'any' }],
      reassembly: ['EARLIER', 'YOU', 'SAID', 'YOUR', 3],
    });
    expect(s.none.rules[0]?.reassemblies).toHaveLength(4);
    expect(s.entries.has('NONE')).toBe(false);
    expect(s.entries.has('MEMORY')).toBe(false);
  });

  it('counts 37 entries after the greeting (MEMORY and NONE included)', () => {
    expect(s.entries.size + 2).toBe(37);
  });
});

describe('parseElizaScript', () => {
  const minimal = '(HELLO)\n(NONE ((0) (GO ON)))\n(MEMORY K (0 = A 1) (0 = B 1) (0 = C 1) (0 = D 1))\n(K ((0) (OK)))';

  it('accepts a minimal script', () => {
    const parsed = parseElizaScript(minimal);
    expect(parsed.greeting).toBe('HELLO');
    expect(parsed.none.rules[0]?.reassemblies[0]).toEqual(['GO', 'ON']);
  });

  it('parses (*A B) alternatives', () => {
    const parsed = parseElizaScript(`${minimal}\n(X ((0 (*SAD HAPPY) 0) (YOU ARE 2)))`);
    expect(parsed.entries.get('X')?.rules[0]?.decomposition[1]).toEqual({
      kind: 'oneOf',
      words: ['SAD', 'HAPPY'],
    });
  });

  it('fails loudly on malformed input', () => {
    expect(() => parseElizaScript('(HELLO')).toThrow(/unbalanced/i);
    expect(() => parseElizaScript('(HELLO)\n(MEMORY K (0 = A 1))')).toThrow(/four/i);
    expect(() => parseElizaScript('(HELLO)')).toThrow(/NONE/);
    expect(() => parseElizaScript(`${minimal}\n(X ((0 X 0) (NEWKEY)))`)).toThrow(/NEWKEY/);
    expect(() => parseElizaScript(`${minimal}\n(X ((0 X 0) (SAY 4)))`)).toThrow(/out of range/);
    expect(() => parseElizaScript(`${minimal}\n(Y (=ZZZ))`)).toThrow(/not a keyword/);
    expect(() =>
      parseElizaScript('(HI)\n(NONE ((0) (GO ON)))\n(MEMORY Q (0 = A 1) (0 = B 1) (0 = C 1) (0 = D 1))'),
    ).toThrow(/MEMORY keyword Q/);
  });
});
