import { describe, it, expect } from 'vitest';
import { applyThemeVariables } from '@/utils/themeVariables';
import { THEMES } from '@/constants';

describe('applyThemeVariables', () => {
  it('writes each theme colour as a --color-* custom property', () => {
    const el = document.createElement('div');
    const theme = THEMES.find((t) => t.id === 'phosphor-green')!;
    applyThemeVariables(theme.colors, el);
    for (const [name, value] of Object.entries(theme.colors)) {
      expect(el.style.getPropertyValue(`--color-${name}`)).toBe(value);
    }
  });

  it('defaults to the document root', () => {
    applyThemeVariables({ primary: '#111111', background: '#222222', text: '#333333', border: '#444444', accent: '#555555' });
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#555555');
  });
});
