import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMusicMood } from '@/hooks/useMusicMood';
import { musicEngine } from '@/utils/musicEngine';
import type { Message } from '@/types';

vi.mock('@/utils/musicEngine', () => ({ musicEngine: { setSentiment: vi.fn() } }));

const user = (text: string): Message => ({ author: 'user', text });
const dr = (text: string): Message => ({ author: 'dr', text });

describe('useMusicMood', () => {
  beforeEach(() => vi.mocked(musicEngine.setSentiment).mockClear());

  it("feeds the user's recent sentiment to the music once a turn has finished", () => {
    const { rerender } = renderHook(({ messages, busy }) => useMusicMood(messages, busy), {
      initialProps: { messages: [user('I feel sad and terrible')], busy: true },
    });
    expect(musicEngine.setSentiment).not.toHaveBeenCalled();
    rerender({ messages: [user('I feel sad and terrible'), dr('WHY?')], busy: false });
    const score = vi.mocked(musicEngine.setSentiment).mock.calls.at(-1)![0];
    expect(score).toBeLessThan(0);
    expect(score).toBeGreaterThanOrEqual(-1);
  });
});
