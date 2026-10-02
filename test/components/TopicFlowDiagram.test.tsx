import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

const analyzeTopics = vi.fn((..._args: unknown[]) => ({ topics: [], transitions: [], dominantTopic: null }));
vi.mock('@/utils/topicAnalysis', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/topicAnalysis')>()),
  analyzeTopics: (...args: unknown[]) => analyzeTopics(...args),
}));

const { TopicFlowDiagram } = await import('@/components/TopicFlowDiagram');

const theme = { colors: { background: '#000', text: '#fff', border: '#888', accent: '#ff0' } };

describe('TopicFlowDiagram', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    analyzeTopics.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it('analyses once after a reply finishes typing, not on every character', () => {
    const reply = 'MY PROCESSOR IS SLOW TODAY';
    const base = [{ author: 'user', text: 'I hate my job' }];
    const { rerender } = render(<TopicFlowDiagram messages={[...base, { author: 'dr', text: '' }]} theme={theme} />);
    for (let i = 1; i <= reply.length; i++) {
      rerender(<TopicFlowDiagram messages={[...base, { author: 'dr', text: reply.slice(0, i) }]} theme={theme} />);
      act(() => vi.advanceTimersByTime(40));
    }
    act(() => vi.advanceTimersByTime(1000));
    expect(analyzeTopics).toHaveBeenCalledTimes(1);
    expect(analyzeTopics.mock.calls[0][0]).toEqual([...base, { author: 'dr', text: reply }]);
  });
});
