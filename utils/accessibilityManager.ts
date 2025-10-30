/**
 * Accessibility Manager
 *
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance.
 * Provides focus management, ARIA utilities, color contrast validation,
 * and screen reader announcement system.
 *
 * @module accessibilityManager
 * @since 1.4.0
 */

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  screenReaderOptimized: boolean;
  focusIndicatorStyle: 'default' | 'thick' | 'underline';
  announceMessages: boolean;
  keyboardNavigationHints: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  screenReaderOptimized: false,
  focusIndicatorStyle: 'default',
  announceMessages: true,
  keyboardNavigationHints: true
};

/**
 * WCAG 2.1 AA contrast ratio requirement (4.5:1 for normal text, 3:1 for large text)
 */
export const WCAG_AA_NORMAL_CONTRAST = 4.5;
export const WCAG_AA_LARGE_CONTRAST = 3.0;
export const WCAG_AAA_NORMAL_CONTRAST = 7.0;
export const WCAG_AAA_LARGE_CONTRAST = 4.5;

/**
 * Calculates relative luminance of an RGB color
 * Formula from WCAG 2.1 specification
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Converts hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculates contrast ratio between two colors
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    console.error('Invalid color format for contrast calculation');
    return 1;
  }

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validates if contrast ratio meets WCAG AA requirements
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? WCAG_AA_LARGE_CONTRAST : WCAG_AA_NORMAL_CONTRAST;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required
  };
}

/**
 * Validates if contrast ratio meets WCAG AAA requirements
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? WCAG_AAA_LARGE_CONTRAST : WCAG_AAA_NORMAL_CONTRAST;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required
  };
}

/**
 * Screen Reader Announcement System
 */
export class ScreenReaderAnnouncer {
  private static liveRegion: HTMLDivElement | null = null;

  /**
   * Initialize the live region for screen reader announcements
   */
  static initialize(): void {
    if (this.liveRegion) return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.id = 'a11y-announcer';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce a message to screen readers
   * @param message - Message to announce
   * @param priority - 'polite' (default) or 'assertive' for urgent messages
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.initialize();

    if (!this.liveRegion) return;

    // Update aria-live attribute based on priority
    this.liveRegion.setAttribute('aria-live', priority);

    // Clear and set message (forces announcement)
    this.liveRegion.textContent = '';
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Announce assertively (interrupts current announcements)
   */
  static announceAssertive(message: string): void {
    this.announce(message, 'assertive');
  }

  /**
   * Clear current announcement
   */
  static clear(): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = '';
    }
  }
}

/**
 * Focus Management Utilities
 */
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement | Document = document): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors));
  }

  /**
   * Get first focusable element in container
   */
  static getFirstFocusable(container: HTMLElement | Document = document): HTMLElement | null {
    const elements = this.getFocusableElements(container);
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * Get last focusable element in container
   */
  static getLastFocusable(container: HTMLElement | Document = document): HTMLElement | null {
    const elements = this.getFocusableElements(container);
    return elements.length > 0 ? elements[elements.length - 1] : null;
  }

  /**
   * Trap focus within a container (for modals)
   * @returns Cleanup function to remove event listener
   */
  static trapFocus(container: HTMLElement): () => void {
    const firstFocusable = this.getFirstFocusable(container);
    const lastFocusable = this.getLastFocusable(container);

    if (!firstFocusable) return () => {};

    // Focus first element
    firstFocusable.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: moving backward
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: moving forward
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Restore focus to previously focused element
   */
  static saveFocus(): () => void {
    const previouslyFocused = document.activeElement as HTMLElement;

    return () => {
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }
}

/**
 * ARIA Attribute Utilities
 */
export class ARIAManager {
  /**
   * Set aria-label on element
   */
  static setLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  /**
   * Set aria-describedby relationship
   */
  static setDescribedBy(element: HTMLElement, descriptionId: string): void {
    element.setAttribute('aria-describedby', descriptionId);
  }

  /**
   * Set aria-labelledby relationship
   */
  static setLabelledBy(element: HTMLElement, labelId: string): void {
    element.setAttribute('aria-labelledby', labelId);
  }

  /**
   * Set aria-expanded state
   */
  static setExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', String(expanded));
  }

  /**
   * Set aria-pressed state (for toggle buttons)
   */
  static setPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', String(pressed));
  }

  /**
   * Set aria-checked state (for checkboxes/radio)
   */
  static setChecked(element: HTMLElement, checked: boolean): void {
    element.setAttribute('aria-checked', String(checked));
  }

  /**
   * Set aria-disabled state
   */
  static setDisabled(element: HTMLElement, disabled: boolean): void {
    element.setAttribute('aria-disabled', String(disabled));
  }

  /**
   * Set aria-busy loading state
   */
  static setBusy(element: HTMLElement, busy: boolean): void {
    element.setAttribute('aria-busy', String(busy));
  }

  /**
   * Set aria-live region
   */
  static setLive(element: HTMLElement, live: 'off' | 'polite' | 'assertive'): void {
    element.setAttribute('aria-live', live);
  }

  /**
   * Set role attribute
   */
  static setRole(element: HTMLElement, role: string): void {
    element.setAttribute('role', role);
  }

  /**
   * Remove ARIA attribute
   */
  static removeAttribute(element: HTMLElement, attribute: string): void {
    element.removeAttribute(attribute);
  }
}

/**
 * Keyboard Navigation Utilities
 */
export class KeyboardNav {
  /**
   * Check if user is navigating via keyboard (Tab key)
   */
  static isKeyboardNav(): boolean {
    return document.body.classList.contains('user-is-tabbing');
  }

  /**
   * Initialize keyboard navigation detection
   * Adds 'user-is-tabbing' class to body when Tab key is used
   */
  static initialize(): void {
    let hadKeyboardEvent = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (!hadKeyboardEvent) {
          hadKeyboardEvent = true;
          document.body.classList.add('user-is-tabbing');
        }
      }
    };

    const handleMouseDown = () => {
      if (hadKeyboardEvent) {
        hadKeyboardEvent = false;
        document.body.classList.remove('user-is-tabbing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    // Cleanup not provided as this should persist for app lifetime
  }

  /**
   * Handle arrow key navigation in a list
   * @returns Cleanup function
   */
  static handleArrowKeys(
    container: HTMLElement,
    options: {
      orientation?: 'horizontal' | 'vertical';
      loop?: boolean;
    } = {}
  ): () => void {
    const { orientation = 'vertical', loop = true } = options;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = FocusManager.getFocusableElements(container);
      const currentIndex = items.findIndex(item => item === document.activeElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (orientation === 'vertical') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
      } else {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
      }

      if (nextIndex < 0) {
        nextIndex = loop ? items.length - 1 : 0;
      } else if (nextIndex >= items.length) {
        nextIndex = loop ? 0 : items.length - 1;
      }

      items[nextIndex]?.focus();
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

/**
 * Reduced Motion Detection
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * High Contrast Detection
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Dark Mode Detection
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Initialize all accessibility systems
 */
export function initializeAccessibility(): void {
  ScreenReaderAnnouncer.initialize();
  KeyboardNav.initialize();

  console.log('Accessibility systems initialized');
}
