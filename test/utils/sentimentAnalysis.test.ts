/**
 * Sentiment Analysis Tests (v1.8.0)
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeSentiment,
  analyzeMessages,
  calculateSentimentTrend,
  extractTopKeywords,
  getAverageSentiment
} from '@/utils/sentimentAnalysis';
import { Message } from '@/types';

describe('sentimentAnalysis', () => {
  describe('analyzeSentiment', () => {
    it('returns neutral score for empty text', () => {
      const result = analyzeSentiment('');
      expect(result.score).toBe(0);
      expect(result.totalWords).toBe(0);
    });

    it('identifies positive sentiment', () => {
      const result = analyzeSentiment('I am happy and excited');
      expect(result.score).toBeGreaterThan(0);
      expect(result.positiveCount).toBeGreaterThan(0);
    });

    it('identifies negative sentiment', () => {
      const result = analyzeSentiment('I am sad and worried');
      expect(result.score).toBeLessThan(0);
      expect(result.negativeCount).toBeGreaterThan(0);
    });

    it('clamps score to -100..+100 range', () => {
      const veryPositive = analyzeSentiment('happy great wonderful excellent amazing fantastic');
      expect(veryPositive.score).toBeLessThanOrEqual(100);
      expect(veryPositive.score).toBeGreaterThanOrEqual(-100);
    });

    it('handles punctuation correctly', () => {
      const result1 = analyzeSentiment('happy!');
      const result2 = analyzeSentiment('happy');
      expect(result1.score).toBe(result2.score);
    });

    it('is case-insensitive', () => {
      const result1 = analyzeSentiment('HAPPY');
      const result2 = analyzeSentiment('happy');
      expect(result1.score).toBe(result2.score);
    });
  });

  describe('analyzeMessages', () => {
    it('returns neutral for empty messages array', () => {
      const result = analyzeMessages([]);
      expect(result.score).toBe(0);
    });

    it('analyzes multiple messages correctly', () => {
      const messages: Message[] = [
        { author: 'user', text: 'I am happy' },
        { author: 'dr', text: 'That is good' }
      ];
      const result = analyzeMessages(messages);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('calculateSentimentTrend', () => {
    it('returns stable for insufficient data', () => {
      const messages: Message[] = [
        { author: 'user', text: 'hello', timestamp: 1000 }
      ];
      const trend = calculateSentimentTrend(messages, 10);
      expect(trend).toBe('stable');
    });

    it('detects upward trend', () => {
      const messages: Message[] = [
        { author: 'user', text: 'sad worried anxious', timestamp: 1000 },
        { author: 'user', text: 'sad worried', timestamp: 2000 },
        { author: 'user', text: 'sad', timestamp: 3000 },
        { author: 'user', text: 'okay', timestamp: 4000 },
        { author: 'user', text: 'better', timestamp: 5000 },
        { author: 'user', text: 'good', timestamp: 6000 },
        { author: 'user', text: 'happy excited', timestamp: 7000 },
        { author: 'user', text: 'happy great wonderful', timestamp: 8000 },
        { author: 'user', text: 'amazing fantastic excellent', timestamp: 9000 },
        { author: 'user', text: 'happy joyful grateful blessed', timestamp: 10000 },
        { author: 'user', text: 'wonderful amazing happy excited', timestamp: 11000 },
        { author: 'user', text: 'great excellent fantastic', timestamp: 12000 },
        { author: 'user', text: 'love this feeling great', timestamp: 13000 },
        { author: 'user', text: 'happy content peaceful', timestamp: 14000 },
        { author: 'user', text: 'excellent wonderful amazing', timestamp: 15000 },
        { author: 'user', text: 'fantastic great happy', timestamp: 16000 },
        { author: 'user', text: 'joyful peaceful content', timestamp: 17000 },
        { author: 'user', text: 'happy excited hopeful', timestamp: 18000 },
        { author: 'user', text: 'wonderful amazing excellent', timestamp: 19000 },
        { author: 'user', text: 'great fantastic happy', timestamp: 20000 }
      ];
      const trend = calculateSentimentTrend(messages, 10);
      expect(trend).toBe('up');
    });

    it('detects downward trend', () => {
      const messages: Message[] = [
        { author: 'user', text: 'happy excited wonderful', timestamp: 1000 },
        { author: 'user', text: 'happy great', timestamp: 2000 },
        { author: 'user', text: 'happy', timestamp: 3000 },
        { author: 'user', text: 'okay', timestamp: 4000 },
        { author: 'user', text: 'not great', timestamp: 5000 },
        { author: 'user', text: 'sad', timestamp: 6000 },
        { author: 'user', text: 'sad worried', timestamp: 7000 },
        { author: 'user', text: 'sad anxious stressed', timestamp: 8000 },
        { author: 'user', text: 'terrible awful horrible', timestamp: 9000 },
        { author: 'user', text: 'depressed lonely sad', timestamp: 10000 },
        { author: 'user', text: 'awful terrible bad', timestamp: 11000 },
        { author: 'user', text: 'sad worried anxious', timestamp: 12000 },
        { author: 'user', text: 'stressed overwhelmed tired', timestamp: 13000 },
        { author: 'user', text: 'sad depressed hopeless', timestamp: 14000 },
        { author: 'user', text: 'terrible awful sad', timestamp: 15000 },
        { author: 'user', text: 'bad horrible worried', timestamp: 16000 },
        { author: 'user', text: 'anxious stressed sad', timestamp: 17000 },
        { author: 'user', text: 'lonely isolated sad', timestamp: 18000 },
        { author: 'user', text: 'terrible awful horrible', timestamp: 19000 },
        { author: 'user', text: 'sad worried anxious', timestamp: 20000 }
      ];
      const trend = calculateSentimentTrend(messages, 10);
      expect(trend).toBe('down');
    });
  });

  describe('extractTopKeywords', () => {
    it('returns empty array for no messages', () => {
      const keywords = extractTopKeywords([]);
      expect(keywords).toEqual([]);
    });

    it('extracts keywords from messages', () => {
      const messages: Message[] = [
        { author: 'user', text: 'I love programming' },
        { author: 'dr', text: 'Programming is great' },
        { author: 'user', text: 'I enjoy programming' }
      ];
      const keywords = extractTopKeywords(messages);
      const programmingKeyword = keywords.find(k => k.word === 'programming');
      expect(programmingKeyword).toBeDefined();
      expect(programmingKeyword?.count).toBe(3);
    });

    it('respects minimum length filter', () => {
      const messages: Message[] = [
        { author: 'user', text: 'I am ok' }
      ];
      const keywords = extractTopKeywords(messages, 4);
      expect(keywords.every(k => k.word.length >= 4)).toBe(true);
    });

    it('excludes stop words', () => {
      const messages: Message[] = [
        { author: 'user', text: 'that this with have from they' }
      ];
      const keywords = extractTopKeywords(messages);
      expect(keywords.length).toBe(0);
    });

    it('limits results to specified count', () => {
      const messages: Message[] = [
        { author: 'user', text: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10' }
      ];
      const keywords = extractTopKeywords(messages, 4, 5);
      expect(keywords.length).toBeLessThanOrEqual(5);
    });

    it('assigns sentiment to keywords', () => {
      const messages: Message[] = [
        { author: 'user', text: 'feeling happy today despite being worried yesterday' }
      ];
      const keywords = extractTopKeywords(messages);
      const happy = keywords.find(k => k.word === 'happy');
      const worried = keywords.find(k => k.word === 'worried');
      const neutral = keywords.find(k => k.word === 'feeling');
      expect(happy?.sentiment).toBe(1);
      expect(worried?.sentiment).toBe(-1);
      expect(neutral?.sentiment).toBe(0);
    });
  });

  describe('getAverageSentiment', () => {
    it('returns 0 for empty messages', () => {
      const avg = getAverageSentiment([]);
      expect(avg).toBe(0);
    });

    it('calculates average correctly', () => {
      const messages: Message[] = [
        { author: 'user', text: 'happy' },
        { author: 'user', text: 'sad' }
      ];
      const avg = getAverageSentiment(messages);
      expect(typeof avg).toBe('number');
    });

    it('filters by date range', () => {
      const messages: Message[] = [
        { author: 'user', text: 'happy', timestamp: 1000 },
        { author: 'user', text: 'sad', timestamp: 5000 }
      ];
      const avg = getAverageSentiment(messages, 2000, 6000);
      // Should only include the 'sad' message
      expect(avg).toBeLessThan(0);
    });
  });
});
