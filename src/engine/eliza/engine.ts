/**
 * The ELIZA algorithm as the 1965 MAD-SLIP source runs it, after Anthony Hay's
 * CC0 C++ port (https://github.com/anthay/ELIZA, src/eliza.cpp, `eliza::response`).
 *
 * Per input:
 * 1. LIMIT advances (1 -> 2 -> 3 -> 4 -> 1).
 * 2. Scan left to right. At a delimiter (`.`, `,`, `BUT`) drop the clause
 *    before it if no keyword has been seen yet, otherwise drop everything
 *    from it on. Each word with a script entry is replaced by its substitute;
 *    the highest-ranked keyword wins, ties going to the first found. (The 1965
 *    code keeps only that one keyword: there is no keystack.)
 * 3. No keyword: when LIMIT is 4 and the MEMORY queue is not empty, reply with
 *    the oldest memory; otherwise use NONE.
 * 4. Keyword: if it is the MEMORY keyword, transform the input with the
 *    MEMORY rule chosen by `HASH(last cell, 2)` and queue it. Then use the
 *    first decomposition that matches, with that rule's next reassembly in
 *    turn. If none matches, follow the entry's link; with no link the script is
 *    ill-formed and the 1965 code prints a built-in message chosen by LIMIT.
 *
 * Pure: no clock, randomness, DOM or network. The state is never mutated.
 */
import { elizaHash, lastChunkAsBcd } from './hash';
import { DELIMITERS, matchPattern, reassemble, tokenise } from './match';
import { DOCTOR_SCRIPT_1965 } from './script';
import type { ElizaScript, ElizaState, ElizaStep, KeywordEntry, ReassemblyElem } from './types';

/** The opening line of the DOCTOR script, typed when the script loads. */
export const ELIZA_OPENER: string = DOCTOR_SCRIPT_1965.greeting;

/**
 * The "script error" replies hard-coded in the 1965 source (NOMACH(1..4),
 * lines 002200-002270), indexed by LIMIT - 1. The original prints the third as
 * "GO ON , PLEASE" (CTSS spacing); punctuation is attached here as everywhere.
 */
export const ELIZA_NOMATCH_REPLIES: readonly string[] = ['PLEASE CONTINUE', 'HMMM', 'GO ON, PLEASE', 'I SEE'];

/** Guard against a link cycle in a hand-written script (the DOCTOR script has none). */
const MAX_LINKS = 16;

export function createElizaState(): ElizaState {
  return { limit: 1, memories: [], cursors: {} };
}

/** Join reply tokens CACM-style ("REALLY, EVERYONE") and enforce the output conventions. */
function format(words: readonly string[]): string {
  return words
    .join(' ')
    .replace(/ +([.,])/g, '$1')
    .replace(/\?/g, '')
    .toUpperCase()
    .trim();
}

function isKeyword(entry: KeywordEntry | undefined): entry is KeywordEntry {
  return entry !== undefined && (entry.rules.length > 0 || entry.link !== undefined);
}

/** Apply the first matching decomposition of `entry`, advancing its cursor. */
function transform(
  entry: KeywordEntry,
  words: readonly string[],
  script: ElizaScript,
  cursors: Record<string, number>,
): string[] | null {
  for (const [index, rule] of entry.rules.entries()) {
    const components = matchPattern(rule.decomposition, words, script.tags);
    if (components === null) continue;
    const key = `${entry.keyword}#${index}`;
    const count = rule.reassemblies.length;
    const next = (cursors[key] ?? 0) % count;
    cursors[key] = (next + 1) % count;
    const template: readonly ReassemblyElem[] = rule.reassemblies[next] ?? [];
    return reassemble(template, components);
  }
  return null;
}

/** Produce ELIZA's reply to one line of input, using the CC0 1965 DOCTOR script. */
export function elizaRespond(state: ElizaState, input: string): ElizaStep {
  return respondWithScript(DOCTOR_SCRIPT_1965, state, input);
}

/** `elizaRespond` for any parsed script (exposed for tests and alternative scripts). */
export function respondWithScript(script: ElizaScript, state: ElizaState, input: string): ElizaStep {
  const limit = ((state.limit % 4) + 1) as ElizaState['limit'];
  const cursors: Record<string, number> = { ...state.cursors };
  let memories: string[] = [...state.memories];
  const finish = (reply: string): ElizaStep => ({ state: { limit, memories, cursors }, reply });

  // scan for the keyword, apply substitutions, cut at delimiters
  let words = tokenise(input);
  let top: KeywordEntry | undefined;
  for (let i = 0; i < words.length; i++) {
    const word = words[i] ?? '';
    if (DELIMITERS.has(word)) {
      if (top === undefined) {
        words = words.slice(i + 1);
        i = -1;
        continue;
      }
      words = words.slice(0, i);
      break;
    }
    const entry = script.entries.get(word);
    if (entry === undefined) continue;
    if (isKeyword(entry) && (top === undefined || entry.rank > top.rank)) top = entry;
    if (entry.substitute !== undefined) words[i] = entry.substitute;
  }

  if (top === undefined) {
    const [oldest, ...rest] = memories;
    if (limit === 4 && oldest !== undefined) {
      memories = rest;
      return finish(oldest);
    }
  } else {
    let keyword: KeywordEntry = top;
    for (let hops = 0; ; hops++) {
      if (keyword.keyword === script.memory.keyword) {
        const pair = script.memory.pairs[elizaHash(lastChunkAsBcd(words[words.length - 1] ?? ''), 2)];
        const components = pair ? matchPattern(pair.decomposition, words, script.tags) : null;
        if (pair && components) memories = [...memories, format(reassemble(pair.reassembly, components))];
      }
      const reply = transform(keyword, words, script, cursors);
      if (reply !== null) return finish(format(reply));
      const linked = keyword.link === undefined ? undefined : script.entries.get(keyword.link);
      if (!isKeyword(linked) || hops >= MAX_LINKS) {
        return finish(ELIZA_NOMATCH_REPLIES[limit - 1] ?? 'HMMM');
      }
      keyword = linked;
    }
  }

  return finish(format(transform(script.none, words, script, cursors) ?? []));
}
