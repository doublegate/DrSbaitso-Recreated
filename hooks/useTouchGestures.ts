/**
 * useTouchGestures Hook
 *
 * React hook for handling touch gestures (swipe, long-press, tap).
 * Provides easy integration of mobile touch interactions.
 *
 * @version 1.2.0
 */

import { useRef, useEffect, useCallback } from 'react';

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
}

export interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  swipeThreshold?: number; // Minimum distance in pixels to trigger swipe
  longPressDelay?: number; // Milliseconds to trigger long press
  tapMaxDuration?: number; // Maximum tap duration in milliseconds
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  longPressTimer?: NodeJS.Timeout;
}

/**
 * Hook to handle touch gestures on an element
 * @param options - Gesture handlers and configuration
 * @returns ref - Ref to attach to target element
 */
export function useTouchGestures<T extends HTMLElement = HTMLElement>(
  options: TouchGestureOptions
) {
  const elementRef = useRef<T>(null);
  const touchState = useRef<TouchState | null>(null);

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onTap,
    swipeThreshold = 50,
    longPressDelay = 500,
    tapMaxDuration = 200,
  } = options;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };

      // Start long press timer
      if (onLongPress) {
        touchState.current.longPressTimer = setTimeout(() => {
          onLongPress();
          touchState.current = null; // Prevent other gestures
        }, longPressDelay);
      }
    },
    [onLongPress, longPressDelay]
  );

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (touchState.current?.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = undefined;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchState.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const { startX, startY, startTime, longPressTimer } = touchState.current;

      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }

      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const duration = endTime - startTime;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Check for tap (short duration, small movement)
      if (duration < tapMaxDuration && distance < 10) {
        onTap?.();
        touchState.current = null;
        return;
      }

      // Check for swipe
      if (distance >= swipeThreshold) {
        // Determine primary direction
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchState.current = null;
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, swipeThreshold, tapMaxDuration]
  );

  const handleTouchCancel = useCallback(() => {
    if (touchState.current?.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
    }
    touchState.current = null;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return elementRef;
}

/**
 * Hook to detect swipe gestures on entire screen
 * @param options - Gesture handlers
 */
export function useGlobalSwipe(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const { onSwipeLeft, onSwipeRight } = options;

  useEffect(() => {
    let startX: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? null;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startX === null) return;

      const endX = e.changedTouches[0]?.clientX;
      if (endX === undefined) return;

      const deltaX = endX - startX;
      const absX = Math.abs(deltaX);

      if (absX > 75) {
        // Minimum swipe distance
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      startX = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}

/**
 * Hook to enable/disable body scroll (useful for modals on mobile)
 * @param disabled - Whether to disable scroll
 */
export function useDisableBodyScroll(disabled: boolean) {
  useEffect(() => {
    if (!disabled) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [disabled]);
}
