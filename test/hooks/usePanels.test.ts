import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanels, ONBOARDING_COMPLETED_KEY } from '@/hooks/usePanels';
import type { ConversationSession } from '@/types';

const session = { id: 's1', messages: [], updatedAt: 1 } as unknown as ConversationSession;

describe('usePanels', () => {
  beforeEach(() => localStorage.clear());

  it('starts with every panel closed except the first-run tutorial', () => {
    const { result } = renderHook(() => usePanels());
    const openIds = Object.entries(result.current.open).filter(([, v]) => v).map(([k]) => k);
    expect(openIds).toEqual(['onboarding']);
    expect(result.current.replaySession).toBeNull();
  });

  it('keeps the tutorial closed once it has been completed', () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    const { result } = renderHook(() => usePanels());
    expect(result.current.open.onboarding).toBe(false);
  });

  it('shows, hides and toggles a panel by id', () => {
    const { result } = renderHook(() => usePanels());
    act(() => result.current.show('insights'));
    expect(result.current.open.insights).toBe(true);
    act(() => result.current.hide('insights'));
    expect(result.current.open.insights).toBe(false);
    act(() => result.current.toggle('emotionViz'));
    act(() => result.current.toggle('emotionViz'));
    act(() => result.current.toggle('emotionViz'));
    expect(result.current.open.emotionViz).toBe(true);
    act(() => result.current.setPanel('audioVisualizer', true));
    expect(result.current.open.audioVisualizer).toBe(true);
  });

  it('keeps the same state object when a panel is set to its current value', () => {
    const { result } = renderHook(() => usePanels());
    const before = result.current.open;
    act(() => result.current.hide('templates'));
    expect(result.current.open).toBe(before);
  });

  it('opens a replay from search and clears it on close', () => {
    const { result } = renderHook(() => usePanels());
    act(() => result.current.show('conversationSearch'));
    act(() => result.current.openReplay(session));
    expect(result.current.open.conversationReplay).toBe(true);
    expect(result.current.open.conversationSearch).toBe(false);
    expect(result.current.replaySession).toBe(session);
    act(() => result.current.closeReplay());
    expect(result.current.open.conversationReplay).toBe(false);
    expect(result.current.replaySession).toBeNull();
  });

  it('returns stable actions across renders', () => {
    const { result, rerender } = renderHook(() => usePanels());
    const { show, hide, toggle, setPanel } = result.current;
    rerender();
    expect(result.current.show).toBe(show);
    expect(result.current.hide).toBe(hide);
    expect(result.current.toggle).toBe(toggle);
    expect(result.current.setPanel).toBe(setPanel);
  });
});
