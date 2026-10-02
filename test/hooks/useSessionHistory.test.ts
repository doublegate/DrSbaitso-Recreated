import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionHistory, KEEP_HISTORY_KEY } from '@/hooks/useSessionHistory';
import { SessionManager } from '@/utils/sessionManager';
import type { Message } from '@/types';

const msgs = (...texts: string[]): Message[] =>
  texts.map((text, i) => ({ author: i % 2 ? 'dr' : 'user', text, timestamp: 1000 + i, characterId: 'sbaitso' }));

const opts = { characterId: 'sbaitso', themeId: 'dos-blue', audioQualityId: 'authentic' };

describe('useSessionHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('is off by default, honouring "MEMORY CONTENTS WILL BE WIPED OFF"', () => {
    const { result, rerender } = renderHook(({ m }) => useSessionHistory(m, opts), { initialProps: { m: msgs('hi', 'WHY?') } });
    rerender({ m: msgs('hi', 'WHY?', 'because') });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.keepHistory).toBe(false);
    expect(SessionManager.getAllSessions()).toEqual([]);
    expect(localStorage.length).toBe(0);
  });

  it('still provides the current conversation as a session (for export)', () => {
    const { result } = renderHook(() => useSessionHistory(msgs('hi', 'WHY?'), opts));
    expect(result.current.currentSession?.messages).toHaveLength(2);
    expect(result.current.currentSession?.characterId).toBe('sbaitso');
  });

  it('saves the conversation once history is switched on, and lists it', () => {
    const { result, rerender } = renderHook(({ m }) => useSessionHistory(m, opts), { initialProps: { m: msgs('hi') } });
    act(() => result.current.setKeepHistory(true));
    rerender({ m: msgs('hi', 'WHY DO YOU SAY THAT?') });
    act(() => vi.advanceTimersByTime(2000));
    expect(localStorage.getItem(KEEP_HISTORY_KEY)).toBe('true');
    const saved = SessionManager.getAllSessions();
    expect(saved).toHaveLength(1);
    expect(saved[0].messages).toHaveLength(2);
    expect(result.current.savedSessions).toHaveLength(1);
  });

  it('updates the same session as the conversation grows', () => {
    localStorage.setItem(KEEP_HISTORY_KEY, 'true');
    const { rerender } = renderHook(({ m }) => useSessionHistory(m, opts), { initialProps: { m: msgs('a') } });
    act(() => vi.advanceTimersByTime(2000));
    rerender({ m: msgs('a', 'b', 'c') });
    act(() => vi.advanceTimersByTime(2000));
    const saved = SessionManager.getAllSessions();
    expect(saved).toHaveLength(1);
    expect(saved[0].messageCount).toBe(3);
  });

  it('turning history off erases what was saved', () => {
    localStorage.setItem(KEEP_HISTORY_KEY, 'true');
    const { result } = renderHook(() => useSessionHistory(msgs('a', 'b'), opts));
    act(() => vi.advanceTimersByTime(2000));
    expect(SessionManager.getAllSessions()).toHaveLength(1);
    act(() => result.current.setKeepHistory(false));
    expect(SessionManager.getAllSessions()).toEqual([]);
    expect(result.current.savedSessions).toEqual([]);
  });

  it('starts a new session after the conversation is cleared', () => {
    localStorage.setItem(KEEP_HISTORY_KEY, 'true');
    const { rerender } = renderHook(({ m }) => useSessionHistory(m, opts), { initialProps: { m: msgs('a', 'b') } });
    act(() => vi.advanceTimersByTime(2000));
    rerender({ m: [] });
    rerender({ m: msgs('new') });
    act(() => vi.advanceTimersByTime(2000));
    expect(SessionManager.getAllSessions()).toHaveLength(2);
  });
});
