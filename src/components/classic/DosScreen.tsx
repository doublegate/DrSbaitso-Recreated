/**
 * Renders a DOS text screen (utils/dosScreen) as an 80x25 (or 40x25) grid of
 * 9x16 VGA cells, scaled by whole numbers so the bitmap font stays crisp
 * (fractionally, on viewports smaller than the screen),
 * with a black overscan border around it.
 *
 * The grid is presentational and hidden from assistive technology; the
 * classic controller supplies an accessible transcript and input.
 */
import { useEffect, useState } from 'react';
import { DOS_PALETTE, type Row } from '../../utils/dosScreen';

export const CELL_W = 9;
export const CELL_H = 16;
/** Rows taken by the banner box. */
const BANNER_ROWS = 5;

/**
 * The largest whole-number scale that fits, so the bitmap font stays crisp.
 * A viewport smaller than the screen (a phone) gets the fractional scale that
 * fits it: slightly soft text beats a cropped screen.
 */
export function integerScale(viewW: number, viewH: number, screenW: number, screenH: number): number {
  const fit = Math.min(viewW / screenW, viewH / screenH);
  return fit >= 1 ? Math.floor(fit) : fit;
}

interface DosScreenProps {
  rows: Row[];
  cols: number;
  /** Background colour number (".COLOR"), default 1 (blue). */
  background?: number;
  /**
   * Background for the rows below the five-row banner, when it differs from
   * `background`: after Q the original leaves its blue banner on screen above
   * a black DOS area (CONFIRMED (DOSBox)).
   */
  regionBackground?: number;
  cursor?: { row: number; col: number } | null;
}

function useViewportScale(width: number, height: number) {
  const compute = () =>
    typeof window === 'undefined' ? 1 : integerScale(window.innerWidth, window.innerHeight, width, height);
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(integerScale(window.innerWidth, window.innerHeight, width, height));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [width, height]);
  return scale;
}

export default function DosScreen({ rows, cols, background = 1, regionBackground, cursor }: DosScreenProps) {
  const width = cols * CELL_W;
  const height = rows.length * CELL_H;
  const scale = useViewportScale(width, height);

  return (
    <div className="dos-overscan">
      <div
        data-dos-screen
        aria-hidden="true"
        className="dos-screen"
        style={{
          width,
          height,
          backgroundColor: DOS_PALETTE[background] ?? DOS_PALETTE[1],
          transform: `scale(${scale})`,
        }}
      >
        {rows.map((row, r) => (
          <div
            data-dos-row
            key={r}
            className="dos-row"
            style={
              regionBackground !== undefined && r >= BANNER_ROWS
                ? { backgroundColor: DOS_PALETTE[regionBackground] ?? DOS_PALETTE[0] }
                : undefined
            }
          >
            {row.map((seg, i) => (
              <span key={i} style={{ color: DOS_PALETTE[seg.fg] ?? DOS_PALETTE[15] }}>
                {seg.text}
              </span>
            ))}
          </div>
        ))}
        {cursor && (
          <div
            data-dos-cursor
            className="dos-cursor"
            style={{ ['--row' as string]: String(cursor.row), ['--col' as string]: String(cursor.col) }}
          />
        )}
      </div>
    </div>
  );
}
