/**
 * Performance Profiling Utilities
 *
 * - {@link PerformanceProfiler}: named timings, aggregated per name (count,
 *   total, min, max), mirrored to the User Timing API so they show up in the
 *   browser's Performance panel.
 * - {@link profile}: method decorator (legacy `experimentalDecorators` and
 *   standard TC39 forms) that times every call, sync or async.
 * - Core Web Vitals (LCP, CLS, INP, FCP, TTFB) via PerformanceObserver.
 * - {@link initDevProfiler}: opt-in activation. src/index.tsx loads this module
 *   only when {@link isProfilingRequested} (dev build or `?profile=1`), so it
 *   costs nothing in normal production use. `?profile=1` also shows a small
 *   on-screen overlay; both modes print a console report.
 *
 * The global profiler is disabled until activated, so instrumented code is
 * a near no-op otherwise.
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMark {
  name: string;
  timestamp: number;
}

export interface MetricStats {
  name: string;
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  lastMs: number;
}

const hasUserTiming = () =>
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.measure === 'function';

/**
 * Performance Profiler Class
 */
export class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private stats: Map<string, MetricStats> = new Map();
  private marks: PerformanceMark[] = [];
  private isEnabled: boolean;

  constructor(enabled: boolean = true) {
    this.isEnabled = enabled;
  }

  /**
   * Start timing a metric. Overlapping runs of the same name overwrite each
   * other; use {@link record} (or {@link profile}) for concurrent work.
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;
    this.metrics.set(name, { name, startTime: performance.now(), metadata });
  }

  /**
   * End timing a metric and return its duration in ms (null if not started
   * or disabled).
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric || metric.endTime !== undefined) {
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    this.addSample(name, metric.duration, metric.startTime);
    return metric.duration;
  }

  /** Records an externally measured duration (safe for concurrent calls). */
  record(name: string, durationMs: number, startTime: number = performance.now() - durationMs): void {
    if (!this.isEnabled || !Number.isFinite(durationMs)) return;
    this.metrics.set(name, { name, startTime, endTime: startTime + durationMs, duration: durationMs });
    this.addSample(name, durationMs, startTime);
  }

  private addSample(name: string, durationMs: number, startTime: number): void {
    const previous = this.stats.get(name);
    const count = (previous?.count ?? 0) + 1;
    const totalMs = (previous?.totalMs ?? 0) + durationMs;
    this.stats.set(name, {
      name,
      count,
      totalMs,
      minMs: Math.min(previous?.minMs ?? Infinity, durationMs),
      maxMs: Math.max(previous?.maxMs ?? -Infinity, durationMs),
      avgMs: totalMs / count,
      lastMs: durationMs,
    });

    if (hasUserTiming()) {
      try {
        performance.measure(name, { start: startTime, duration: durationMs });
      } catch {
        // Older browsers without the options form: the in-memory stats suffice.
      }
    }
  }

  /**
   * Mark a point in time
   */
  mark(name: string): void {
    if (!this.isEnabled) return;
    this.marks.push({ name, timestamp: performance.now() });
    if (hasUserTiming()) performance.mark(name);
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  getStats(name: string): MetricStats | undefined {
    const stats = this.stats.get(name);
    return stats ? { ...stats } : undefined;
  }

  getAllStats(): MetricStats[] {
    return Array.from(this.stats.values(), (s) => ({ ...s }));
  }

  getMarks(): PerformanceMark[] {
    return [...this.marks];
  }

  /**
   * Clear all metrics and marks (only the profiler's own, not the page's).
   */
  clear(): void {
    this.metrics.clear();
    this.stats.clear();
    this.marks = [];
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Get performance report
   */
  getReport(): {
    metrics: PerformanceMetric[];
    stats: MetricStats[];
    marks: PerformanceMark[];
    summary: {
      totalMetrics: number;
      totalMarks: number;
      avgDuration: number;
      maxDuration: number;
      minDuration: number;
    };
  } {
    const stats = this.getAllStats();
    const samples = stats.reduce((n, s) => n + s.count, 0);
    const total = stats.reduce((n, s) => n + s.totalMs, 0);

    return {
      metrics: this.getAllMetrics().filter((m) => m.duration !== undefined),
      stats,
      marks: this.getMarks(),
      summary: {
        totalMetrics: samples,
        totalMarks: this.marks.length,
        avgDuration: samples > 0 ? total / samples : 0,
        maxDuration: stats.length > 0 ? Math.max(...stats.map((s) => s.maxMs)) : 0,
        minDuration: stats.length > 0 ? Math.min(...stats.map((s) => s.minMs)) : 0,
      },
    };
  }

  exportReport(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

/**
 * Global profiler instance: disabled until {@link initDevProfiler} (or
 * `globalProfiler.setEnabled(true)`) turns it on.
 */
export const globalProfiler = new PerformanceProfiler(false);

/**
 * Measure function execution time
 */
export function measureFn<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    globalProfiler.record(name, performance.now() - start, start);
  }
}

/**
 * Measure async function execution time
 */
export async function measureAsyncFn<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    globalProfiler.record(name, performance.now() - start, start);
  }
}

type AnyMethod = (this: unknown, ...args: unknown[]) => unknown;

function timed(metricName: string, original: AnyMethod): AnyMethod {
  return function (this: unknown, ...args: unknown[]) {
    if (!globalProfiler.isActive()) return original.apply(this, args);
    const start = performance.now();
    const done = () => globalProfiler.record(metricName, performance.now() - start, start);
    try {
      const result = original.apply(this, args);
      if (result instanceof Promise) {
        return result.finally(done);
      }
      done();
      return result;
    } catch (error) {
      done();
      throw error;
    }
  };
}

/**
 * Method decorator that records a timing metric for each call.
 * (Named `profile`, not `performance`, so it does not shadow the global
 * `performance` API that the profiler itself relies on.)
 *
 * Works with `experimentalDecorators` (target, key, descriptor) and with
 * standard decorators (method, context). Concurrent async calls are each
 * timed correctly.
 */
export function profile(name?: string) {
  // Both forms share one implementation; the overloads keep call sites typed.
  function decorator(target: object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
  function decorator<T extends (...args: never[]) => unknown>(value: T, context: ClassMethodDecoratorContext): T;
  function decorator(
    targetOrValue: unknown,
    keyOrContext: string | ClassMethodDecoratorContext,
    descriptor?: PropertyDescriptor,
  ): unknown {
    if (typeof keyOrContext === 'object' && keyOrContext !== null && 'kind' in keyOrContext) {
      const metricName = name ?? String(keyOrContext.name);
      return timed(metricName, targetOrValue as AnyMethod);
    }
    const target = targetOrValue as { constructor: { name: string } };
    const metricName = name ?? `${target.constructor.name}.${String(keyOrContext)}`;
    if (descriptor && typeof descriptor.value === 'function') {
      descriptor.value = timed(metricName, descriptor.value as AnyMethod);
    }
    return descriptor;
  }
  return decorator;
}

// ---------------------------------------------------------------------------
// Core Web Vitals
// ---------------------------------------------------------------------------

export interface CoreWebVitals {
  fcp?: number; // First Contentful Paint (ms)
  lcp?: number; // Largest Contentful Paint (ms)
  cls?: number; // Cumulative Layout Shift (unitless)
  inp?: number; // Interaction to Next Paint (ms, worst interaction seen)
  fid?: number; // First Input Delay (ms), where INP is unsupported
  ttfb?: number; // Time to First Byte (ms)
}

const observedVitals: CoreWebVitals = {};

interface VitalsEntry {
  startTime?: number;
  duration?: number;
  value?: number;
  hadRecentInput?: boolean;
  interactionId?: number;
  processingStart?: number;
}

/**
 * Starts PerformanceObservers for LCP, CLS and INP (buffered, so values from
 * before the call are included). Returns a function that disconnects them.
 */
export function observeCoreWebVitals(onUpdate?: (vitals: CoreWebVitals) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {};
  const supported: readonly string[] = PerformanceObserver.supportedEntryTypes ?? [];
  const observers: PerformanceObserver[] = [];

  const watch = (type: string, handle: (entries: VitalsEntry[]) => void, extra: Record<string, unknown> = {}) => {
    if (!supported.includes(type)) return;
    try {
      const observer = new PerformanceObserver((list) => {
        handle(list.getEntries() as unknown as VitalsEntry[]);
        onUpdate?.(getCoreWebVitals());
      });
      observer.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
      observers.push(observer);
    } catch {
      // Entry type not observable in this browser.
    }
  };

  watch('largest-contentful-paint', (entries) => {
    const last = entries.at(-1);
    if (last?.startTime !== undefined) observedVitals.lcp = last.startTime;
  });
  watch('layout-shift', (entries) => {
    for (const entry of entries) {
      if (!entry.hadRecentInput && typeof entry.value === 'number') {
        observedVitals.cls = (observedVitals.cls ?? 0) + entry.value;
      }
    }
  });
  watch(
    'event',
    (entries) => {
      for (const entry of entries) {
        if (entry.interactionId && typeof entry.duration === 'number') {
          observedVitals.inp = Math.max(observedVitals.inp ?? 0, entry.duration);
        }
      }
    },
    { durationThreshold: 40 },
  );
  if (!supported.includes('event')) {
    watch('first-input', (entries) => {
      const first = entries[0];
      if (first?.processingStart !== undefined && first.startTime !== undefined) {
        observedVitals.fid = first.processingStart - first.startTime;
      }
    });
  }

  return () => observers.forEach((o) => o.disconnect());
}

/**
 * Current Core Web Vitals: FCP and TTFB from the performance timeline, LCP,
 * CLS and INP from {@link observeCoreWebVitals} (absent until it runs).
 */
export function getCoreWebVitals(): CoreWebVitals {
  const vitals: CoreWebVitals = { ...observedVitals };
  if (typeof performance === 'undefined' || typeof performance.getEntriesByName !== 'function') return vitals;

  try {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcp) vitals.fcp = fcp.startTime;

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) vitals.ttfb = nav.responseStart - nav.startTime;
  } catch (e) {
    console.warn('[PerformanceProfiler] Failed to read Core Web Vitals:', e);
  }
  return vitals;
}

/** One-line summary, e.g. "LCP 1235 ms | CLS 0.071 | INP 180 ms". */
export function formatVitals(vitals: CoreWebVitals): string {
  const ms = (v?: number) => (v === undefined ? 'n/a' : `${Math.round(v)} ms`);
  return [
    `LCP ${ms(vitals.lcp)}`,
    `CLS ${vitals.cls === undefined ? 'n/a' : vitals.cls.toFixed(3)}`,
    vitals.inp !== undefined || vitals.fid === undefined ? `INP ${ms(vitals.inp)}` : `FID ${ms(vitals.fid)}`,
    `FCP ${ms(vitals.fcp)}`,
    `TTFB ${ms(vitals.ttfb)}`,
  ].join(' | ');
}

/**
 * Get memory usage (Chromium only)
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} | null {
  const memory = (
    performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
    }
  ).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const report = globalProfiler.getReport();

  console.groupCollapsed('[profiler] Performance summary');
  console.log('Core Web Vitals:', formatVitals(getCoreWebVitals()));
  if (report.stats.length > 0) {
    console.table(
      report.stats.map((s) => ({
        name: s.name,
        calls: s.count,
        'avg ms': Number(s.avgMs.toFixed(2)),
        'max ms': Number(s.maxMs.toFixed(2)),
      })),
    );
  } else {
    console.log('No profiled calls yet (use profile(), measureFn() or measureAsyncFn()).');
  }

  const memory = getMemoryUsage();
  if (memory?.usedJSHeapSize !== undefined) {
    console.log('JS heap:', `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`);
  }
  console.groupEnd();
}

// ---------------------------------------------------------------------------
// Opt-in activation
// ---------------------------------------------------------------------------

/** True in development builds, or when the URL carries `?profile=1`. */
export function isProfilingRequested(isDev: boolean, search: string): boolean {
  if (isDev) return true;
  return new URLSearchParams(search).get('profile') === '1';
}

export interface DevProfilerOptions {
  /** location.search; `?profile=1` adds the on-screen overlay. */
  search?: string;
  /** Delay before the first console report. */
  reportDelayMs?: number;
}

const OVERLAY_ID = 'perf-overlay';

function createOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    right: '8px',
    bottom: '8px',
    zIndex: '2147483647',
    padding: '4px 8px',
    font: '11px/1.4 monospace',
    color: '#0f0',
    background: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid #0f0',
    pointerEvents: 'none',
    whiteSpace: 'pre',
  });
  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Turns the global profiler on, observes Core Web Vitals, prints a console
 * report after load and whenever the page is hidden, and exposes
 * `window.sbaitsoProfiler` (with `.report()`) for ad-hoc use. With
 * `?profile=1` a small overlay shows live vitals. Returns a stop function.
 */
export function initDevProfiler(options: DevProfilerOptions = {}): () => void {
  const search = options.search ?? (typeof location === 'undefined' ? '' : location.search);
  const showOverlay = new URLSearchParams(search).get('profile') === '1';

  globalProfiler.setEnabled(true);
  const overlay = showOverlay ? createOverlay() : null;
  const render = (vitals: CoreWebVitals) => {
    if (!overlay) return;
    const heap = getMemoryUsage()?.usedJSHeapSize;
    overlay.textContent =
      formatVitals(vitals).split(' | ').join('\n') +
      (heap === undefined ? '' : `\nHeap ${(heap / 1024 / 1024).toFixed(1)} MB`);
  };

  const stopVitals = observeCoreWebVitals(render);
  render(getCoreWebVitals());
  const overlayTimer = overlay ? setInterval(() => render(getCoreWebVitals()), 2000) : null;
  const reportTimer = setTimeout(logPerformanceSummary, options.reportDelayMs ?? 5000);
  const onHidden = () => {
    if (document.visibilityState === 'hidden') logPerformanceSummary();
  };
  document.addEventListener('visibilitychange', onHidden);

  const api = { profiler: globalProfiler, report: logPerformanceSummary, vitals: getCoreWebVitals };
  (window as unknown as { sbaitsoProfiler?: typeof api }).sbaitsoProfiler = api;

  return () => {
    stopVitals();
    if (overlayTimer) clearInterval(overlayTimer);
    clearTimeout(reportTimer);
    document.removeEventListener('visibilitychange', onHidden);
    overlay?.remove();
    globalProfiler.setEnabled(false);
    delete (window as unknown as { sbaitsoProfiler?: typeof api }).sbaitsoProfiler;
  };
}

export default {
  PerformanceProfiler,
  globalProfiler,
  measureFn,
  measureAsyncFn,
  profile,
  getCoreWebVitals,
  observeCoreWebVitals,
  getMemoryUsage,
  logPerformanceSummary,
  initDevProfiler,
};
