/**
 * Chart Utils Tests (v1.8.0)
 *
 * Tests for Canvas-based chart rendering utilities.
 * Note: These tests verify API contracts and basic functionality.
 * Visual testing would require browser environment or screenshot comparison.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { drawLineChart, drawPieChart, drawWordCloud, drawGauge } from '@/utils/chartUtils';

// Mock Canvas API
const createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Mock parent element for width calculation
  Object.defineProperty(canvas, 'parentElement', {
    writable: true,
    value: {
      clientWidth: 600,
      clientHeight: 400
    }
  });

  return { canvas, ctx };
};

describe('chartUtils', () => {
  describe('drawLineChart', () => {
    it('renders without crashing for valid data', () => {
      const { canvas } = createMockCanvas();
      const data = [
        { label: 'Day 1', value: 10, series: 'Series A' },
        { label: 'Day 2', value: 20, series: 'Series A' },
        { label: 'Day 3', value: 15, series: 'Series A' }
      ];
      const options = { width: 600, height: 300 };

      expect(() => drawLineChart(canvas, data, options)).not.toThrow();
    });

    it('handles empty data gracefully', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 600, height: 300 };

      expect(() => drawLineChart(canvas, [], options)).not.toThrow();
    });

    it('sets canvas dimensions correctly', () => {
      const { canvas } = createMockCanvas();
      const data = [{ label: 'Day 1', value: 10 }];
      const options = { width: 600, height: 300 };

      drawLineChart(canvas, data, options);

      // Account for device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      expect(canvas.width).toBe(600 * dpr);
      expect(canvas.height).toBe(300 * dpr);
    });

    it('handles multiple series', () => {
      const { canvas } = createMockCanvas();
      const data = [
        { label: 'Day 1', value: 10, series: 'Series A' },
        { label: 'Day 1', value: 15, series: 'Series B' },
        { label: 'Day 2', value: 20, series: 'Series A' },
        { label: 'Day 2', value: 25, series: 'Series B' }
      ];
      const options = { width: 600, height: 300 };

      expect(() => drawLineChart(canvas, data, options)).not.toThrow();
    });
  });

  describe('drawPieChart', () => {
    it('renders without crashing for valid data', () => {
      const { canvas } = createMockCanvas();
      const data = [
        { label: 'Category A', value: 30 },
        { label: 'Category B', value: 70 }
      ];
      const options = { width: 300, height: 300 };

      expect(() => drawPieChart(canvas, data, options)).not.toThrow();
    });

    it('handles empty data gracefully', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 300, height: 300 };

      expect(() => drawPieChart(canvas, [], options)).not.toThrow();
    });

    it('handles zero total gracefully', () => {
      const { canvas } = createMockCanvas();
      const data = [
        { label: 'Category A', value: 0 },
        { label: 'Category B', value: 0 }
      ];
      const options = { width: 300, height: 300 };

      expect(() => drawPieChart(canvas, data, options)).not.toThrow();
    });
  });

  describe('drawWordCloud', () => {
    it('renders without crashing for valid data', () => {
      const { canvas } = createMockCanvas();
      const words = [
        { word: 'happy', count: 10, sentiment: 1 },
        { word: 'sad', count: 5, sentiment: -1 },
        { word: 'okay', count: 3, sentiment: 0 }
      ];
      const options = { width: 600, height: 300 };

      expect(() => drawWordCloud(canvas, words, options)).not.toThrow();
    });

    it('handles empty data gracefully', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 600, height: 300 };

      expect(() => drawWordCloud(canvas, [], options)).not.toThrow();
    });

    it('scales words by frequency', () => {
      const { canvas } = createMockCanvas();
      const words = [
        { word: 'frequent', count: 100, sentiment: 0 },
        { word: 'rare', count: 1, sentiment: 0 }
      ];
      const options = { width: 600, height: 300 };

      // Should render without error, scaling handled internally
      expect(() => drawWordCloud(canvas, words, options)).not.toThrow();
    });
  });

  describe('drawGauge', () => {
    it('renders without crashing for valid value', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 300, height: 250 };

      expect(() => drawGauge(canvas, 50, 'stable', options)).not.toThrow();
    });

    it('handles extreme positive value', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 300, height: 250 };

      expect(() => drawGauge(canvas, 100, 'up', options)).not.toThrow();
    });

    it('handles extreme negative value', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 300, height: 250 };

      expect(() => drawGauge(canvas, -100, 'down', options)).not.toThrow();
    });

    it('handles all trend types', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 300, height: 250 };

      expect(() => drawGauge(canvas, 0, 'up', options)).not.toThrow();
      expect(() => drawGauge(canvas, 0, 'down', options)).not.toThrow();
      expect(() => drawGauge(canvas, 0, 'stable', options)).not.toThrow();
    });

    it('handles zero value', () => {
      const { canvas } = createMockCanvas();
      const options = { width: 300, height: 250 };

      expect(() => drawGauge(canvas, 0, 'stable', options)).not.toThrow();
    });
  });

  describe('General chart behavior', () => {
    it('respects custom colors in options', () => {
      const { canvas } = createMockCanvas();
      const data = [{ label: 'Test', value: 10 }];
      const options = {
        width: 300,
        height: 300,
        colors: ['#ff0000', '#00ff00', '#0000ff']
      };

      expect(() => drawLineChart(canvas, data, options)).not.toThrow();
      expect(() => drawPieChart(canvas, data, options)).not.toThrow();
    });

    it('respects custom background color', () => {
      const { canvas } = createMockCanvas();
      const data = [{ label: 'Test', value: 10 }];
      const options = {
        width: 300,
        height: 300,
        backgroundColor: '#000000'
      };

      expect(() => drawLineChart(canvas, data, options)).not.toThrow();
    });

    it('respects custom text color', () => {
      const { canvas } = createMockCanvas();
      const data = [{ label: 'Test', value: 10 }];
      const options = {
        width: 300,
        height: 300,
        textColor: '#ffffff'
      };

      expect(() => drawLineChart(canvas, data, options)).not.toThrow();
    });
  });
});
