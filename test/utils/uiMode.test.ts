import { describe, it, expect, beforeEach } from 'vitest';
import { readUiMode, saveUiMode, UI_MODE_KEY } from '@/utils/uiMode';

describe('uiMode', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to the classic screen', () => {
    expect(readUiMode('')).toBe('classic');
  });

  it('remembers the chosen mode', () => {
    saveUiMode('enhanced');
    expect(localStorage.getItem(UI_MODE_KEY)).toBe('enhanced');
    expect(readUiMode('')).toBe('enhanced');
  });

  it('lets a ?mode= link override the saved choice', () => {
    saveUiMode('enhanced');
    expect(readUiMode('?mode=classic')).toBe('classic');
    expect(readUiMode('?mode=bogus')).toBe('enhanced');
  });
});
