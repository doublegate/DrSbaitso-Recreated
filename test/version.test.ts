import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { APP_VERSION } from '@/version';

describe('APP_VERSION', () => {
  it('is the version in package.json, so the UI never shows a stale number', () => {
    const pkg = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../package.json'), 'utf8'));
    expect(APP_VERSION).toBe(pkg.version);
  });
});
