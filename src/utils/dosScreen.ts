/**
 * A DOS text-mode screen model for the classic (faithful) mode: 80x25 cells,
 * the 16-colour VGA palette, and the Dr. Sbaitso v2.20 banner reconstructed
 * from pixel measurements of the original screenshots (ref-docs/03).
 *
 * Pure data and functions; React rendering lives in components/classic.
 */

/** Standard CGA/EGA/VGA text-mode palette, indexed by DOS colour number. */
export const DOS_PALETTE = [
  '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
] as const;

export const SCREEN_ROWS = 25;
export const SCREEN_COLS = 80;

/**
 * Printed lines kept below the banner. Only the last 19 are visible; the rest
 * is a small margin so a parity flood (about 250 lines) cannot grow the buffer
 * without bound.
 */
export const SCROLLBACK_LINES = 64;

export const DOS = {
  blue: 1,
  lightGreen: 10,
  yellow: 14,
  white: 15,
} as const;

export interface Segment {
  text: string;
  /** Foreground colour number (0-15). */
  fg: number;
}

/** One screen row as coloured segments. */
export type Row = Segment[];

export interface Screen {
  cols: number;
  rows: number;
  banner: Row[];
  /** Everything printed below the banner, oldest first, already wrapped. */
  lines: Row[];
}

export const rowText = (row: Row): string => row.map((s) => s.text).join('');

/** Pads or trims a row to exactly `cols` characters (padding is background). */
function fitRow(row: Row, cols: number): Row {
  const out: Row = [];
  let used = 0;
  for (const seg of row) {
    if (used >= cols) break;
    const text = seg.text.slice(0, cols - used);
    out.push({ text, fg: seg.fg });
    used += text.length;
  }
  if (used < cols) out.push({ text: ' '.repeat(cols - used), fg: DOS.white });
  return out;
}

/** Writes `text` into a fixed-width character line at `col`. */
function place(line: string[], col: number, text: string) {
  for (let i = 0; i < text.length && col + i < line.length; i++) line[col + i] = text[i];
}

/**
 * The five-row banner. In 80 columns the box spans columns 1-78 with a
 * double frame and a single-line divider on row 2; texts sit at the measured
 * columns (title at 30, version at 65, copyright starting at 18).
 */
export function bannerRows(version = '2.20', year = 1992, cols = SCREEN_COLS): Row[] {
  const W = DOS.white;
  if (cols < 80) {
    // Compact 40-column banner (".WIDTH 40"); exact appearance unverified.
    const inner = cols - 4;
    const center = (t: string) => {
      const pad = Math.max(0, inner - t.length);
      return ' '.repeat(Math.floor(pad / 2)) + t + ' '.repeat(Math.ceil(pad / 2));
    };
    return [
      [{ text: ' ╔' + '═'.repeat(inner) + '╗ ', fg: W }],
      [{ text: ' ║', fg: W }, { text: center('DR S B A I T S O'), fg: DOS.yellow }, { text: '║ ', fg: W }],
      [{ text: ' ╟' + '─'.repeat(inner) + '╢ ', fg: W }],
      [{ text: ' ║', fg: W }, { text: center(`(c)Copyright Creative Labs,Inc.${year}`), fg: DOS.lightGreen }, { text: '║ ', fg: W }],
      [{ text: ' ╚' + '═'.repeat(inner) + '╝ ', fg: W }],
    ];
  }

  const last = cols - 2; // column of the right-hand frame
  const hline = (left: string, fill: string, right: string) => ' ' + left + fill.repeat(last - 2) + right + ' ';

  const titleLine = Array.from(' ║' + ' '.repeat(last - 2) + '║ ');
  place(titleLine, 3, 'Sound Blaster');
  place(titleLine, 65, `version ${version}`);
  const title = 'D R   S B A I T S O';
  const titleText = titleLine.join('');

  const copyright = `(c) Copyright Creative Labs, Inc. ${year}, all rights reserved`;
  // Ends at column 76 with one space before the frame, like `version 2.20`.
  const copyStart = last - 1 - copyright.length;

  return [
    [{ text: hline('╔', '═', '╗'), fg: W }],
    [
      { text: titleText.slice(0, 30), fg: W },
      { text: title, fg: DOS.yellow },
      { text: titleText.slice(30 + title.length), fg: W },
    ],
    [{ text: hline('╟', '─', '╢'), fg: W }],
    [
      { text: ' ║' + ' '.repeat(copyStart - 2), fg: W },
      { text: copyright.slice(0, copyright.indexOf(' all rights')), fg: DOS.lightGreen },
      { text: copyright.slice(copyright.indexOf(' all rights')) + ' ║ ', fg: W },
    ],
    [{ text: hline('╚', '═', '╝'), fg: W }],
  ];
}

export function createScreen(opts: { cols?: number; version?: string; year?: number } = {}): Screen {
  const cols = opts.cols ?? SCREEN_COLS;
  return { cols, rows: SCREEN_ROWS, banner: bannerRows(opts.version, opts.year, cols), lines: [[]] };
}

/** Splits a row into screen-width rows (DOS wraps at the last column). */
function wrap(row: Row, cols: number): Row[] {
  const out: Row[] = [];
  let current: Row = [];
  let used = 0;
  for (const seg of row) {
    let text = seg.text;
    while (text.length > 0) {
      const room = cols - used;
      const take = text.slice(0, room);
      current.push({ text: take, fg: seg.fg });
      used += take.length;
      text = text.slice(take.length);
      if (used === cols) {
        out.push(current);
        current = [];
        used = 0;
      }
    }
  }
  if (current.length > 0 || out.length === 0) out.push(current);
  return out;
}

/** Prints one or more rows below what is already on screen. */
export function print(screen: Screen, ...rows: Row[]): Screen {
  const added = rows.flatMap((r) => wrap(r, screen.cols));
  // createScreen's single empty line is the blank row 5 between the banner and the first output.
  const lines = [...screen.lines, ...added];
  return { ...screen, lines: lines.length > SCROLLBACK_LINES ? lines.slice(-SCROLLBACK_LINES) : lines };
}

/**
 * The 25 rows currently visible. As in the original (CONFIRMED (DOSBox),
 * ref-docs/04 section 3) the banner is pinned: only the rows between it and
 * the last row scroll (rows 5-23 under the five-row banner), and the last row
 * (24) is never written.
 */
export function visibleRows(screen: Screen): Row[] {
  const region = Math.max(0, screen.rows - screen.banner.length - 1);
  const shown = screen.lines.slice(Math.max(0, screen.lines.length - region));
  const view = [...screen.banner, ...shown];
  while (view.length < screen.rows) view.push([]);
  return view.map((r) => fitRow(r, screen.cols));
}
