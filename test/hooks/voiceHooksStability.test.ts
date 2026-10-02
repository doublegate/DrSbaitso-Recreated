/**
 * Regression tests for the render loop that took down production: inline
 * callbacks passed by App must not recreate recognisers or re-run effects.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceControl } from '@/hooks/useVoiceControl';

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRecognition.instances.push(this);
  }
}

const finalResult = (text: string) => ({
  resultIndex: 0,
  results: [Object.assign([{ transcript: text, confidence: 1 }], { isFinal: true })],
});

describe('voice hook stability', () => {
  // test/setup.ts defines these as writable but non-configurable globals.
  const g = globalThis as any;
  const original = { std: g.SpeechRecognition, webkit: g.webkitSpeechRecognition };

  beforeEach(() => {
    FakeRecognition.instances = [];
    g.SpeechRecognition = FakeRecognition;
    g.webkitSpeechRecognition = FakeRecognition;
  });

  afterEach(() => {
    g.SpeechRecognition = original.std;
    g.webkitSpeechRecognition = original.webkit;
  });

  it('useVoiceRecognition keeps one recogniser across re-renders with new callbacks', () => {
    const calls: string[] = [];
    const { rerender } = renderHook(({ tag }) => useVoiceRecognition({ onResult: (t) => calls.push(`${tag}:${t}`) }), {
      initialProps: { tag: 'a' },
    });
    const created = FakeRecognition.instances.length;
    rerender({ tag: 'b' });
    rerender({ tag: 'c' });
    expect(FakeRecognition.instances.length).toBe(created);

    act(() => FakeRecognition.instances.at(-1)!.onresult!(finalResult('hello')));
    expect(calls).toEqual(['c:hello']); // the latest callback runs
  });

  it('useVoiceControl settles instead of re-rendering forever with inline handlers', () => {
    let renders = 0;
    const { rerender, result } = renderHook(() => {
      renders += 1;
      return useVoiceControl({ onClear: () => {}, onExport: () => {}, onHelp: () => {} });
    });
    const settled = renders;
    expect(settled).toBeLessThan(10);
    rerender();
    rerender();
    expect(renders - settled).toBeLessThanOrEqual(2 * 2); // StrictMode-free: at most 2 per rerender
    expect(result.current.commands.map((c) => c.id)).toEqual(expect.arrayContaining(['clear', 'export']));
  });

  it('useVoiceControl command actions call the latest handler', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, result } = renderHook(({ onClear }) => useVoiceControl({ onClear }), {
      initialProps: { onClear: first },
    });
    rerender({ onClear: second });
    act(() => result.current.commands.find((c) => c.id === 'clear')!.action());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('hands-free mode restarts wake-word listening when the browser ends it', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useVoiceControl({ onClear: () => {} }));
      act(() => result.current.enableHandsFreeMode());
      const wake = FakeRecognition.instances.find((r) => r.continuous)!;
      expect(wake.start).toHaveBeenCalledTimes(1);

      act(() => wake.onstart!());
      act(() => wake.onend!()); // Chrome stops continuous recognition after silence
      act(() => vi.advanceTimersByTime(1000));
      expect(wake.start).toHaveBeenCalledTimes(2);

      // Once hands-free is turned off, an end event must not restart it.
      act(() => result.current.disableHandsFreeMode());
      act(() => wake.onend!());
      act(() => vi.advanceTimersByTime(1000));
      expect(wake.start).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('useVoiceControl rebuilds commands when the set of handlers changes', () => {
    const { rerender, result } = renderHook(
      ({ withExport }) =>
        useVoiceControl(withExport ? { onClear: () => {}, onExport: () => {} } : { onClear: () => {} }),
      { initialProps: { withExport: false } },
    );
    expect(result.current.commands.some((c) => c.id === 'export')).toBe(false);
    rerender({ withExport: true });
    expect(result.current.commands.some((c) => c.id === 'export')).toBe(true);
  });
});
