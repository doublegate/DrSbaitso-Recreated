/**
 * Timing for lines that share one synthesised clip.
 *
 * The original prints a line, speaks it, and prints the next line when that
 * speech ends (ref-docs/04 section 1). The app synthesises a whole reply in a
 * single TTS request, so each line's start inside the clip is estimated from
 * its share of the characters: the lines are joined with single spaces, and a
 * line's offset is where its text begins in that joined string.
 */

/**
 * Start of each line as a fraction (0 <= x < 1) of the joined speech. Lines
 * with nothing to say (blank rows) take the offset of the next spoken line,
 * so they appear together with it, as the original's blank rows add no pause.
 */
export function cueOffsets(spoken: readonly string[]): number[] {
  const parts = spoken.map((line) => line.trim());
  const total = parts.filter(Boolean).join(' ').length;
  if (total === 0) return parts.map(() => 0);
  let position = 0;
  let first = true;
  return parts.map((part) => {
    if (!part) return Math.min(position + (first ? 0 : 1), total - 1) / total;
    const start = position + (first ? 0 : 1);
    position = start + part.length;
    first = false;
    return start / total;
  });
}
