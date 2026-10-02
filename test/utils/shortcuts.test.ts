import { describe, it, expect } from 'vitest';
import { APP_SHORTCUTS, matchShortcut, shortcutLabel } from '@/utils/shortcuts';

const key = (code: string, mods: Partial<KeyboardEventInit> = {}) =>
  new KeyboardEvent('keydown', { code, altKey: true, shiftKey: true, ...mods });

describe('app shortcuts', () => {
  it('assigns each action a unique key (no double-bound combos)', () => {
    const codes = APP_SHORTCUTS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('matches Alt+Shift+<key> by physical key, so macOS Option characters still work', () => {
    expect(matchShortcut(key('KeyA'))).toBe('accessibility');
    expect(matchShortcut(key('KeyV'))).toBe('voiceInput');
    expect(matchShortcut(key('KeyQ'))).toBe('cycleAudioMode');
  });

  it.each([
    ['Ctrl+A (select all)', { code: 'KeyA', ctrlKey: true, altKey: false, shiftKey: false }],
    ['Ctrl+Shift+V (paste plain text)', { code: 'KeyV', ctrlKey: true, altKey: false }],
    ['Ctrl+Shift+I (DevTools)', { code: 'KeyI', ctrlKey: true, altKey: false }],
    ['Alt+A without Shift', { code: 'KeyA', shiftKey: false }],
    ['Ctrl+Alt+Shift+A', { code: 'KeyA', ctrlKey: true }],
  ])('leaves browser and OS combos alone: %s', (_name, init) => {
    expect(matchShortcut(new KeyboardEvent('keydown', { altKey: true, shiftKey: true, ...init }))).toBeNull();
  });

  it('formats labels for display', () => {
    expect(shortcutLabel('accessibility')).toBe('Alt+Shift+A');
  });
});
