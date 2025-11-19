import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  evaluateContrast,
  validateThemeColors,
  generateShareCode,
  parseShareCode,
  isValidHexColor,
  normalizeHexColor,
  rgbToHex,
  darkenColor,
  lightenColor,
  exportThemeJSON,
  importThemeJSON
} from '@/utils/themeValidator';

describe('Theme Validator', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate maximum contrast ratio for white and black', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate same ratio regardless of color order', () => {
      const ratio1 = calculateContrastRatio('#FFFFFF', '#000000');
      const ratio2 = calculateContrastRatio('#000000', '#FFFFFF');
      expect(ratio1).toBe(ratio2);
    });

    it('should return 1 for identical colors', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should handle hex colors without # prefix', () => {
      const ratio = calculateContrastRatio('FFFFFF', '000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should handle 3-digit hex shorthand', () => {
      const ratio = calculateContrastRatio('#FFF', '#000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 0 for invalid hex colors', () => {
      const ratio = calculateContrastRatio('invalid', '#000000');
      expect(ratio).toBe(0);
    });
  });

  describe('evaluateContrast', () => {
    it('should mark 4.5:1 ratio as WCAG AA compliant', () => {
      const evaluation = evaluateContrast(4.5);
      expect(evaluation.wcagAA).toBe(true);
      expect(evaluation.wcagAAA).toBe(false);
    });

    it('should mark 7:1 ratio as WCAG AAA compliant', () => {
      const evaluation = evaluateContrast(7.0);
      expect(evaluation.wcagAA).toBe(true);
      expect(evaluation.wcagAAA).toBe(true);
    });

    it('should mark 3:1 ratio as WCAG AA Large compliant', () => {
      const evaluation = evaluateContrast(3.0);
      expect(evaluation.wcagAALarge).toBe(true);
      expect(evaluation.wcagAA).toBe(false);
    });

    it('should include rounded ratio in result', () => {
      const evaluation = evaluateContrast(4.567891);
      expect(evaluation.ratio).toBe(4.57);
    });
  });

  describe('validateThemeColors', () => {
    it('should validate a WCAG AA compliant theme', () => {
      const colors = {
        primary: '#0000AA',
        background: '#000000',
        text: '#FFFFFF',
        border: '#888888',
        accent: '#FFAA00'
      };

      const validation = validateThemeColors(colors);
      expect(validation.overall.passWCAG_AA).toBe(true);
      expect(validation.textContrast.wcagAA).toBe(true);
      expect(validation.suggestions).toBeDefined();
    });

    it('should fail validation for low contrast text', () => {
      const colors = {
        primary: '#FFFFFF',
        background: '#FFFFFF',
        text: '#FEFEFE', // Too similar
        border: '#888888',
        accent: '#FFAA00'
      };

      const validation = validateThemeColors(colors);
      expect(validation.overall.passWCAG_AA).toBe(false);
      expect(validation.textContrast.wcagAA).toBe(false);
    });

    it('should provide suggestions for non-compliant themes', () => {
      const colors = {
        primary: '#FFFFFF',
        background: '#FFFFFF',
        text: '#CCCCCC', // Low contrast
        border: '#DDDDDD',
        accent: '#EEEEEE'
      };

      const validation = validateThemeColors(colors);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions.some(s => s.includes('contrast'))).toBe(true);
    });

    it('should calculate accessibility score', () => {
      const colors = {
        primary: '#0000AA',
        background: '#000000',
        text: '#FFFFFF',
        border: '#888888',
        accent: '#FFAA00'
      };

      const validation = validateThemeColors(colors);
      expect(validation.overall.score).toBeGreaterThan(0);
      expect(validation.overall.score).toBeLessThanOrEqual(100);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate 6-digit hex colors', () => {
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#123ABC')).toBe(true);
    });

    it('should validate 3-digit hex colors', () => {
      expect(isValidHexColor('#FFF')).toBe(true);
      expect(isValidHexColor('#000')).toBe(true);
      expect(isValidHexColor('#ABC')).toBe(true);
    });

    it('should validate hex colors without # prefix', () => {
      expect(isValidHexColor('FFFFFF')).toBe(true);
      expect(isValidHexColor('000')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('invalid')).toBe(false);
      expect(isValidHexColor('#GGGGGG')).toBe(false);
      expect(isValidHexColor('#12345')).toBe(false);
    });
  });

  describe('normalizeHexColor', () => {
    it('should add # prefix if missing', () => {
      const result1 = normalizeHexColor('FFFFFF');
      const result2 = normalizeHexColor('000');
      expect(result1.startsWith('#')).toBe(true);
      expect(result2.startsWith('#')).toBe(true);
      expect(result1.length).toBe(7);
    });

    it('should preserve # prefix', () => {
      const result = normalizeHexColor('#FFFFFF');
      expect(result.startsWith('#')).toBe(true);
    });

    it('should normalize hex color format', () => {
      const result = normalizeHexColor('#ffffff');
      expect(result.startsWith('#')).toBe(true);
      expect(result.length).toBe(7);
      expect(isValidHexColor(result)).toBe(true);
    });

    it('should expand 3-digit hex to 6-digit', () => {
      const result1 = normalizeHexColor('#FFF');
      const result2 = normalizeHexColor('#ABC');
      const result3 = normalizeHexColor('123');
      expect(result1.length).toBe(7);
      expect(result2.length).toBe(7);
      expect(result3.length).toBe(7);
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      const white = rgbToHex(255, 255, 255);
      const black = rgbToHex(0, 0, 0);
      expect(white.toLowerCase()).toBe('#ffffff');
      expect(black).toBe('#000000');
      expect(isValidHexColor(white)).toBe(true);
      expect(isValidHexColor(black)).toBe(true);
    });

    it('should pad single digit values', () => {
      const result1 = rgbToHex(0, 15, 255);
      const result2 = rgbToHex(1, 2, 3);
      expect(result1.toLowerCase()).toBe('#000fff');
      expect(result2).toBe('#010203');
      expect(result1.length).toBe(7);
      expect(result2.length).toBe(7);
    });
  });

  describe('darkenColor', () => {
    it('should darken a color by percentage', () => {
      const original = '#FFFFFF';
      const darkened = darkenColor(original, 20);

      expect(darkened).not.toBe(original);
      expect(isValidHexColor(darkened)).toBe(true);
      // Darkened color should have lower RGB values
      expect(darkened.toLowerCase()).not.toBe('#ffffff');
    });

    it('should return black when darkening by 100%', () => {
      const darkened = darkenColor('#FFFFFF', 100);
      expect(darkened).toBe('#000000');
    });
  });

  describe('lightenColor', () => {
    it('should lighten a color by percentage', () => {
      const original = '#000000';
      const lightened = lightenColor(original, 20);

      expect(lightened).not.toBe(original);
      expect(isValidHexColor(lightened)).toBe(true);
      // Lightened color should have higher RGB values
      expect(lightened).not.toBe('#000000');
    });

    it('should return white when lightening by 100%', () => {
      const lightened = lightenColor('#000000', 100);
      expect(lightened.toLowerCase()).toBe('#ffffff');
      expect(isValidHexColor(lightened)).toBe(true);
    });
  });

  describe('Theme Export/Import', () => {
    const sampleTheme = {
      id: 'test-theme',
      name: 'Test Theme',
      description: 'A test theme',
      colors: {
        primary: '#0000AA',
        background: '#000000',
        text: '#FFFFFF',
        border: '#888888',
        accent: '#FFAA00',
        shadow: '#000000'
      },
      isCustom: true as const,
      createdAt: Date.now()
    };

    it('should export theme to JSON string', () => {
      const json = exportThemeJSON(sampleTheme);
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should import theme from JSON string', () => {
      const json = exportThemeJSON(sampleTheme);
      const imported = importThemeJSON(json);

      expect(imported).not.toBeNull();
      expect(imported?.id).toBe(sampleTheme.id);
      expect(imported?.name).toBe(sampleTheme.name);
      expect(imported?.colors.primary).toBe(sampleTheme.colors.primary);
    });

    it('should handle round-trip export/import', () => {
      const json = exportThemeJSON(sampleTheme);
      const imported = importThemeJSON(json);

      expect(imported).not.toBeNull();
      expect(imported?.id).toBe(sampleTheme.id);
      expect(imported?.name).toBe(sampleTheme.name);
      expect(imported?.colors).toEqual(sampleTheme.colors);
    });

    it('should return null for invalid JSON', () => {
      const imported = importThemeJSON('invalid json {]');
      expect(imported).toBeNull();
    });
  });

  describe('Share Code', () => {
    const sampleTheme = {
      id: 'share-test',
      name: 'Share Test',
      description: 'A share test theme',
      colors: {
        primary: '#FF0000',
        background: '#000000',
        text: '#FFFFFF',
        border: '#888888',
        accent: '#00FF00',
        shadow: '#000000'
      },
      isCustom: true as const,
      createdAt: Date.now()
    };

    it('should generate share code for theme', () => {
      const code = generateShareCode(sampleTheme);
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    it('should parse share code back to theme', () => {
      const code = generateShareCode(sampleTheme);
      const parsed = parseShareCode(code);

      expect(parsed).not.toBeNull();
      expect(parsed?.colors.primary).toBe(sampleTheme.colors.primary);
      expect(parsed?.colors.background).toBe(sampleTheme.colors.background);
    });

    it('should handle round-trip share code', () => {
      const code = generateShareCode(sampleTheme);
      const parsed = parseShareCode(code);

      expect(parsed).not.toBeNull();
      expect(parsed?.colors.primary).toBe(sampleTheme.colors.primary);
      expect(parsed?.colors.background).toBe(sampleTheme.colors.background);
      expect(parsed?.colors.text).toBe(sampleTheme.colors.text);
    });

    it('should return null for invalid share code', () => {
      const parsed = parseShareCode('invalid-code-xyz');
      expect(parsed).toBeNull();
    });

    it('should generate different codes for different themes', () => {
      const theme2 = {
        ...sampleTheme,
        colors: {
          ...sampleTheme.colors,
          primary: '#0000FF'
        }
      };

      const code1 = generateShareCode(sampleTheme);
      const code2 = generateShareCode(theme2);

      expect(code1).not.toBe(code2);
    });
  });
});
