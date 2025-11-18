import { describe, it, expect } from 'vitest';
import {
  detectEmotions,
  getEmotionEmoji,
  getEmotionColor
} from '@/utils/emotionDetection';

describe('emotionDetection', () => {
  describe('detectEmotions', () => {
    it('should detect joy emotions', () => {
      const result = detectEmotions('I am so happy and excited! This is wonderful!');
      expect(result.joy).toBeGreaterThan(0);
      expect(result.dominant).toBe('joy');
    });

    it('should detect anger emotions', () => {
      const result = detectEmotions('I am so angry and frustrated! This is infuriating!');
      expect(result.anger).toBeGreaterThan(0);
      expect(result.dominant).toBe('anger');
    });

    it('should detect fear emotions', () => {
      const result = detectEmotions('I am scared and anxious. I feel terrified.');
      expect(result.fear).toBeGreaterThan(0);
      expect(result.dominant).toBe('fear');
    });

    it('should detect sadness emotions', () => {
      const result = detectEmotions('I feel so sad and depressed. I am heartbroken.');
      expect(result.sadness).toBeGreaterThan(0);
      expect(result.dominant).toBe('sadness');
    });

    it('should detect surprise emotions', () => {
      const result = detectEmotions('Wow! I am shocked and amazed! This is unbelievable!');
      expect(result.surprise).toBeGreaterThan(0);
      expect(result.dominant).toBe('surprise');
    });

    it('should return neutral for text without emotions', () => {
      const result = detectEmotions('The weather is partly cloudy today.');
      expect(result.dominant).toBe('neutral');
      expect(result.joy).toBeLessThanOrEqual(10);
      expect(result.anger).toBeLessThanOrEqual(10);
      expect(result.fear).toBeLessThanOrEqual(10);
      expect(result.sadness).toBeLessThanOrEqual(10);
      expect(result.surprise).toBeLessThanOrEqual(10);
    });

    it('should handle empty text', () => {
      const result = detectEmotions('');
      expect(result.joy).toBe(0);
      expect(result.anger).toBe(0);
      expect(result.fear).toBe(0);
      expect(result.sadness).toBe(0);
      expect(result.surprise).toBe(0);
      expect(result.dominant).toBe('neutral');
    });

    it('should handle whitespace-only text', () => {
      const result = detectEmotions('   \n\t  ');
      expect(result.dominant).toBe('neutral');
    });

    it('should normalize text case', () => {
      const result1 = detectEmotions('HAPPY EXCITED JOY');
      const result2 = detectEmotions('happy excited joy');
      expect(result1.joy).toBe(result2.joy);
      expect(result1.dominant).toBe(result2.dominant);
    });

    it('should detect mixed emotions', () => {
      const result = detectEmotions('I am happy but also a bit worried and scared.');
      expect(result.joy).toBeGreaterThan(0);
      expect(result.fear).toBeGreaterThan(0);
      // One should be dominant
      expect(['joy', 'fear']).toContain(result.dominant);
    });

    it('should cap intensity at 100', () => {
      const longHappyText = 'happy '.repeat(100);
      const result = detectEmotions(longHappyText);
      expect(result.joy).toBeLessThanOrEqual(100);
    });

    it('should handle punctuation correctly', () => {
      const result = detectEmotions('Happy! Happy? Happy. Happy, happy!!!');
      expect(result.joy).toBeGreaterThan(0);
      expect(result.dominant).toBe('joy');
    });

    it('should return all emotion scores', () => {
      const result = detectEmotions('I feel something');
      expect(result).toHaveProperty('joy');
      expect(result).toHaveProperty('anger');
      expect(result).toHaveProperty('fear');
      expect(result).toHaveProperty('sadness');
      expect(result).toHaveProperty('surprise');
      expect(result).toHaveProperty('dominant');
    });

    it('should detect joy keywords correctly', () => {
      const joyText = 'delighted pleased glad thrilled ecstatic';
      const result = detectEmotions(joyText);
      expect(result.joy).toBeGreaterThan(0);
    });

    it('should detect anger keywords correctly', () => {
      const angerText = 'furious enraged livid resentful hostile';
      const result = detectEmotions(angerText);
      expect(result.anger).toBeGreaterThan(0);
    });

    it('should detect fear keywords correctly', () => {
      const fearText = 'afraid terrified panic alarmed dread';
      const result = detectEmotions(fearText);
      expect(result.fear).toBeGreaterThan(0);
    });

    it('should detect sadness keywords correctly', () => {
      const sadnessText = 'unhappy miserable lonely gloomy melancholy';
      const result = detectEmotions(sadnessText);
      expect(result.sadness).toBeGreaterThan(0);
    });

    it('should detect surprise keywords correctly', () => {
      const surpriseText = 'shocked astonished stunned astounded startled';
      const result = detectEmotions(surpriseText);
      expect(result.surprise).toBeGreaterThan(0);
    });
  });

  describe('getEmotionEmoji', () => {
    it('should return correct emoji for joy', () => {
      expect(getEmotionEmoji('joy')).toBe('😊');
    });

    it('should return correct emoji for anger', () => {
      expect(getEmotionEmoji('anger')).toBe('😠');
    });

    it('should return correct emoji for fear', () => {
      expect(getEmotionEmoji('fear')).toBe('😨');
    });

    it('should return correct emoji for sadness', () => {
      expect(getEmotionEmoji('sadness')).toBe('😢');
    });

    it('should return correct emoji for surprise', () => {
      expect(getEmotionEmoji('surprise')).toBe('😲');
    });

    it('should return correct emoji for neutral', () => {
      expect(getEmotionEmoji('neutral')).toBe('😐');
    });
  });

  describe('getEmotionColor', () => {
    it('should return correct color for joy', () => {
      expect(getEmotionColor('joy')).toBe('#FFD700');
    });

    it('should return correct color for anger', () => {
      expect(getEmotionColor('anger')).toBe('#FF4444');
    });

    it('should return correct color for fear', () => {
      expect(getEmotionColor('fear')).toBe('#9370DB');
    });

    it('should return correct color for sadness', () => {
      expect(getEmotionColor('sadness')).toBe('#4169E1');
    });

    it('should return correct color for surprise', () => {
      expect(getEmotionColor('surprise')).toBe('#FF8C00');
    });

    it('should return correct color for neutral', () => {
      expect(getEmotionColor('neutral')).toBe('#808080');
    });
  });
});
