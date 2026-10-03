import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cspToString, getCSPDirectives, getDevCSPDirectives } from '@/utils/security';

interface VercelConfig {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
}

const vercel: VercelConfig = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../vercel.json'), 'utf8'));
const deployedCsp = vercel.headers
  .find((h) => h.source === '/(.*)')
  ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value;

describe('Content-Security-Policy', () => {
  it('is deployed by vercel.json exactly as getCSPDirectives() defines it', () => {
    expect(deployedCsp).toBe(cspToString(getCSPDirectives()));
  });

  it('lets scripts load only from this origin (no inline, eval or CDN)', () => {
    expect(getCSPDirectives()['script-src']).toEqual(["'self'"]);
  });

  it('sends Gemini traffic through the proxy, never from the browser', () => {
    const connect = getCSPDirectives()['connect-src'];
    expect(connect).toContain("'self'");
    expect(connect.some((src) => src.includes('generativelanguage'))).toBe(false);
  });

  it('allows the Firebase hosts cloud sync talks to, and nothing broader', () => {
    const connect = getCSPDirectives()['connect-src'];
    for (const host of ['firestore', 'identitytoolkit', 'securetoken', 'firebaseinstallations']) {
      expect(connect).toContain(`https://${host}.googleapis.com`);
    }
    expect(connect.some((src) => src.includes('*'))).toBe(false);
  });

  it('cannot be framed', () => {
    expect(getCSPDirectives()['frame-ancestors']).toEqual(["'none'"]);
  });
});

describe('development CSP', () => {
  const dev = getDevCSPDirectives();
  const prod = getCSPDirectives();

  it('relaxes only what the Vite dev server needs', () => {
    expect(dev['script-src']).toEqual(["'self'", "'unsafe-inline'"]); // React refresh preamble
    expect(dev['connect-src']).toEqual([...prod['connect-src'], 'ws:', 'wss:']); // HMR
    expect(dev['upgrade-insecure-requests']).toBeUndefined(); // http://localhost
  });

  it('keeps every other directive identical to production', () => {
    for (const key of Object.keys(prod)) {
      if (['script-src', 'connect-src', 'upgrade-insecure-requests'].includes(key)) continue;
      expect(dev[key]).toEqual(prod[key]);
    }
  });

  it('allows no CDN or direct Gemini access, even in development', () => {
    expect(cspToString(dev)).not.toMatch(/tailwindcss|aistudiocdn|generativelanguage/);
  });
});
