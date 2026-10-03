import { describe, it, expect } from 'vitest';
import { matchPattern, reassemble, tokenise, type PatternElem } from '@/engine/eliza';

const any: PatternElem = { kind: 'any' };
const w = (word: string): PatternElem => ({ kind: 'word', word });
const n = (count: number): PatternElem => ({ kind: 'count', n: count });
const words = (s: string) => s.split(' ').filter(Boolean);
const noTags = new Map<string, ReadonlySet<string>>();

describe('tokenise', () => {
  it('upper-cases and splits period and comma into their own tokens', () => {
    expect(tokenise('Well, my boyfriend made me come here.')).toEqual([
      'WELL',
      ',',
      'MY',
      'BOYFRIEND',
      'MADE',
      'ME',
      'COME',
      'HERE',
      '.',
    ]);
  });

  it('keeps apostrophes inside words', () => {
    expect(tokenise("I'm sure you're right")).toEqual(["I'M", 'SURE', "YOU'RE", 'RIGHT']);
    expect(tokenise('I’m here')).toEqual(["I'M", 'HERE']);
  });

  it('maps ? and ! to a period, and ; : and dashes to a comma (Hay)', () => {
    expect(tokenise('Why? No!')).toEqual(['WHY', '.', 'NO', '.']);
    expect(tokenise('one; two: three — four')).toEqual(['ONE', ',', 'TWO', ',', 'THREE', ',', 'FOUR']);
  });

  it('strips accents and drops characters ELIZA could not print', () => {
    expect(tokenise('Café "quoted" (x) #tag')).toEqual(['CAFE', 'QUOTED', 'X', 'TAG']);
  });

  it('returns no tokens for blank input', () => {
    expect(tokenise('   ')).toEqual([]);
  });
});

// Behaviour of Hay's default matcher, which follows SLIP YMATCH: a 0 before
// further elements takes the fewest words that let its segment match, and
// segments never backtrack into earlier ones.
describe('matchPattern', () => {
  it('matches literals and counted wildcards exactly', () => {
    expect(matchPattern([w('HELLO')], ['HELLO'], noTags)).toEqual(['HELLO']);
    expect(matchPattern([w('HELLO'), n(1)], words('HELLO WORLD'), noTags)).toEqual(['HELLO', 'WORLD']);
    expect(matchPattern([n(2)], words('HELLO WORLD'), noTags)).toEqual(['HELLO WORLD']);
    expect(matchPattern([n(1)], words('HELLO WORLD'), noTags)).toBeNull();
    expect(matchPattern([n(3)], words('HELLO WORLD'), noTags)).toBeNull();
  });

  it('lets 0 match any number of words, including none', () => {
    expect(matchPattern([any], [], noTags)).toEqual(['']);
    expect(matchPattern([any], words('HELLO WORLD'), noTags)).toEqual(['HELLO WORLD']);
    expect(matchPattern([any, any], words('HELLO WORLD'), noTags)).toEqual(['', 'HELLO WORLD']);
    expect(matchPattern([any, w('WORLD')], words('HELLO WORLD'), noTags)).toEqual(['HELLO', 'WORLD']);
  });

  it('binds the earliest occurrence for an inner 0', () => {
    expect(matchPattern([any, w('YOU'), any, w('ME')], words('YOU AND YOU LIKE ME'), noTags)).toEqual([
      '',
      'YOU',
      'AND YOU LIKE',
      'ME',
    ]);
  });

  it('matches DLIST tag classes and (* ...) alternatives', () => {
    const tags = new Map([['FAMILY', new Set(['MOTHER', 'FATHER'])]]);
    const pattern: PatternElem[] = [any, w('YOUR'), any, { kind: 'tag', tags: ['FAMILY'] }, any];
    expect(matchPattern(pattern, words('YOUR OLD MOTHER CALLS'), tags)).toEqual(['', 'YOUR', 'OLD', 'MOTHER', 'CALLS']);
    expect(matchPattern(pattern, words('YOUR DOG'), tags)).toBeNull();
    const alt: PatternElem[] = [any, { kind: 'oneOf', words: ['SAD', 'HAPPY'] }, any];
    expect(matchPattern(alt, words('I AM HAPPY TODAY'), noTags)).toEqual(['I AM', 'HAPPY', 'TODAY']);
  });

  it('fails when words remain after the pattern', () => {
    expect(matchPattern([w('HELLO')], words('HELLO WORLD'), noTags)).toBeNull();
  });
});

describe('reassemble', () => {
  const parts = ['MARY', 'HAD A', 'LITTLE LAMB', 'ITS', 'PROBABILITY', 'WAS ZERO'];

  it('inserts numbered components (SLIP ASSMBL example)', () => {
    expect(reassemble(['DID', 1, 'HAVE', 'A', 3], parts)).toEqual(['DID', 'MARY', 'HAVE', 'A', 'LITTLE', 'LAMB']);
  });

  it('drops empty components', () => {
    expect(reassemble(['WHO', 'ELSE', 2], ['', ''])).toEqual(['WHO', 'ELSE']);
  });

  it('prints HMMM for an out-of-range index, as Hay does', () => {
    expect(reassemble([1, 7, 1], parts)).toEqual(['MARY', 'HMMM', 'MARY']);
  });
});
