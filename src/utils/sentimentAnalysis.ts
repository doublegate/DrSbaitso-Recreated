/**
 * Sentiment Analysis Utility (v1.8.0)
 *
 * Keyword-based sentiment analysis for conversation insights.
 * Analyzes message content to determine emotional tone and track trends.
 */

import { POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS } from '@/constants';
import { Message, SentimentAnalysis } from '@/types';

/**
 * Analyzes the sentiment of a single text string
 * @param text - The text to analyze
 * @returns SentimentAnalysis object with score from -100 to +100
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      totalWords: 0
    };
  }

  // Normalize text: lowercase, remove punctuation, split into words
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(word => word.length > 0);

  if (words.length === 0) {
    return {
      score: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      totalWords: 0
    };
  }

  // Count positive and negative keywords
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (POSITIVE_KEYWORDS.includes(word)) {
      positiveCount++;
    } else if (NEGATIVE_KEYWORDS.includes(word)) {
      negativeCount++;
    }
  });

  const neutralCount = words.length - positiveCount - negativeCount;

  // Calculate sentiment score: (positive - negative) / total * 100
  // Normalize to -100 to +100 scale
  const score = words.length > 0
    ? Math.round(((positiveCount - negativeCount) / words.length) * 100)
    : 0;

  return {
    score: Math.max(-100, Math.min(100, score)), // Clamp to -100..+100
    positiveCount,
    negativeCount,
    neutralCount,
    totalWords: words.length
  };
}

/**
 * Analyzes sentiment for multiple messages
 * @param messages - Array of messages to analyze
 * @returns SentimentAnalysis with aggregated results
 */
export function analyzeMessages(messages: Message[]): SentimentAnalysis {
  if (!messages || messages.length === 0) {
    return {
      score: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      totalWords: 0
    };
  }

  const combined = messages.map(m => m.text).join(' ');
  return analyzeSentiment(combined);
}

/**
 * Calculates sentiment trend over time
 * @param messages - Array of messages with timestamps (sorted by time)
 * @param windowSize - Number of recent messages to compare (default: 10)
 * @returns Trend direction: 'up', 'down', or 'stable'
 */
export function calculateSentimentTrend(
  messages: Message[],
  windowSize: number = 10
): 'up' | 'down' | 'stable' {
  if (!messages || messages.length < windowSize * 2) {
    return 'stable'; // Not enough data
  }

  // Sort messages by timestamp (oldest first)
  const sorted = [...messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  // Get older window (first half of window size)
  const olderMessages = sorted.slice(0, windowSize);
  const olderSentiment = analyzeMessages(olderMessages);

  // Get recent window (last windowSize messages)
  const recentMessages = sorted.slice(-windowSize);
  const recentSentiment = analyzeMessages(recentMessages);

  // Calculate difference
  const difference = recentSentiment.score - olderSentiment.score;

  // Threshold for determining trend (5 points)
  const TREND_THRESHOLD = 5;

  if (difference > TREND_THRESHOLD) {
    return 'up';
  } else if (difference < -TREND_THRESHOLD) {
    return 'down';
  } else {
    return 'stable';
  }
}

/**
 * Extracts top keywords from messages (for word cloud)
 * @param messages - Array of messages
 * @param minLength - Minimum word length to include (default: 4)
 * @param limit - Maximum number of keywords to return (default: 50)
 * @returns Array of {word, count, sentiment} objects sorted by frequency
 */
export function extractTopKeywords(
  messages: Message[],
  minLength: number = 4,
  limit: number = 50
): Array<{ word: string; count: number; sentiment: number }> {
  if (!messages || messages.length === 0) {
    return [];
  }

  // Common stop words to exclude
  const stopWords = new Set([
    'that', 'this', 'with', 'have', 'from', 'they', 'been', 'were',
    'what', 'when', 'where', 'which', 'while', 'their', 'there',
    'these', 'those', 'about', 'would', 'could', 'should', 'your',
    'just', 'like', 'some', 'than', 'into', 'very', 'more', 'most',
    'also', 'only', 'even', 'well', 'much', 'such', 'here', 'them'
  ]);

  // Count word frequencies
  const wordCounts = new Map<string, number>();

  messages.forEach(message => {
    const normalized = message.text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = normalized.split(/\s+/).filter(word =>
      word.length >= minLength && !stopWords.has(word)
    );

    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });

  // Convert to array and add sentiment scores
  const keywords = Array.from(wordCounts.entries()).map(([word, count]) => {
    let sentiment = 0;
    if (POSITIVE_KEYWORDS.includes(word)) {
      sentiment = 1;
    } else if (NEGATIVE_KEYWORDS.includes(word)) {
      sentiment = -1;
    }

    return { word, count, sentiment };
  });

  // Sort by frequency (descending) and limit
  return keywords
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Calculates average sentiment for a date range
 * @param messages - Messages with timestamps
 * @param startDate - Start timestamp (ms)
 * @param endDate - End timestamp (ms)
 * @returns Average sentiment score
 */
export function getAverageSentiment(
  messages: Message[],
  startDate?: number,
  endDate?: number
): number {
  if (!messages || messages.length === 0) {
    return 0;
  }

  // Filter by date range if provided
  let filtered = messages;
  if (startDate !== undefined || endDate !== undefined) {
    filtered = messages.filter(m => {
      const timestamp = m.timestamp || 0;
      const afterStart = startDate === undefined || timestamp >= startDate;
      const beforeEnd = endDate === undefined || timestamp <= endDate;
      return afterStart && beforeEnd;
    });
  }

  if (filtered.length === 0) {
    return 0;
  }

  const analysis = analyzeMessages(filtered);
  return analysis.score;
}
