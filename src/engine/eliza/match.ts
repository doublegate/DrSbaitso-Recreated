/**
 * Input tokenisation, decomposition matching and reassembly.
 *
 * Matching follows Anthony Hay's CC0 port of SLIP YMATCH (src/eliza.cpp,
 * `xmatch()`/`match()`): the pattern is cut into segments at each `0`; a `0`
 * followed by more elements takes the fewest words that let its segment match,
 * the last segment takes everything left, and a segment never backtracks into
 * an earlier one.
 */
import type { PatternElem, ReassemblyElem } from './types';

/** Tokens that end a clause (1965 source line 000660: `.`, `,` and `BUT`). */
export const DELIMITERS: ReadonlySet<string> = new Set(['.', ',', 'BUT']);

/**
 * Turn typed text into ELIZA's word list: upper case, with `.` and `,` as
 * separate tokens.
 *
 * The original read 6-bit BCD from a typewriter, where `?` deleted the line.
 * Following Hay's port, `?` and `!` become periods and `;`, `:` and dashes
 * become commas, so they still end a clause. Accents are stripped, the
 * typographic apostrophe becomes `'`, and any other character ELIZA could not
 * have printed becomes a space. Digits are kept (the 1965 code crashed on
 * them; that is not reproduced).
 */
export function tokenise(input: string): string[] {
  const text = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/’/g, "'")
    .replace(/[?!]/g, '.')
    .replace(/[;:–—]/g, ',')
    .replace(/[^A-Z0-9'.,]/g, ' ');
  const tokens: string[] = [];
  for (const chunk of text.split(' ')) {
    for (const part of chunk.split(/([.,])/)) {
      if (part !== '') tokens.push(part);
    }
  }
  return tokens;
}

function elemMatches(
  elem: PatternElem,
  word: string,
  tags: ReadonlyMap<string, ReadonlySet<string>>,
): boolean {
  switch (elem.kind) {
    case 'word':
      return elem.word === word;
    case 'oneOf':
      return elem.words.includes(word);
    case 'tag':
      return elem.tags.some((tag) => tags.get(tag)?.has(word) ?? false);
    default:
      return false;
  }
}

/**
 * Match `words` against a decomposition template. Returns one component per
 * pattern element (words joined by spaces, '' when a `0` took nothing), or
 * null when the template does not match.
 */
export function matchPattern(
  pattern: readonly PatternElem[],
  words: readonly string[],
  tags: ReadonlyMap<string, ReadonlySet<string>>,
): string[] | null {
  const result: string[] = pattern.map(() => '');

  // Match pattern[pBegin, pEnd) at words[wBegin...]; return the index after the
  // last word consumed, or -1. The segment holds at most one 0, and only first.
  const matchSegment = (pBegin: number, pEnd: number, wBegin: number, fixedLen: number): number => {
    if (words.length - wBegin < fixedLen) return -1;
    const hasWildcard = pattern[pBegin]?.kind === 'any';
    let wildLen = 0;
    let wildEnd = 0;
    if (hasWildcard) {
      if (pEnd === pattern.length) {
        // last segment: the 0 must take every word the fixed part leaves
        wildLen = words.length - wBegin - fixedLen;
        wildEnd = wildLen;
      } else {
        wildEnd = words.length - wBegin - fixedLen;
      }
    }
    for (;; wildLen++) {
      let p = pBegin + (hasWildcard ? 1 : 0);
      let w = wBegin + wildLen;
      for (; p < pEnd; p++) {
        const elem = pattern[p];
        if (elem === undefined) break;
        if (elem.kind === 'count') {
          result[p] = words.slice(w, w + elem.n).join(' ');
          w += elem.n;
        } else {
          const word = words[w];
          if (word === undefined || !elemMatches(elem, word, tags)) break;
          result[p] = word;
          w++;
        }
      }
      if (p === pEnd) {
        if (hasWildcard) result[pBegin] = words.slice(wBegin, wBegin + wildLen).join(' ');
        return w;
      }
      if (wildLen >= wildEnd) return -1;
    }
  };

  let w = 0;
  let segEnd = 0;
  while (segEnd < pattern.length) {
    const segStart = segEnd;
    let fixedLen = 0;
    for (; segEnd < pattern.length; segEnd++) {
      const elem = pattern[segEnd];
      if (elem === undefined) break;
      if (elem.kind === 'any') {
        if (segEnd > segStart) break;
      } else {
        fixedLen += elem.kind === 'count' ? elem.n : 1;
      }
    }
    w = matchSegment(segStart, segEnd, w, fixedLen);
    if (w < 0) return null;
  }
  return w < words.length ? null : result;
}

/**
 * Build a reply from a reassembly template and the decomposed components.
 * An index outside the components yields "HMMM", as in Hay's port (the parser
 * rejects such scripts, so it cannot happen with a validated script).
 */
export function reassemble(rule: readonly ReassemblyElem[], components: readonly string[]): string[] {
  const out: string[] = [];
  for (const elem of rule) {
    if (typeof elem === 'string') {
      out.push(elem);
      continue;
    }
    const component = elem >= 1 ? components[elem - 1] : undefined;
    if (component === undefined) {
      out.push('HMMM');
      continue;
    }
    for (const word of component.split(' ')) {
      if (word !== '') out.push(word);
    }
  }
  return out;
}
