import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import DosScreen, { integerScale } from '@/components/classic/DosScreen';
import { createScreen, print, visibleRows } from '@/utils/dosScreen';

describe('DosScreen', () => {
  const rows = visibleRows(print(createScreen(), [{ text: 'Please enter your name ...', fg: 15 }]));

  it('renders 25 rows of the screen buffer, hidden from assistive tech', () => {
    const { container } = render(<DosScreen rows={rows} cols={80} />);
    const screen = container.querySelector('[data-dos-screen]')!;
    expect(screen.getAttribute('aria-hidden')).toBe('true');
    expect(screen.querySelectorAll('[data-dos-row]')).toHaveLength(25);
    expect(screen.textContent).toContain('D R   S B A I T S O');
    expect(screen.textContent).toContain('Please enter your name ...');
  });

  it('paints segments in DOS palette colours on the chosen background', () => {
    const { container } = render(<DosScreen rows={rows} cols={80} background={1} />);
    const title = [...container.querySelectorAll('span')].find((s) => s.textContent === 'D R   S B A I T S O')!;
    expect(title.style.color).toBe('rgb(255, 255, 85)');
    const screen = container.querySelector('[data-dos-screen]') as HTMLElement;
    expect(screen.style.backgroundColor).toBe('rgb(0, 0, 170)');
  });

  it('draws the cursor at the requested cell', () => {
    const { container } = render(<DosScreen rows={rows} cols={80} cursor={{ row: 6, col: 27 }} />);
    const cursor = container.querySelector('[data-dos-cursor]') as HTMLElement;
    expect(cursor.style.getPropertyValue('--row')).toBe('6');
    expect(cursor.style.getPropertyValue('--col')).toBe('27');
  });
});

describe('DosScreen region background', () => {
  it('paints the rows below the banner in another colour (the DOS screen after Q)', () => {
    const rows = visibleRows(createScreen());
    const { container } = render(<DosScreen rows={rows} cols={80} regionBackground={0} />);
    const rowEls = container.querySelectorAll('[data-dos-row]');
    expect((rowEls[4] as HTMLElement).style.backgroundColor).toBe('');
    expect((rowEls[5] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect((rowEls[24] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)');
  });
});

describe('cursor blink (ref-docs/04: 114 ms on, 114 ms off)', () => {
  it('runs a 228 ms on/off cycle in the stylesheet', () => {
    const css = readFileSync(resolve(__dirname, '../../src/index.css'), 'utf8');
    const rule = /\.dos-cursor\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toMatch(/animation:\s*dos-blink\s+228ms\s+steps\(1,\s*end\)\s+infinite/);
  });

  it('stops blinking when the system asks for reduced motion, not only via the in-app setting', () => {
    const css = readFileSync(resolve(__dirname, '../../src/index.css'), 'utf8');
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.dos-cursor\s*\{\s*animation:\s*none/);
  });
});

describe('integerScale', () => {
  it('uses the largest whole-number scale that fits, keeping the font crisp', () => {
    expect(integerScale(1920, 1080, 720, 400)).toBe(2);
    expect(integerScale(800, 600, 720, 400)).toBe(1);
    expect(integerScale(3840, 2160, 720, 400)).toBe(5);
  });

  it('shrinks to fit a viewport smaller than the screen instead of cropping it', () => {
    // A phone in portrait: 720 px of text must fit in 412 px.
    expect(integerScale(412, 915, 720, 400)).toBeCloseTo(412 / 720);
    expect(integerScale(300, 200, 720, 400)).toBeCloseTo(300 / 720);
    expect(integerScale(720, 300, 720, 400)).toBeCloseTo(300 / 400);
  });
});
