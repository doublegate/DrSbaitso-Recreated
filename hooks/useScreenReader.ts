/**
 * useScreenReader Hook
 *
 * React hook for announcing messages to screen readers.
 * Provides a simple interface for ARIA live region announcements.
 *
 * @module useScreenReader
 * @since 1.4.0
 */

import { useCallback, useEffect } from 'react';
import { ScreenReaderAnnouncer } from '../utils/accessibilityManager';

export function useScreenReader() {
  /**
   * Initialize screen reader announcer on mount
   */
  useEffect(() => {
    ScreenReaderAnnouncer.initialize();
  }, []);

  /**
   * Announce a message politely (doesn't interrupt current speech)
   */
  const announce = useCallback((message: string) => {
    ScreenReaderAnnouncer.announce(message, 'polite');
  }, []);

  /**
   * Announce a message assertively (interrupts current speech)
   */
  const announceAssertive = useCallback((message: string) => {
    ScreenReaderAnnouncer.announceAssertive(message);
  }, []);

  /**
   * Clear current announcement
   */
  const clearAnnouncement = useCallback(() => {
    ScreenReaderAnnouncer.clear();
  }, []);

  return {
    announce,
    announceAssertive,
    clearAnnouncement
  };
}
