/**
 * Performance Profiling Utilities (v1.11.0 - Option D3)
 *
 * Provides performance monitoring, profiling, and benchmarking tools.
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMark {
  name: string;
  timestamp: number;
}

/**
 * Performance Profiler Class
 */
export class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private marks: PerformanceMark[] = [];
  private isEnabled: boolean = true;

  /**
   * Start timing a metric
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });

    // Use Performance API if available
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End timing a metric
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PerformanceProfiler] Metric "${name}" not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Use Performance API if available
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Ignore errors
      }
    }

    console.log(`[PerformanceProfiler] ${name}: ${duration.toFixed(2)}ms`, metric.metadata);

    return duration;
  }

  /**
   * Mark a point in time
   */
  mark(name: string): void {
    if (!this.isEnabled) return;

    this.marks.push({
      name,
      timestamp: performance.now()
    });

    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get marks
   */
  getMarks(): PerformanceMark[] {
    return this.marks;
  }

  /**
   * Clear all metrics and marks
   */
  clear(): void {
    this.metrics.clear();
    this.marks = [];

    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  /**
   * Enable/disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get performance report
   */
  getReport(): {
    metrics: PerformanceMetric[];
    marks: PerformanceMark[];
    summary: {
      totalMetrics: number;
      totalMarks: number;
      avgDuration: number;
      maxDuration: number;
      minDuration: number;
    };
  } {
    const completedMetrics = Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
    const durations = completedMetrics.map(m => m.duration!);

    return {
      metrics: completedMetrics,
      marks: this.marks,
      summary: {
        totalMetrics: completedMetrics.length,
        totalMarks: this.marks.length,
        avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
        minDuration: durations.length > 0 ? Math.min(...durations) : 0
      }
    };
  }

  /**
   * Export report as JSON
   */
  exportReport(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

/**
 * Global profiler instance
 */
export const globalProfiler = new PerformanceProfiler();

/**
 * Measure function execution time
 */
export function measureFn<T>(name: string, fn: () => T): T {
  globalProfiler.start(name);
  try {
    const result = fn();
    return result;
  } finally {
    globalProfiler.end(name);
  }
}

/**
 * Measure async function execution time
 */
export async function measureAsyncFn<T>(name: string, fn: () => Promise<T>): Promise<T> {
  globalProfiler.start(name);
  try {
    const result = await fn();
    return result;
  } finally {
    globalProfiler.end(name);
  }
}

/**
 * Performance decorator
 */
export function performance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      globalProfiler.start(metricName);
      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result.finally(() => globalProfiler.end(metricName));
        }

        globalProfiler.end(metricName);
        return result;
      } catch (error) {
        globalProfiler.end(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Get Core Web Vitals
 */
export function getCoreWebVitals(): {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
} {
  const vitals: any = {};

  if ('PerformanceObserver' in window) {
    try {
      // FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as any;
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }

      // TTFB
      const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
      if (navigationEntry) {
        vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      }
    } catch (e) {
      console.warn('[PerformanceProfiler] Failed to get Core Web Vitals:', e);
    }
  }

  return vitals;
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} | null {
  const memory = (performance as any).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit
  };
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const report = globalProfiler.getReport();

  console.group('📊 Performance Summary');
  console.log('Total Metrics:', report.summary.totalMetrics);
  console.log('Total Marks:', report.summary.totalMarks);
  console.log('Average Duration:', report.summary.avgDuration.toFixed(2) + 'ms');
  console.log('Max Duration:', report.summary.maxDuration.toFixed(2) + 'ms');
  console.log('Min Duration:', report.summary.minDuration.toFixed(2) + 'ms');

  console.group('Core Web Vitals');
  const vitals = getCoreWebVitals();
  console.log('FCP:', vitals.fcp ? vitals.fcp.toFixed(2) + 'ms' : 'N/A');
  console.log('TTFB:', vitals.ttfb ? vitals.ttfb.toFixed(2) + 'ms' : 'N/A');
  console.groupEnd();

  const memory = getMemoryUsage();
  if (memory) {
    console.group('Memory Usage');
    console.log('Used JS Heap:', (memory.usedJSHeapSize! / 1024 / 1024).toFixed(2) + 'MB');
    console.log('Total JS Heap:', (memory.totalJSHeapSize! / 1024 / 1024).toFixed(2) + 'MB');
    console.log('Heap Limit:', (memory.jsHeapSizeLimit! / 1024 / 1024).toFixed(2) + 'MB');
    console.groupEnd();
  }

  console.groupEnd();
}

export default {
  PerformanceProfiler,
  globalProfiler,
  measureFn,
  measureAsyncFn,
  getCoreWebVitals,
  getMemoryUsage,
  logPerformanceSummary
};
