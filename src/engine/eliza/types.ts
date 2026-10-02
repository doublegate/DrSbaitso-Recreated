/**
 * Data model of an ELIZA script and of one conversation's state.
 *
 * Shapes follow Weizenbaum's 1966 CACM description as narrowed by the 1965
 * MAD-SLIP source (no keystack, NEWKEY or PRE). See ref-docs/05-eliza.md.
 */

/** One element of a decomposition template. */
export type PatternElem =
  /** `0`: any number of words, possibly none */
  | { readonly kind: 'any' }
  /** a positive integer n: exactly n words */
  | { readonly kind: 'count'; readonly n: number }
  /** a literal word */
  | { readonly kind: 'word'; readonly word: string }
  /** `(*A B C)`: any one of the listed words */
  | { readonly kind: 'oneOf'; readonly words: readonly string[] }
  /** `(/TAG1 TAG2)`: any one word carrying one of the DLIST tags */
  | { readonly kind: 'tag'; readonly tags: readonly string[] };

/** A reassembly element: a literal word, or the 1-based index of a decomposed component. */
export type ReassemblyElem = string | number;

/** One decomposition template followed by the reassembly templates it cycles through. */
export interface Transformation {
  readonly decomposition: readonly PatternElem[];
  readonly reassemblies: readonly (readonly ReassemblyElem[])[];
}

/** One script entry: `(KEYWORD [= SUBST] [rank] [DLIST(/tags)] rules... [(=LINK)])`. */
export interface KeywordEntry {
  readonly keyword: string;
  /** word that replaces the keyword in the input during the scan, e.g. I -> YOU */
  readonly substitute?: string;
  /** precedence; 0 when the script gives none */
  readonly rank: number;
  /** DLIST tags, e.g. MOTHER -> [NOUN, FAMILY] */
  readonly tags: readonly string[];
  readonly rules: readonly Transformation[];
  /** rule-level link `(=WHAT)`: used when no decomposition of this entry matches */
  readonly link?: string;
}

/** `(MEMORY MY (0 YOUR 0 = ...) x4)`. */
export interface MemoryRule {
  readonly keyword: string;
  readonly pairs: readonly {
    readonly decomposition: readonly PatternElem[];
    readonly reassembly: readonly ReassemblyElem[];
  }[];
}

/** A parsed script. */
export interface ElizaScript {
  /** greeting typed when the script is loaded (the first list in the script) */
  readonly greeting: string;
  /** every entry except MEMORY and NONE, by keyword */
  readonly entries: ReadonlyMap<string, KeywordEntry>;
  /** DLIST tag -> words carrying it */
  readonly tags: ReadonlyMap<string, ReadonlySet<string>>;
  readonly memory: MemoryRule;
  /** the required NONE pseudo-keyword */
  readonly none: KeywordEntry;
}

/**
 * Everything ELIZA remembers between inputs. Plain JSON, so it can be stored
 * with a session and restored.
 */
export interface ElizaState {
  /** Weizenbaum's LIMIT counter: starts at 1, advanced before each input, 4 wraps to 1 */
  readonly limit: 1 | 2 | 3 | 4;
  /** MEMORY queue, oldest first */
  readonly memories: readonly string[];
  /** next reassembly index per decomposition rule, keyed `${keyword}#${ruleIndex}` */
  readonly cursors: Readonly<Record<string, number>>;
}

export interface ElizaStep {
  readonly state: ElizaState;
  readonly reply: string;
}
