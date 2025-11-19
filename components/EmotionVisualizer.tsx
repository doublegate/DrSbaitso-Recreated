/**
 * Emotion Visualizer Component (v1.11.0 - Option C2)
 *
 * Real-time visualization of conversation emotions using the 5-emotion model.
 * Displays current emotion state and history.
 */

import React, { useEffect, useRef, useState } from 'react';
import { detectEmotions, getEmotionColor, getEmotionEmoji, type EmotionAnalysis } from '@/utils/emotionDetection';

interface EmotionVisualizerProps {
  messages: Array<{ author: string; text: string }>;
  theme?: {
    colors: {
      background: string;
      text: string;
      border: string;
      accent: string;
    };
  };
  maxHistory?: number;
}

export function EmotionVisualizer({
  messages,
  theme,
  maxHistory = 10
}: EmotionVisualizerProps): JSX.Element {
  const [emotionHistory, setEmotionHistory] = useState<EmotionAnalysis[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Analyze latest message
  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.author === 'user') {
      const analysis = detectEmotions(latestMessage.text);
      setCurrentEmotion(analysis);
      setEmotionHistory(prev => [...prev.slice(-(maxHistory - 1)), analysis]);
    }
  }, [messages, maxHistory]);

  // Draw emotion graph
  useEffect(() => {
    if (!canvasRef.current || emotionHistory.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = theme?.colors.background || '#1e3a8a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = theme?.colors.border || '#4b5563';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw emotion lines
    const emotions: Array<keyof EmotionAnalysis['scores']> = ['joy', 'anger', 'fear', 'sadness', 'surprise'];
    const colors = {
      joy: '#22c55e',
      anger: '#ef4444',
      fear: '#a855f7',
      sadness: '#3b82f6',
      surprise: '#f59e0b'
    };

    const spacing = width / (emotionHistory.length - 1 || 1);

    emotions.forEach(emotion => {
      ctx.strokeStyle = colors[emotion];
      ctx.lineWidth = 2;
      ctx.beginPath();

      emotionHistory.forEach((analysis, index) => {
        const x = index * spacing;
        const y = height - (analysis.scores[emotion] * height);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = theme?.colors.text || '#ffffff';
    ctx.font = '10px monospace';
    emotions.forEach((emotion, index) => {
      ctx.fillStyle = colors[emotion];
      ctx.fillText(emotion, 5, 12 + index * 15);
    });

  }, [emotionHistory, theme]);

  if (!currentEmotion) {
    return (
      <div className="p-4 border-2 rounded" style={{
        borderColor: theme?.colors.border || '#4b5563',
        backgroundColor: theme?.colors.background || '#1e3a8a'
      }}>
        <p className="text-sm" style={{ color: theme?.colors.text || '#ffffff' }}>
          Start a conversation to see emotion analysis
        </p>
      </div>
    );
  }

  return (
    <div className="emotion-visualizer p-4 border-2 rounded" style={{
      borderColor: theme?.colors.border || '#4b5563',
      backgroundColor: theme?.colors.background || '#1e3a8a'
    }}>
      <h3 className="text-lg font-bold mb-3" style={{ color: theme?.colors.text || '#ffffff' }}>
        😊 Emotion Analysis
      </h3>

      {/* Current Emotion */}
      <div className="mb-4 p-3 border rounded" style={{
        borderColor: getEmotionColor(currentEmotion.dominant),
        backgroundColor: `${getEmotionColor(currentEmotion.dominant)}22`
      }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getEmotionEmoji(currentEmotion.dominant)}</span>
            <div>
              <p className="font-bold text-lg capitalize" style={{ color: theme?.colors.text }}>
                {currentEmotion.dominant}
              </p>
              <p className="text-xs" style={{ color: theme?.colors.text }}>
                Confidence: {(currentEmotion.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: getEmotionColor(currentEmotion.dominant) }}>
              {(currentEmotion.scores[currentEmotion.dominant] * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Emotion Scores */}
      <div className="mb-4 space-y-2">
        {Object.entries(currentEmotion.scores).map(([emotion, score]) => (
          <div key={emotion}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs capitalize flex items-center gap-1" style={{ color: theme?.colors.text }}>
                {getEmotionEmoji(emotion as any)}
                {emotion}
              </span>
              <span className="text-xs font-mono" style={{ color: theme?.colors.text }}>
                {(score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${score * 100}%`,
                  backgroundColor: getEmotionColor(emotion as any)
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Emotion History Graph */}
      {emotionHistory.length > 1 && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: theme?.colors.text }}>
            Emotion Trend
          </p>
          <canvas
            ref={canvasRef}
            width={300}
            height={120}
            className="w-full border rounded"
            style={{ borderColor: theme?.colors.border }}
          />
        </div>
      )}

      {/* Statistics */}
      {emotionHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: theme?.colors.border }}>
          <p className="text-xs" style={{ color: theme?.colors.text }}>
            Messages analyzed: {emotionHistory.length}
          </p>
          <p className="text-xs" style={{ color: theme?.colors.text }}>
            Dominant pattern: {getMostCommonEmotion(emotionHistory)}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Get most common emotion from history
 */
function getMostCommonEmotion(history: EmotionAnalysis[]): string {
  const counts: Record<string, number> = {};

  history.forEach(analysis => {
    counts[analysis.dominant] = (counts[analysis.dominant] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || 'neutral';
}

/**
 * Mini emotion badge for inline display
 */
export function EmotionBadge({ text }: { text: string }): JSX.Element {
  const analysis = detectEmotions(text);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
      style={{
        backgroundColor: `${getEmotionColor(analysis.dominant)}33`,
        color: getEmotionColor(analysis.dominant)
      }}
      title={`${analysis.dominant} (${(analysis.confidence * 100).toFixed(0)}%)`}
    >
      <span>{getEmotionEmoji(analysis.dominant)}</span>
      <span className="capitalize">{analysis.dominant}</span>
    </span>
  );
}

export default EmotionVisualizer;
