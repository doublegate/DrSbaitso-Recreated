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
    const { result, rerender } = renderHook(({ m }) => useSessionHistory(m, opts), {
      initialProps: { m: msgs('hi', 'WHY?') },
    });
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

  describe('mergeSessions (cloud sync)', () => {
    const remote = (id: string, updatedAt: number, text = 'remote') => ({
      ...SessionManager.createSession('sbaitso', 'dos-blue', 'authentic'),
      id,
      updatedAt,
      messages: msgs(text),
      messageCount: 1,
    });

    it('stores nothing while history is off', () => {
      const { result } = renderHook(() => useSessionHistory([], opts));
      let merged = -1;
      act(() => {
        merged = result.current.mergeSessions([remote('a', 5)]);
      });
      expect(merged).toBe(0);
      expect(SessionManager.getAllSessions()).toEqual([]);
    });

    it('adds unknown sessions and replaces older copies, keeping newer local ones', () => {
      localStorage.setItem(KEEP_HISTORY_KEY, 'true');
      SessionManager.mergeSessions([remote('old', 1, 'local old'), remote('new', 9, 'local new')]);
      const { result } = renderHook(() => useSessionHistory([], opts));
      let merged = -1;
      act(() => {
        merged = result.current.mergeSessions([
          remote('old', 5, 'cloud'),
          remote('new', 2, 'stale'),
          remote('extra', 3),
        ]);
      });
      expect(merged).toBe(2);
      const byId = Object.fromEntries(result.current.savedSessions.map((s) => [s.id, s.messages[0].text]));
      expect(byId).toEqual({ old: 'cloud', new: 'local new', extra: 'remote' });
    });
  });

  describe('all-time statistics', () => {
    it('counts a conversation once when it ends, while history is on', () => {
      localStorage.setItem(KEEP_HISTORY_KEY, 'true');
      const { rerender } = renderHook(({ m }) => useSessionHistory(m, opts), {
        initialProps: { m: msgs('hi', 'WHY?', 'because') },
      });
      rerender({ m: [] }); // cleared: the conversation ended
      const stats = SessionManager.getStats();
      expect(stats.totalSessions).toBe(1);
      expect(stats.totalMessages).toBe(3);
      expect(stats.charactersUsed).toEqual({ sbaitso: 1 });
    });

    it('counts the open conversation when the page is closed, but only once', () => {
      localStorage.setItem(KEEP_HISTORY_KEY, 'true');
      renderHook(() => useSessionHistory(msgs('hi', 'WHY?'), opts));
      act(() => {
        window.dispatchEvent(new Event('pagehide'));
        window.dispatchEvent(new Event('pagehide'));
      });
      expect(SessionManager.getStats().totalSessions).toBe(1);
    });

    it('records nothing while history is off', () => {
      const { rerender } = renderHook(({ m }) => useSessionHistory(m, opts), {
        initialProps: { m: msgs('hi', 'WHY?') },
      });
      rerender({ m: [] });
      act(() => window.dispatchEvent(new Event('pagehide')));
      expect(SessionManager.getStats().totalSessions).toBe(0);
    });

    it('erases the totals when history is turned off', () => {
      localStorage.setItem(KEEP_HISTORY_KEY, 'true');
      const { result, rerender } = renderHook(({ m }) => useSessionHistory(m, opts), {
        initialProps: { m: msgs('hi', 'WHY?') },
      });
      rerender({ m: [] });
      expect(SessionManager.getStats().totalSessions).toBe(1);
      act(() => result.current.setKeepHistory(false));
      expect(SessionManager.getStats().totalSessions).toBe(0);
    });
  });
});
