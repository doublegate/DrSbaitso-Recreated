/**
 * Best-of-`runs` CPU time of `fn` in milliseconds, for performance budgets.
 *
 * Wall-clock time is unreliable here: the suite runs test files in parallel
 * worker processes, so a measured section can be preempted for longer than it
 * computes. CPU time of this process excludes that wait.
 */
export function bestCpuMs(fn: () => void, runs = 3): number {
  fn(); // warm up the JIT
  let best = Infinity;
  for (let run = 0; run < runs; run++) {
    const start = process.cpuUsage();
    fn();
    const used = process.cpuUsage(start);
    best = Math.min(best, (used.user + used.system) / 1000);
  }
  return best;
}
