/**
 * Vercel runs api/*.ts as native Node ES modules, compiled file by file and not
 * bundled, so every relative import they reach must name its file with a .js
 * extension. Vite and Vitest resolve extensionless paths, so nothing else
 * catches this; a 2.0 preview returned 500 on every request because of it.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const ENTRIES = ['api/chat.ts', 'api/tts.ts'];

/** Runtime (non type-only) relative import and export-from specifiers. */
function relativeImports(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"](\.{1,2}\/[^'"]+)['"]/gm;
  for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  for (const match of source.matchAll(/^\s*import\s+['"](\.{1,2}\/[^'"]+)['"]/gm)) specifiers.push(match[1]);
  return specifiers;
}

function walk(): { file: string; specifier: string; problem: string }[] {
  const problems: { file: string; specifier: string; problem: string }[] = [];
  const seen = new Set<string>();
  const queue = [...ENTRIES];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of relativeImports(readFileSync(path.join(root, file), 'utf8'))) {
      if (!specifier.endsWith('.js')) {
        problems.push({ file, specifier, problem: 'needs a .js extension' });
        continue;
      }
      const target = path.relative(root, path.resolve(root, path.dirname(file), specifier.replace(/\.js$/, '.ts')));
      if (!existsSync(path.join(root, target))) {
        problems.push({ file, specifier, problem: 'does not resolve to a .ts file' });
        continue;
      }
      queue.push(target);
    }
  }
  return problems;
}

describe('api import graph (Node ESM on Vercel)', () => {
  it('names every relative runtime import with a .js extension that resolves', () => {
    expect(walk()).toEqual([]);
  });
});
