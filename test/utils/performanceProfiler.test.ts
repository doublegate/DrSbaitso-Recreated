import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PerformanceProfiler,
  globalProfiler,
  profile,
  isProfilingRequested,
  observeCoreWebVitals,
  getCoreWebVitals,
  initDevProfiler,
  formatVitals,
} from '@/utils/performanceProfiler';

describe('PerformanceProfiler', () => {
  it('aggregates repeated and overlapping timings per name', () => {
    const profiler = new PerformanceProfiler();
    profiler.record('op', 10);
    profiler.record('op', 30);
    const stats = profiler.getStats('op');
    expect(stats).toMatchObject({ count: 2, totalMs: 40, maxMs: 30, minMs: 10 });
    expect(stats?.avgMs).toBe(20);
  });

  it('records nothing while disabled', () => {
    const profiler = new PerformanceProfiler(false);
    profiler.record('op', 5);
    profiler.start('x');
    expect(profiler.end('x')).toBeNull();
    expect(profiler.getStats('op')).toBeUndefined();
  });

  it('does not log every measurement to the console', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const profiler = new PerformanceProfiler(true);
    profiler.start('quiet');
    profiler.end('quiet');
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

describe('profile decorator', () => {
  beforeEach(() => {
    globalProfiler.clear();
    globalProfiler.setEnabled(true);
  });
  afterEach(() => globalProfiler.setEnabled(false));

  it('times sync methods (legacy experimentalDecorators form)', () => {
    class Worker {
      run(n: number) {
        return n * 2;
      }
    }
    const descriptor = Object.getOwnPropertyDescriptor(Worker.prototype, 'run')!;
    Object.defineProperty(Worker.prototype, 'run', profile()(Worker.prototype, 'run', descriptor));
    expect(new Worker().run(21)).toBe(42);
    expect(globalProfiler.getStats('Worker.run')?.count).toBe(1);
  });

  it('times async methods including overlapping calls (standard decorator form)', async () => {
    const wait = async (ms: number) => {
      await new Promise((r) => setTimeout(r, ms));
      return ms;
    };
    const decorated = profile('fetch')(wait, { kind: 'method', name: 'wait' } as ClassMethodDecoratorContext);
    await Promise.all([decorated(5), decorated(1)]);
    expect(globalProfiler.getStats('fetch')?.count).toBe(2);
  });

  it('records the call even when the method throws', () => {
    const boom = () => {
      throw new Error('x');
    };
    const decorated = profile('boom')(boom, { kind: 'method', name: 'boom' } as ClassMethodDecoratorContext);
    expect(() => decorated()).toThrow('x');
    expect(globalProfiler.getStats('boom')?.count).toBe(1);
  });
});

describe('isProfilingRequested', () => {
  it('is on in development builds', () => {
    expect(isProfilingRequested(true, '')).toBe(true);
  });
  it('is on with ?profile=1 in production', () => {
    expect(isProfilingRequested(false, '?profile=1')).toBe(true);
  });
  it('is off otherwise', () => {
    expect(isProfilingRequested(false, '')).toBe(false);
    expect(isProfilingRequested(false, '?profile=0')).toBe(false);
  });
});

describe('Core Web Vitals', () => {
  type Entry = Record<string, unknown>;
  let observers: { type: string; cb: (list: { getEntries: () => Entry[] }) => void }[];

  beforeEach(() => {
    observers = [];
    class FakeObserver {
      static supportedEntryTypes = ['largest-contentful-paint', 'layout-shift', 'event', 'paint', 'navigation'];
      constructor(private cb: (list: { getEntries: () => Entry[] }) => void) {}
      observe(options: { type: string }) {
        observers.push({ type: options.type, cb: this.cb });
      }
      disconnect() {}
    }
    vi.stubGlobal('PerformanceObserver', FakeObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  const emit = (type: string, entries: Entry[]) =>
    observers.filter((o) => o.type === type).forEach((o) => o.cb({ getEntries: () => entries }));

  it('tracks LCP, CLS (ignoring input-driven shifts) and INP', () => {
    const stop = observeCoreWebVitals();
    emit('largest-contentful-paint', [{ startTime: 800 }, { startTime: 1200 }]);
    emit('layout-shift', [
      { value: 0.05, hadRecentInput: false },
      { value: 0.5, hadRecentInput: true },
      { value: 0.02, hadRecentInput: false },
    ]);
    emit('event', [
      { duration: 40, interactionId: 1 },
      { duration: 180, interactionId: 2 },
      { duration: 999, interactionId: 0 },
    ]);
    const vitals = getCoreWebVitals();
    expect(vitals.lcp).toBe(1200);
    expect(vitals.cls).toBeCloseTo(0.07);
    expect(vitals.inp).toBe(180);
    stop();
  });

  it('formats a readable summary', () => {
    expect(formatVitals({ lcp: 1234.5, cls: 0.0712, inp: 180 })).toContain('LCP 1235 ms');
    expect(formatVitals({ lcp: 1234.5, cls: 0.0712, inp: 180 })).toContain('CLS 0.071');
  });
});

describe('initDevProfiler', () => {
  afterEach(() => {
    document.getElementById('perf-overlay')?.remove();
    globalProfiler.setEnabled(false);
  });

  it('shows the overlay only when asked for with ?profile=1', () => {
    const stop = initDevProfiler({ search: '?profile=1', reportDelayMs: 0 });
    expect(document.getElementById('perf-overlay')).not.toBeNull();
    expect(globalProfiler.isActive()).toBe(true);
    stop();
    expect(document.getElementById('perf-overlay')).toBeNull();
  });

  it('only reports to the console in development', () => {
    const stop = initDevProfiler({ search: '', reportDelayMs: 0 });
    expect(document.getElementById('perf-overlay')).toBeNull();
    stop();
  });
});
