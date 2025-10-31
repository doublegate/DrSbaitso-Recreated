/**
 * Theme Validator
 *
 * Validates theme color schemes for accessibility compliance (WCAG 2.1)
 * Calculates contrast ratios and provides suggestions for improvement
 */

export interface ContrastRatio {
  ratio: number;
  wcagAA: boolean;   // 4.5:1 for normal text
  wcagAAA: boolean;  // 7:1 for normal text
  wcagAALarge: boolean;  // 3:1 for large text
  wcagAAALarge: boolean; // 4.5:1 for large text
}

export interface ThemeValidation {
  textContrast: ContrastRatio;
  accentContrast: ContrastRatio;
  borderContrast: ContrastRatio;
  overall: {
    passWCAG_AA: boolean;
    passWCAG_AAA: boolean;
    score: number; // 0-100
  };
  suggestions: string[];
}

/**
 * Calculate relative luminance of an RGB color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Parse hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  if (hex.length !== 6) {
    return null;
  }

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 0;
  }

  const L1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const L2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Evaluate contrast ratio against WCAG standards
 */
export function evaluateContrast(ratio: number): ContrastRatio {
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7.0,
    wcagAALarge: ratio >= 3.0,
    wcagAAALarge: ratio >= 4.5
  };
}

/**
 * Validate theme colors for accessibility
 */
export function validateThemeColors(colors: {
  primary: string;
  background: string;
  text: string;
  border: string;
  accent: string;
}): ThemeValidation {
  // Calculate contrast ratios
  const textContrast = calculateContrastRatio(colors.text, colors.background);
  const accentContrast = calculateContrastRatio(colors.accent, colors.background);
  const borderContrast = calculateContrastRatio(colors.border, colors.background);

  const textEval = evaluateContrast(textContrast);
  const accentEval = evaluateContrast(accentContrast);
  const borderEval = evaluateContrast(borderContrast);

  // Overall accessibility assessment
  const passWCAG_AA = textEval.wcagAA && accentEval.wcagAALarge;
  const passWCAG_AAA = textEval.wcagAAA && accentEval.wcagAAALarge;

  // Calculate score (0-100)
  let score = 0;
  score += Math.min(textContrast / 7.0, 1) * 50; // Text contrast (50 points)
  score += Math.min(accentContrast / 4.5, 1) * 30; // Accent contrast (30 points)
  score += Math.min(borderContrast / 3.0, 1) * 20; // Border contrast (20 points)

  // Generate suggestions
  const suggestions: string[] = [];

  if (!textEval.wcagAA) {
    suggestions.push(
      `Text contrast (${textEval.ratio}:1) is below WCAG AA standard (4.5:1). ` +
      `Consider using a ${textContrast < 4.5 ? 'darker' : 'lighter'} text color or ` +
      `${textContrast < 4.5 ? 'lighter' : 'darker'} background.`
    );
  } else if (!textEval.wcagAAA) {
    suggestions.push(
      `Text contrast (${textEval.ratio}:1) meets WCAG AA but not AAA (7:1). ` +
      `Consider improving for better readability.`
    );
  }

  if (!accentEval.wcagAALarge) {
    suggestions.push(
      `Accent contrast (${accentEval.ratio}:1) is below WCAG AA standard for large text (3:1). ` +
      `Consider using a more contrasting accent color.`
    );
  }

  if (!borderEval.wcagAALarge) {
    suggestions.push(
      `Border contrast (${borderEval.ratio}:1) is low. ` +
      `Users may have difficulty distinguishing UI boundaries.`
    );
  }

  if (suggestions.length === 0) {
    if (passWCAG_AAA) {
      suggestions.push('Excellent! Theme meets WCAG AAA standards for accessibility.');
    } else {
      suggestions.push('Good! Theme meets WCAG AA standards. Colors are accessible.');
    }
  }

  return {
    textContrast: textEval,
    accentContrast: accentEval,
    borderContrast: borderEval,
    overall: {
      passWCAG_AA,
      passWCAG_AAA,
      score: Math.round(score)
    },
    suggestions
  };
}

/**
 * Suggest color adjustments to improve contrast
 */
export function suggestColorAdjustments(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): { adjustedColor: string; ratio: number } | null {
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return null;

  const bgLum = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  // Determine if we need lighter or darker foreground
  const needLighter = bgLum < 0.5;

  // Binary search for appropriate luminance
  let low = 0, high = 255;
  let bestColor = foreground;
  let bestRatio = 0;

  for (let i = 0; i < 20; i++) {
    const mid = Math.floor((low + high) / 2);
    const testColor = needLighter ?
      `#${mid.toString(16).padStart(2, '0').repeat(3)}` :
      `#${(255 - mid).toString(16).padStart(2, '0').repeat(3)}`;

    const ratio = calculateContrastRatio(testColor, background);

    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestColor = testColor;
    }

    if (ratio < targetRatio) {
      if (needLighter) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    } else {
      if (needLighter) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
  }

  return bestRatio >= targetRatio ? { adjustedColor: bestColor, ratio: bestRatio } : null;
}

/**
 * Check if a color is valid hex format
 */
export function isValidHexColor(color: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Normalize hex color to 6-digit format with #
 */
export function normalizeHexColor(color: string): string {
  color = color.replace(/^#/, '');

  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }

  return `#${color.toLowerCase()}`;
}

// ========== Custom Theme Management (v1.5.0) ==========

export interface CustomTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    text: string;
    border: string;
    accent: string;
  };
  isCustom: true;
  createdAt: number;
  author?: string;
}

/**
 * Generate a unique ID for a custom theme
 */
export function generateThemeId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate all colors in a custom theme
 */
export function isValidCustomTheme(theme: Partial<CustomTheme>): boolean {
  if (!theme.name || theme.name.trim().length === 0) return false;
  if (!theme.colors) return false;

  const { primary, background, text, border, accent } = theme.colors;
  return (
    isValidHexColor(primary) &&
    isValidHexColor(background) &&
    isValidHexColor(text) &&
    isValidHexColor(border) &&
    isValidHexColor(accent)
  );
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Darken a hex color by percentage (0-100)
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - (percent / 100);
  return rgbToHex(
    rgb.r * factor,
    rgb.g * factor,
    rgb.b * factor
  );
}

/**
 * Lighten a hex color by percentage (0-100)
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * factor,
    rgb.g + (255 - rgb.g) * factor,
    rgb.b + (255 - rgb.b) * factor
  );
}

/**
 * Export theme as JSON string
 */
export function exportThemeJSON(theme: CustomTheme): string {
  return JSON.stringify(theme, null, 2);
}

/**
 * Import theme from JSON string
 */
export function importThemeJSON(json: string): CustomTheme | null {
  try {
    const theme = JSON.parse(json) as CustomTheme;
    if (!isValidCustomTheme(theme)) {
      return null;
    }
    // Ensure it's marked as custom
    theme.isCustom = true;
    theme.createdAt = theme.createdAt || Date.now();
    return theme;
  } catch (error) {
    console.error('Failed to import theme:', error);
    return null;
  }
}

/**
 * Generate a shareable theme code (base64 encoded)
 */
export function generateShareCode(theme: CustomTheme): string {
  const json = exportThemeJSON(theme);
  return btoa(json);
}

/**
 * Parse a shareable theme code
 */
export function parseShareCode(code: string): CustomTheme | null {
  try {
    const json = atob(code);
    return importThemeJSON(json);
  } catch (error) {
    console.error('Failed to parse share code:', error);
    return null;
  }
}
