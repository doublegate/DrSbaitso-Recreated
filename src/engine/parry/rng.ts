/**
 * mulberry32: a tiny seeded PRNG. The state is a plain uint32 kept inside
 * `ParryState`, so stepping it is a pure function and a saved state replays
 * exactly.
 */
export function nextRandom(state: number): [value: number, next: number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

/** Normalise any number to a uint32 seed. */
export function seedFrom(seed: number): number {
  return Math.trunc(seed) >>> 0;
}
