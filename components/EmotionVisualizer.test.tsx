/**
 * Component Tests for EmotionVisualizer (v1.11.0 - Option D1)
 *
 * Tests:
 * - Message analysis and emotion detection
 * - Current emotion display
 * - Emotion scores visualization
 * - Canvas-based trend graph
 * - History management
 * - Statistics calculation
 * - Theme support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmotionVisualizer, EmotionBadge } from './EmotionVisualizer';
import * as emotionDetection from '@/utils/emotionDetection';

// Mock emotion detection
vi.mock('@/utils/emotionDetection', () => ({
  detectEmotions: vi.fn(),
  getEmotionColor: vi.fn((emotion: string) => {
    const colors: Record<string, string> = {
      joy: '#22c55e',
      anger: '#ef4444',
      fear: '#a855f7',
      sadness: '#3b82f6',
      surprise: '#f59e0b',
      neutral: '#6b7280'
    };
    return colors[emotion] || '#6b7280';
  }),
  getEmotionEmoji: vi.fn((emotion: string) => {
    const emojis: Record<string, string> = {
      joy: '😊',
      anger: '😠',
      fear: '😨',
      sadness: '😢',
      surprise: '😲',
      neutral: '😐'
    };
    return emojis[emotion] || '😐';
  })
}));

describe('EmotionVisualizer Component', () => {
  const mockTheme = {
    colors: {
      background: '#1e3a8a',
      text: '#ffffff',
      border: '#4b5563',
      accent: '#fbbf24'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should show prompt when no messages', () => {
      render(<EmotionVisualizer messages={[]} />);

      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });

    it('should not show emotion analysis header when no messages', () => {
      render(<EmotionVisualizer messages={[]} />);

      // Should show prompt but not the emotion analysis header
      expect(screen.queryByText(/😊 emotion analysis/i)).not.toBeInTheDocument();
    });
  });

  describe('Message Analysis', () => {
    it('should analyze user messages', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.85,
        scores: {
          joy: 0.85,
          anger: 0.05,
          fear: 0.02,
          sadness: 0.03,
          surprise: 0.05
        }
      });

      render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'I am so happy!' }]}
          theme={mockTheme}
        />
      );

      expect(mockDetectEmotions).toHaveBeenCalledWith('I am so happy!');
      expect(screen.getByText(/emotion analysis/i)).toBeInTheDocument();
    });

    it('should not analyze AI messages', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);

      render(
        <EmotionVisualizer
          messages={[{ author: 'ai', text: 'How can I help?' }]}
        />
      );

      expect(mockDetectEmotions).not.toHaveBeenCalled();
      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });

    it('should analyze only the latest message', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.85,
        scores: {
          joy: 0.85,
          anger: 0.05,
          fear: 0.02,
          sadness: 0.03,
          surprise: 0.05
        }
      });

      const { rerender } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'First message' }]}
        />
      );

      expect(mockDetectEmotions).toHaveBeenCalledTimes(1);

      // Add another message
      rerender(
        <EmotionVisualizer
          messages={[
            { author: 'user', text: 'First message' },
            { author: 'user', text: 'Second message' }
          ]}
        />
      );

      expect(mockDetectEmotions).toHaveBeenCalledTimes(2);
      expect(mockDetectEmotions).toHaveBeenLastCalledWith('Second message');
    });
  });

  describe('Current Emotion Display', () => {
    it('should display dominant emotion', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.85,
        scores: {
          joy: 0.85,
          anger: 0.05,
          fear: 0.02,
          sadness: 0.03,
          surprise: 0.05
        }
      });

      const { container } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'I am happy' }]}
        />
      );

      // Check for dominant emotion text (case-insensitive)
      expect(container.textContent).toMatch(/joy/i);
    });

    it('should display confidence percentage', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.85,
        scores: {
          joy: 0.85,
          anger: 0.05,
          fear: 0.02,
          sadness: 0.03,
          surprise: 0.05
        }
      });

      render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'I am happy' }]}
        />
      );

      expect(screen.getByText(/confidence: 85%/i)).toBeInTheDocument();
    });

    it('should display emotion score', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.85,
        scores: {
          joy: 0.85,
          anger: 0.05,
          fear: 0.02,
          sadness: 0.03,
          surprise: 0.05
        }
      });

      const { container } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'I am happy' }]}
        />
      );

      // Check for the dominant emotion score (85%)
      const scoreElements = container.querySelectorAll('.text-2xl');
      expect(scoreElements.length).toBeGreaterThan(0);
      expect(scoreElements[0].textContent).toContain('85%');
    });
  });

  describe('Emotion Scores Visualization', () => {
    it('should display all five emotions', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.50,
        scores: {
          joy: 0.50,
          anger: 0.20,
          fear: 0.10,
          sadness: 0.10,
          surprise: 0.10
        }
      });

      const { container } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'Mixed emotions' }]}
        />
      );

      // Check all emotions are present in the text content
      const text = container.textContent || '';
      expect(text).toMatch(/joy/i);
      expect(text).toMatch(/anger/i);
      expect(text).toMatch(/fear/i);
      expect(text).toMatch(/sadness/i);
      expect(text).toMatch(/surprise/i);
    });

    it('should display percentage for each emotion', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.50,
        scores: {
          joy: 0.50,
          anger: 0.20,
          fear: 0.10,
          sadness: 0.10,
          surprise: 0.10
        }
      });

      const { container } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'Mixed emotions' }]}
        />
      );

      const text = container.textContent || '';
      expect(text).toContain('50%');
      expect(text).toContain('20%');
      expect(text).toContain('10%');
    });

    it('should render progress bars for emotions', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.75,
        scores: {
          joy: 0.75,
          anger: 0.10,
          fear: 0.05,
          sadness: 0.05,
          surprise: 0.05
        }
      });

      const { container } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'Happy message' }]}
        />
      );

      const progressBars = container.querySelectorAll('.h-2.bg-gray-700');
      expect(progressBars.length).toBe(5); // One for each emotion
    });
  });

  describe('Emotion History', () => {
    it('should maintain history of analyzed messages', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);

      // First message
      mockDetectEmotions.mockReturnValueOnce({
        dominant: 'joy',
        confidence: 0.80,
        scores: { joy: 0.80, anger: 0.05, fear: 0.05, sadness: 0.05, surprise: 0.05 }
      });

      const { rerender } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'Happy' }]}
        />
      );

      // Second message
      mockDetectEmotions.mockReturnValueOnce({
        dominant: 'sadness',
        confidence: 0.70,
        scores: { joy: 0.05, anger: 0.05, fear: 0.05, sadness: 0.70, surprise: 0.15 }
      });

      rerender(
        <EmotionVisualizer
          messages={[
            { author: 'user', text: 'Happy' },
            { author: 'user', text: 'Sad' }
          ]}
        />
      );

      // Should show emotion trend graph with 2 points
      expect(screen.getByText(/emotion trend/i)).toBeInTheDocument();
    });

    it('should limit history to maxHistory', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.80,
        scores: { joy: 0.80, anger: 0.05, fear: 0.05, sadness: 0.05, surprise: 0.05 }
      });

      // Build messages gradually to simulate multiple re-renders
      let messages = [{ author: 'user', text: 'Message 1' }];
      const { container, rerender } = render(
        <EmotionVisualizer
          messages={messages}
          maxHistory={5}
        />
      );

      // Add more messages one by one (simulate conversation flow)
      for (let i = 2; i <= 15; i++) {
        messages = [...messages, { author: 'user', text: `Message ${i}` }];
        rerender(
          <EmotionVisualizer
            messages={messages}
            maxHistory={5}
          />
        );
      }

      // History should be limited to 5
      const text = container.textContent || '';
      expect(text).toMatch(/messages analyzed:\s*5/i);
    });

    it('should not show trend graph with only 1 message', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.80,
        scores: { joy: 0.80, anger: 0.05, fear: 0.05, sadness: 0.05, surprise: 0.05 }
      });

      render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'Hello' }]}
        />
      );

      expect(screen.queryByText(/emotion trend/i)).not.toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should show number of messages analyzed', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.80,
        scores: { joy: 0.80, anger: 0.05, fear: 0.05, sadness: 0.05, surprise: 0.05 }
      });

      // Build messages gradually
      let messages = [{ author: 'user', text: 'Message 1' }];
      const { container, rerender } = render(<EmotionVisualizer messages={messages} />);

      // Add messages incrementally
      for (let i = 2; i <= 3; i++) {
        messages = [...messages, { author: 'user', text: `Message ${i}` }];
        rerender(<EmotionVisualizer messages={messages} />);
      }

      const text = container.textContent || '';
      expect(text).toMatch(/messages analyzed:\s*3/i);
    });

    it('should show dominant pattern', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);

      // Mostly joy
      mockDetectEmotions
        .mockReturnValueOnce({
          dominant: 'joy',
          confidence: 0.80,
          scores: { joy: 0.80, anger: 0.05, fear: 0.05, sadness: 0.05, surprise: 0.05 }
        })
        .mockReturnValueOnce({
          dominant: 'joy',
          confidence: 0.75,
          scores: { joy: 0.75, anger: 0.10, fear: 0.05, sadness: 0.05, surprise: 0.05 }
        })
        .mockReturnValueOnce({
          dominant: 'sadness',
          confidence: 0.60,
          scores: { joy: 0.10, anger: 0.10, fear: 0.10, sadness: 0.60, surprise: 0.10 }
        });

      const { rerender } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'Message 1' }]}
        />
      );

      rerender(
        <EmotionVisualizer
          messages={[
            { author: 'user', text: 'Message 1' },
            { author: 'user', text: 'Message 2' }
          ]}
        />
      );

      rerender(
        <EmotionVisualizer
          messages={[
            { author: 'user', text: 'Message 1' },
            { author: 'user', text: 'Message 2' },
            { author: 'user', text: 'Message 3' }
          ]}
        />
      );

      expect(screen.getByText(/dominant pattern: joy/i)).toBeInTheDocument();
    });
  });

  describe('Canvas Rendering', () => {
    it('should render canvas element when history has multiple messages', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.80,
        scores: { joy: 0.80, anger: 0.05, fear: 0.05, sadness: 0.05, surprise: 0.05 }
      });

      // Build messages gradually to trigger useEffect updates
      let messages = [{ author: 'user', text: 'Message 1' }];
      const { container, rerender } = render(<EmotionVisualizer messages={messages} />);

      // Add second message to trigger canvas rendering (needs > 1 in history)
      messages = [...messages, { author: 'user', text: 'Message 2' }];
      rerender(<EmotionVisualizer messages={messages} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
      if (canvas) {
        expect(canvas.getAttribute('width')).toBe('300');
        expect(canvas.getAttribute('height')).toBe('120');
      }
    });
  });

  describe('Theme Support', () => {
    it('should apply theme colors', () => {
      const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
      mockDetectEmotions.mockReturnValue({
        dominant: 'joy',
        confidence: 0.80,
        scores: { joy: 0.80, anger: 0.05, fear: 0.05, sadness: 0.05, surprise: 0.05 }
      });

      const customTheme = {
        colors: {
          background: '#000000',
          text: '#00ff00',
          border: '#ff0000',
          accent: '#0000ff'
        }
      };

      const { container } = render(
        <EmotionVisualizer
          messages={[{ author: 'user', text: 'Test' }]}
          theme={customTheme}
        />
      );

      const mainDiv = container.querySelector('.emotion-visualizer');
      expect(mainDiv).toHaveStyle({ backgroundColor: '#000000' });
    });
  });
});

describe('EmotionBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render emotion badge', () => {
    const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
    mockDetectEmotions.mockReturnValue({
      dominant: 'joy',
      confidence: 0.85,
      scores: { joy: 0.85, anger: 0.05, fear: 0.02, sadness: 0.03, surprise: 0.05 }
    });

    render(<EmotionBadge text="I am happy!" />);

    expect(screen.getByText(/joy/i)).toBeInTheDocument();
  });

  it('should call detectEmotions with text', () => {
    const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
    mockDetectEmotions.mockReturnValue({
      dominant: 'joy',
      confidence: 0.85,
      scores: { joy: 0.85, anger: 0.05, fear: 0.02, sadness: 0.03, surprise: 0.05 }
    });

    render(<EmotionBadge text="Happy text" />);

    expect(mockDetectEmotions).toHaveBeenCalledWith('Happy text');
  });

  it('should show confidence in title', () => {
    const mockDetectEmotions = vi.mocked(emotionDetection.detectEmotions);
    mockDetectEmotions.mockReturnValue({
      dominant: 'joy',
      confidence: 0.75,
      scores: { joy: 0.75, anger: 0.10, fear: 0.05, sadness: 0.05, surprise: 0.05 }
    });

    const { container } = render(<EmotionBadge text="Test" />);

    const badge = container.querySelector('span[title]');
    expect(badge).toHaveAttribute('title', expect.stringContaining('75%'));
  });
});
