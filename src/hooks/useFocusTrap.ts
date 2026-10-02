/**
 * useFocusTrap Hook
 *
 * React hook for trapping focus within a modal or dialog component.
 * Ensures keyboard users stay within the modal until it's closed.
 *
 * @module useFocusTrap
 * @since 1.4.0
 */

import { useEffect, useRef } from 'react';
import { FocusManager } from '../utils/accessibilityManager';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Save current focus to restore later
    restoreFocusRef.current = FocusManager.saveFocus();

    // Trap focus within container
    const cleanup = FocusManager.trapFocus(container);

    return () => {
      cleanup();
      // Restore focus to previously focused element
      restoreFocusRef.current?.();
      restoreFocusRef.current = null;
    };
  }, [isActive]);

  return containerRef;
}
