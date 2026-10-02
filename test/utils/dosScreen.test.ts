import { describe, it, expect } from 'vitest';
import {
  DOS_PALETTE,
  bannerRows,
  createScreen,
  print,
  visibleRows,
  rowText,
  SCREEN_ROWS,
  SCREEN_COLS,
} from '@/utils/dosScreen';

describe('dosScreen', () => {
  it('uses the exact VGA text-mode palette', () => {
    expect(DOS_PALETTE[1]).toBe('#0000AA');
    expect(DOS_PALETTE[14]).toBe('#FFFF55');
    expect(DOS_PALETTE[10]).toBe('#55FF55');
    expect(DOS_PALETTE[15]).toBe('#FFFFFF');
    expect(DOS_PALETTE).toHaveLength(16);
  });

  describe('banner (v2.20 layout, measured from the original screenshots)', () => {
    const rows = bannerRows('2.20', 1992).map(rowText);

    it('is five rows wide 80 columns with the box at columns 1-78', () => {
      expect(rows).toHaveLength(5);
      for (const r of rows) expect(r).toHaveLength(SCREEN_COLS);
      expect(rows[0][1]).toBe('╔');
      expect(rows[0][78]).toBe('╗');
      expect(rows[2][1]).toBe('╟');
      expect(rows[2][78]).toBe('╢');
      expect(rows[4][1]).toBe('╚');
      expect(rows[0][0]).toBe(' ');
    });

    it('places the title texts at the measured columns', () => {
      expect(rows[1].indexOf('Sound Blaster')).toBe(3);
      expect(rows[1].indexOf('D R   S B A I T S O')).toBe(30);
      expect(rows[1].indexOf('version 2.20')).toBe(65);
      expect(rows[3].indexOf('(c) Copyright Creative Labs, Inc. 1992, all rights reserved')).toBe(18);
    });

    it('colours the title yellow and the copyright light green', () => {
      const title = bannerRows('2.20', 1992)[1].find((s) => s.text.includes('D R'));
      expect(title?.fg).toBe(14);
      const copyright = bannerRows('2.20', 1992)[3].find((s) => s.text.includes('Copyright'));
      expect(copyright?.fg).toBe(10);
    });
  });

  describe('printing and scrolling', () => {
    it('starts with the banner, an empty row, then output', () => {
      let s = createScreen();
      s = print(s, [{ text: 'Please enter your name ...', fg: 15 }]);
      const rows = visibleRows(s).map(rowText);
      expect(rows).toHaveLength(SCREEN_ROWS);
      expect(rows[6].trimEnd()).toBe('Please enter your name ...');
    });

    it('scrolls when output passes row 24, keeping the newest line at the bottom', () => {
      let s = createScreen();
      for (let i = 0; i < 40; i++) s = print(s, [{ text: `LINE ${i}`, fg: 15 }]);
      const rows = visibleRows(s).map(rowText);
      expect(rows).toHaveLength(SCREEN_ROWS);
      expect(rows[24].trimEnd()).toBe('LINE 39');
    });

    it('wraps long lines at the screen width', () => {
      let s = createScreen();
      s = print(s, [{ text: 'X'.repeat(100), fg: 15 }]);
      const rows = visibleRows(s).map(rowText);
      expect(rows[6]).toBe('X'.repeat(80));
      expect(rows[7].trimEnd()).toBe('X'.repeat(20));
    });

    it('supports a 40-column screen (.WIDTH 40)', () => {
      let s = createScreen({ cols: 40 });
      s = print(s, [{ text: 'Y'.repeat(50), fg: 15 }]);
      const rows = visibleRows(s).map(rowText);
      expect(rows[0]).toHaveLength(40);
      expect(rows.some((r) => r.startsWith('Y'.repeat(40)))).toBe(true);
    });
  });
});
