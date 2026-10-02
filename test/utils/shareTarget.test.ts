import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { readSharedText, SHARE_PATH, takeSharedText, __resetSharedTextForTests } from '@/utils/shareTarget';
import { readUiMode } from '@/utils/uiMode';

const manifest = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../public/manifest.json'), 'utf8'));
const at = (url: string) => new URL(url, 'https://example.test');

describe('readSharedText', () => {
  it('reads text shared to the app at the share path', () => {
    expect(readSharedText(at('/share?text=I%20feel%20sad'))).toBe('I feel sad');
  });

  it('joins title, text and url, skipping blanks and duplicates', () => {
    expect(readSharedText(at('/share?title=Note&text=I%20feel%20sad&url=https%3A%2F%2Fa.test'))).toBe(
      'Note I feel sad https://a.test',
    );
    expect(readSharedText(at('/share?title=Same&text=Same'))).toBe('Same');
  });

  it('ignores the parameters anywhere but the share path', () => {
    expect(readSharedText(at('/?text=hi'))).toBeNull();
  });

  it('returns null for an empty share', () => {
    expect(readSharedText(at('/share'))).toBeNull();
    expect(readSharedText(at('/share?text=%20%20'))).toBeNull();
  });

  it('caps very long shares at the chat message limit', () => {
    expect(readSharedText(at(`/share?text=${'a'.repeat(5000)}`))?.length).toBe(2000);
  });
});

describe('manifest', () => {
  it('shares with a GET to the path the app reads', () => {
    expect(manifest.share_target).toMatchObject({ action: SHARE_PATH, method: 'GET' });
    expect(manifest.share_target.params).toMatchObject({ title: 'title', text: 'text', url: 'url' });
  });

  it('has shortcuts that open a screen the app can show', () => {
    expect(manifest.shortcuts.length).toBeGreaterThan(0);
    for (const shortcut of manifest.shortcuts) {
      const mode = new URLSearchParams(at(shortcut.url).search).get('mode');
      expect(mode).not.toBeNull();
      expect(readUiMode(`?mode=${mode}`)).toBe(mode);
    }
  });
});

describe('takeSharedText', () => {
  it('reads the share once, clears the URL, and returns the same text afterwards', () => {
    __resetSharedTextForTests();
    history.replaceState(null, '', '/share?text=I%20feel%20sad');
    expect(takeSharedText()).toBe('I feel sad');
    expect(location.pathname).toBe('/');
    expect(takeSharedText()).toBe('I feel sad');
  });

  it('is null when the app was not opened by a share', () => {
    __resetSharedTextForTests();
    history.replaceState(null, '', '/?mode=classic');
    expect(takeSharedText()).toBeNull();
    expect(location.search).toBe('?mode=classic');
  });
});
