/**
 * Reader for ELIZA scripts written as S-expressions (CACM 1966, p. 38-41).
 *
 * Supports exactly what the 1965 MAD-SLIP program could run: keywords with
 * `= SUBST`, rank and `DLIST(/tags)`; transformation rules; rule-level links
 * `(=KEY)`; `(MEMORY KEY ...)` with four pairs; `NONE`. The 1966 additions
 * the 1965 code lacks (NEWKEY, PRE, reassembly-level links) are rejected, so
 * an unsupported script fails loudly instead of misbehaving.
 */
import type { ElizaScript, KeywordEntry, MemoryRule, PatternElem, ReassemblyElem, Transformation } from './types';
import { DOCTOR_SCRIPT_1965_TEXT } from './doctorScript1965';

type Node = string | Node[];

const NUMBER = /^\d+$/;

function readForms(text: string): Node[] {
  const tokens = text.replace(/[()]/g, ' $& ').split(/\s+/).filter(Boolean);
  const stack: Node[][] = [[]];
  for (const token of tokens) {
    if (token === '(') {
      const list: Node[] = [];
      stack[stack.length - 1]?.push(list);
      stack.push(list);
    } else if (token === ')') {
      if (stack.length < 2) throw new SyntaxError('ELIZA script: unbalanced parentheses (extra ")")');
      stack.pop();
    } else {
      stack[stack.length - 1]?.push(token);
    }
  }
  if (stack.length !== 1) throw new SyntaxError('ELIZA script: unbalanced parentheses (missing ")")');
  return stack[0] ?? [];
}

function atoms(node: Node, what: string): string[] {
  if (!Array.isArray(node)) throw new SyntaxError(`ELIZA script: ${what} must be a list`);
  return node.map((n) => {
    if (Array.isArray(n)) throw new SyntaxError(`ELIZA script: ${what} may not contain a nested list`);
    return n;
  });
}

/** `(*A B)` or `(/TAG1 TAG2)`, with or without a space after the marker. */
function markedList(words: string[], marker: '*' | '/'): string[] | null {
  const [first, ...rest] = words;
  if (first === undefined || !first.startsWith(marker)) return null;
  return [first.slice(1), ...rest].filter((w) => w !== '');
}

function parsePattern(nodes: Node[], where: string): PatternElem[] {
  return nodes.map((node): PatternElem => {
    if (Array.isArray(node)) {
      const words = atoms(node, `a group in ${where}`);
      const alternatives = markedList(words, '*');
      if (alternatives) return { kind: 'oneOf', words: alternatives };
      const tags = markedList(words, '/');
      if (tags) return { kind: 'tag', tags };
      throw new SyntaxError(`ELIZA script: group in ${where} must start with * or /`);
    }
    if (NUMBER.test(node)) {
      const n = Number(node);
      return n === 0 ? { kind: 'any' } : { kind: 'count', n };
    }
    return { kind: 'word', word: node };
  });
}

function parseReassembly(words: string[], componentCount: number, where: string): ReassemblyElem[] {
  if (words.length === 1 && words[0] === 'NEWKEY') {
    throw new SyntaxError(`ELIZA script: NEWKEY in ${where} needs the 1966 keystack, which this engine does not have`);
  }
  if (words[0] === 'PRE') {
    throw new SyntaxError(`ELIZA script: PRE in ${where} is a 1966 feature this engine does not support`);
  }
  if (words[0]?.startsWith('=')) {
    throw new SyntaxError(`ELIZA script: reassembly-level link in ${where} is not supported by the 1965 engine`);
  }
  return words.map((word) => {
    if (!NUMBER.test(word)) return word;
    const n = Number(word);
    if (n < 1 || n > componentCount) {
      throw new SyntaxError(`ELIZA script: reassembly index ${n} in ${where} is out of range 1..${componentCount}`);
    }
    return n;
  });
}

/** `(=KEY)` or `(= KEY)` -> KEY; anything else -> null. */
function linkTarget(node: Node[]): string | null {
  const [first, second] = node;
  if (typeof first !== 'string' || !first.startsWith('=')) return null;
  const target = first.length > 1 ? first.slice(1) : second;
  if (typeof target !== 'string' || target === '') {
    throw new SyntaxError('ELIZA script: link "=" without a keyword');
  }
  return target;
}

function parseEntry(form: Node[]): KeywordEntry {
  const keyword = form[0];
  if (typeof keyword !== 'string') throw new SyntaxError('ELIZA script: entry must start with a keyword');
  let substitute: string | undefined;
  let rank = 0;
  let tags: string[] = [];
  let link: string | undefined;
  const rules: Transformation[] = [];

  let i = 1;
  for (; i < form.length; i++) {
    const node = form[i];
    if (Array.isArray(node)) break;
    if (node === '=') {
      const next = form[++i];
      if (typeof next !== 'string') throw new SyntaxError(`ELIZA script: "${keyword} =" needs a substitute word`);
      substitute = next;
    } else if (NUMBER.test(node ?? '')) {
      rank = Number(node);
    } else if (node === 'DLIST') {
      const list = form[++i];
      tags = markedList(atoms(list ?? '', `DLIST of ${keyword}`), '/') ?? [];
    } else {
      throw new SyntaxError(`ELIZA script: unexpected "${node}" in the header of ${keyword}`);
    }
  }

  for (; i < form.length; i++) {
    const node = form[i];
    if (!Array.isArray(node)) throw new SyntaxError(`ELIZA script: stray word "${node}" in ${keyword}`);
    const target = linkTarget(node);
    if (target !== null) {
      link = target;
      continue;
    }
    const [decomposition, ...reassemblies] = node;
    if (!Array.isArray(decomposition)) {
      throw new SyntaxError(`ELIZA script: rule in ${keyword} must start with a decomposition list`);
    }
    if (reassemblies.length === 0) {
      throw new SyntaxError(`ELIZA script: rule in ${keyword} has no reassembly`);
    }
    const where = `${keyword} rule ${rules.length + 1}`;
    const pattern = parsePattern(decomposition, where);
    rules.push({
      decomposition: pattern,
      reassemblies: reassemblies.map((r) => parseReassembly(atoms(r, `reassembly in ${where}`), pattern.length, where)),
    });
  }

  return { keyword, substitute, rank, tags, rules, link };
}

function parseMemory(form: Node[]): MemoryRule {
  const keyword = form[1];
  if (typeof keyword !== 'string') throw new SyntaxError('ELIZA script: MEMORY needs a keyword');
  const lists = form.slice(2);
  if (lists.length !== 4) {
    throw new SyntaxError(`ELIZA script: MEMORY needs exactly four transformations, got ${lists.length}`);
  }
  const pairs = lists.map((list, index) => {
    const words = atoms(list, 'a MEMORY transformation');
    const eq = words.indexOf('=');
    if (eq < 0) throw new SyntaxError('ELIZA script: MEMORY transformation needs "="');
    const where = `MEMORY transformation ${index + 1}`;
    const decomposition = parsePattern(words.slice(0, eq), where);
    return { decomposition, reassembly: parseReassembly(words.slice(eq + 1), decomposition.length, where) };
  });
  return { keyword, pairs };
}

/** Parse and validate an ELIZA script. Throws SyntaxError on anything it cannot run. */
export function parseElizaScript(text: string): ElizaScript {
  const forms = readForms(text);
  const [greetingForm, ...rest] = forms;
  if (greetingForm === undefined) throw new SyntaxError('ELIZA script: empty script');
  const greeting = atoms(greetingForm, 'the greeting').join(' ');

  const entries = new Map<string, KeywordEntry>();
  let memory: MemoryRule | undefined;
  let none: KeywordEntry | undefined;
  for (const form of rest) {
    if (!Array.isArray(form)) throw new SyntaxError(`ELIZA script: stray word "${form}" at top level`);
    if (form.length === 0) break; // () ends the script
    if (form[0] === 'MEMORY') memory = parseMemory(form);
    else if (form[0] === 'NONE') none = parseEntry(form);
    else {
      const entry = parseEntry(form);
      entries.set(entry.keyword, entry);
    }
  }
  if (none === undefined || none.rules.length === 0) {
    throw new SyntaxError('ELIZA script: the NONE entry is required');
  }
  if (memory === undefined) throw new SyntaxError('ELIZA script: the MEMORY entry is required');

  const isKeyword = (k: string) => {
    const e = entries.get(k);
    return e !== undefined && (e.rules.length > 0 || e.link !== undefined);
  };
  for (const entry of entries.values()) {
    if (entry.link !== undefined && !isKeyword(entry.link)) {
      throw new SyntaxError(`ELIZA script: ${entry.keyword} links to ${entry.link}, which is not a keyword`);
    }
  }
  if (!isKeyword(memory.keyword)) {
    throw new SyntaxError(`ELIZA script: MEMORY keyword ${memory.keyword} is not a keyword`);
  }

  const tags = new Map<string, Set<string>>();
  for (const entry of entries.values()) {
    for (const tag of entry.tags) {
      const words = tags.get(tag) ?? new Set<string>();
      words.add(entry.keyword);
      tags.set(tag, words);
    }
  }

  return { greeting, entries, tags, memory, none };
}

/** The CC0 1965 DOCTOR script (.TAPE. 100), parsed. */
export const DOCTOR_SCRIPT_1965: ElizaScript = parseElizaScript(DOCTOR_SCRIPT_1965_TEXT);
