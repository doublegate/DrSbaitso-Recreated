/**
 * EmotionVisualizer tests against the real keyword detector (no mock), so the
 * component is held to the data shape detectEmotions actually returns:
 * { joy, anger, fear, sadness, surprise } on a 0-100 scale plus `dominant`.
 */
import { StrictMode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmotionVisualizer, EmotionBadge } from './EmotionVisualizer';
import { detectEmotions } from '@/utils/emotionDetection';

const theme = {
  colors: { background: '#1e3a8a', text: '#ffffff', border: '#60a5fa', accent: '#fbbf24' },
};

const user = (text: string) => ({ author: 'user', text });
const dr = (text: string) => ({ author: 'dr', text });

describe('EmotionVisualizer', () => {
  it('prompts for a conversation when there are no user messages', () => {
    render(<EmotionVisualizer messages={[dr('HELLO')]} theme={theme} />);
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it('renders the dominant emotion and its score for the latest user message', () => {
    const text = 'I am so sad and lonely and depressed';
    const expected = detectEmotions(text);
    render(<EmotionVisualizer messages={[user(text)]} theme={theme} />);

    expect(expected.dominant).toBe('sadness');
    expect(screen.getAllByText(/sadness/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${Math.round(expected.sadness)}%`).length).toBeGreaterThan(0);
  });

  it('shows one score bar per emotion, each within 0-100%', () => {
    render(<EmotionVisualizer messages={[user('I am happy but also a little scared')]} theme={theme} />);
    for (const emotion of ['joy', 'anger', 'fear', 'sadness', 'surprise']) {
      const bar = screen.getByTestId(`emotion-bar-${emotion}`);
      const width = parseFloat(bar.style.width);
      expect(width).toBeGreaterThanOrEqual(0);
      expect(width).toBeLessThanOrEqual(100);
    }
  });

  it('backfills history from messages that existed before the panel opened', () => {
    render(
      <EmotionVisualizer
        messages={[user('I am happy'), dr('WHY?'), user('I am angry now'), dr('TELL ME MORE')]}
        theme={theme}
      />,
    );
    expect(screen.getByText('Messages analyzed: 2')).toBeInTheDocument();
  });

  it('caps history at maxHistory', () => {
    const messages = Array.from({ length: 8 }, (_, i) => user(`happy ${i}`));
    render(<EmotionVisualizer messages={messages} theme={theme} maxHistory={5} />);
    expect(screen.getByText('Messages analyzed: 5')).toBeInTheDocument();
  });

  it('does not double-count messages under StrictMode', () => {
    render(
      <StrictMode>
        <EmotionVisualizer messages={[user('happy'), user('sad')]} theme={theme} />
      </StrictMode>,
    );
    expect(screen.getByText('Messages analyzed: 2')).toBeInTheDocument();
  });

  it('draws the trend graph once there are at least two analysed messages', () => {
    const { container, rerender } = render(<EmotionVisualizer messages={[user('happy')]} theme={theme} />);
    expect(container.querySelector('canvas')).toBeNull();
    rerender(<EmotionVisualizer messages={[user('happy'), user('furious')]} theme={theme} />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('reports the most common dominant emotion', () => {
    render(
      <EmotionVisualizer
        messages={[user('I am sad'), user('so sad and lonely'), user('I am happy')]}
        theme={theme}
      />,
    );
    expect(screen.getByText(/Dominant pattern: sadness/)).toBeInTheDocument();
  });

  it('handles neutral text without NaN output', () => {
    const { container } = render(<EmotionVisualizer messages={[user('the table is brown')]} theme={theme} />);
    expect(container.textContent).not.toContain('NaN');
    expect(screen.getAllByText(/neutral/i).length).toBeGreaterThan(0);
  });
});

describe('EmotionBadge', () => {
  it('labels the dominant emotion with its strength in the tooltip', () => {
    render(<EmotionBadge text="I am terrified and scared" />);
    const badge = screen.getByText(/fear/i).closest('span[title]')!;
    expect(badge.getAttribute('title')).toMatch(/^fear \(\d+%\)$/);
  });
});
