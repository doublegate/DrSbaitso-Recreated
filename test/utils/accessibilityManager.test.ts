import { describe, it, expect } from 'vitest';
import { ScreenReaderAnnouncer } from '@/utils/accessibilityManager';

describe('ScreenReaderAnnouncer', () => {
  it('creates a live region that is taken out of the page flow', () => {
    ScreenReaderAnnouncer.initialize();
    const region = document.getElementById('a11y-announcer')!;
    expect(region).toHaveAttribute('aria-live', 'polite');
    // Absolute positioning left it in the body's scroll extent: appended
    // below a full-viewport app, it made the page scroll by its own height.
    expect(region.style.position).toBe('fixed');
    expect(region.style.top).toBe('0px');
  });
});
