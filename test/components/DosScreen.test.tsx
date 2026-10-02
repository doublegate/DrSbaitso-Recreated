import { describe, it, expect } from 'vitest';
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

describe('integerScale', () => {
  it('uses the largest whole-number scale that fits, minimum 1', () => {
    expect(integerScale(1920, 1080, 720, 400)).toBe(2);
    expect(integerScale(800, 600, 720, 400)).toBe(1);
    expect(integerScale(300, 200, 720, 400)).toBe(1);
    expect(integerScale(3840, 2160, 720, 400)).toBe(5);
  });
});
