import { describe, it, expect } from 'vitest';
import { elizaHash, lastChunkAsBcd } from '@/engine/eliza';

// Test vectors from Anthony Hay's CC0 C++ ELIZA (src/eliza.cpp,
// last_chunk_as_bcd_test and hash_test), which ports the SLIP HASH FAP routine
// from Weizenbaum's MIT archive.

describe('lastChunkAsBcd (36-bit Hollerith encoding of the last SLIP cell)', () => {
  it.each([
    ['', 0o606060606060n],
    ['X', 0o676060606060n],
    ['HERE', 0o302551256060n],
    ['ALWAYS', 0o214366217062n],
    ['INVENTED', 0o252460606060n],
    ['123456ABCDEF', 0o212223242526n],
    // U+00C7 is not Hollerith: the low six bits of each UTF-8 byte are used
    ['Ç', 0o030760606060n],
  ])('%j -> %s', (word, expected) => {
    expect(lastChunkAsBcd(word)).toBe(expected);
  });
});

describe('elizaHash (SLIP mid-square HASH)', () => {
  it('ALWAYS hashes to 14 in 7 bits (CACM 1966, p. 38)', () => {
    expect(elizaHash(0o214366217062n, 7)).toBe(14);
  });

  it('HERE hashes to 3 in 2 bits (selects the BOYFRIEND memory)', () => {
    expect(elizaHash(0o302551256060n, 2)).toBe(3);
  });

  it('reproduces the 1965 pilot-conversation memories (KIDS, TIME)', () => {
    expect(elizaHash(0o423124626060n, 2)).toBe(1);
    expect(elizaHash(0o633144256060n, 2)).toBe(0);
  });

  // Bucket indexes of every .TAPE. 100 keyword, dumped from the original code
  // running on the s709 emulator (5-bit hash of the first six characters).
  it.each([
    ['NOONE', 0], ['WIFE', 1], ['I', 2], ['CAN', 2], ['BECAUSE', 3], ['IF', 5],
    ['CHILDREN', 5], ['HOW', 6], ['YES', 6], ['ALWAYS', 7], ['MY', 8],
    ["YOU'RE", 11], ['ARE', 12], ['EVERYONE', 12], ['MAYBE', 13], ['YOU', 13],
    ['AM', 16], ['YOUR', 17], ['PERHAPS', 18], ['MYSELF', 19], ['BROTHER', 21],
    ['WHAT', 21], ['MOTHER', 22], ['SISTER', 22], ['NO', 24], ["I'M", 25],
    ['WHY', 27], ['NOBODY', 27], ['FATHER', 28], ['WHEN', 29], ['WAS', 29],
    ['ME', 29], ['YOURSELF', 30], ['WERE', 31], ['EVERYBODY', 31],
  ])('TAPE 100 keyword %s is in bucket %i', (word, bucket) => {
    expect(elizaHash(lastChunkAsBcd(word.slice(0, 6)), 5)).toBe(bucket);
  });

  // Confirmed on the emulator by typing "my <word>" and waiting for the memory.
  it.each([
    ['PURPOSE', 1], ['DEVONSHIRE', 0], ['PREDICAMENT', 3], ['EXECUTIONERS', 3],
    ['GLOUCESTERSHIRE', 2],
  ])('memory selector for last word %s is %i', (word, index) => {
    expect(elizaHash(lastChunkAsBcd(word), 2)).toBe(index);
  });

  it('rejects widths outside 0..15', () => {
    expect(() => elizaHash(1n, 16)).toThrow(/0\.\.15/);
    expect(() => elizaHash(1n, -1)).toThrow(/0\.\.15/);
  });
});
