/**
 * The SLIP HASH function and the BCD encoding ELIZA hashes.
 *
 * Ported from Anthony Hay's CC0 C++ ELIZA (https://github.com/anthay/ELIZA,
 * src/eliza.cpp: `hash()` and `last_chunk_as_bcd()`), which transcribes the
 * FAP routine Jeff Shrager found in Weizenbaum's MIT archive in 2022.
 *
 * ELIZA uses it to pick one of the four MEMORY transformations:
 * `I=HASH.(BOT.(INPUT),2)+1` (1965 source, line 001230). BOT is the last SLIP
 * cell of the input: the last word, or its last six-character chunk.
 */

/**
 * IBM 7090 BCD (Hollerith) code -> character, indexed by the 6-bit code.
 * 0 marks an unused code. Code 14 octal is a prime ('), not a double quote.
 */
const BCD_TABLE = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '', '=', "'", '', '', '',
  '+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', '', '.', ')', '', '', '',
  '-', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', '', '$', '*', '', '', '',
  ' ', '/', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '', ',', '(', '', '', '',
] as const;

/** byte value -> BCD code */
const TO_BCD: ReadonlyMap<number, number> = new Map(
  BCD_TABLE.flatMap((ch, code) => (ch === '' ? [] : [[ch.charCodeAt(0), code] as [number, number]])),
);

const SPACE_BCD = 0o60;
const utf8 = new TextEncoder();

/**
 * The 36-bit BCD value of the last SLIP cell a word would occupy: its last
 * chunk of up to six characters, left-justified and space-padded. A byte with
 * no BCD code contributes its low six bits, as in Hay's port (such input could
 * not have reached the original anyway).
 */
export function lastChunkAsBcd(word: string): bigint {
  const bytes = utf8.encode(word);
  const start = bytes.length === 0 ? 0 : Math.floor((bytes.length - 1) / 6) * 6;
  let result = 0n;
  let count = 0;
  for (let i = start; i < bytes.length; i++, count++) {
    const b = bytes[i] ?? 0;
    result = (result << 6n) | BigInt(TO_BCD.get(b) ?? b & 0x3f);
  }
  for (; count < 6; count++) result = (result << 6n) | BigInt(SPACE_BCD);
  return result;
}

/**
 * SLIP `HASH.(D,N)`: the middle `n` bits of the square of the low 35 bits of
 * `d` (mid-square). The 7094 is sign-magnitude, so bit 35 is the sign and is
 * not squared.
 */
export function elizaHash(d: bigint, n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 15) {
    throw new RangeError(`hash width must be an integer in 0..15, got ${n}`);
  }
  const magnitude = d & 0x7ffffffffn;
  const square = magnitude * magnitude;
  const shifted = square >> BigInt(35 - Math.floor(n / 2));
  return Number(shifted & ((1n << BigInt(n)) - 1n));
}
