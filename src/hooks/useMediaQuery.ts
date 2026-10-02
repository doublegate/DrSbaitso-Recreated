/**
 * useMediaQuery Hook
 *
 * React hook for responsive design using CSS media queries.
 * Provides reactive breakpoint detection for mobile, tablet, and desktop layouts.
 *
 * @version 1.2.0
 */

import { useState, useEffect } from 'react';

/**
 * Device breakpoints
 */
export const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(hover: none) and (pointer: coarse)', // Touch devices
  mouse: '(hover: hover) and (pointer: fine)', // Mouse/trackpad devices
} as const;

/**
 * Custom hook to match media queries
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean - True if media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Handler for media query changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes (modern API)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Hook to detect if device is mobile
 * @returns boolean - True if mobile device
 */
export function useIsMobile(): boolean {
  return useMediaQuery(BREAKPOINTS.mobile);
}

/**
 * Hook to detect if device is tablet
 * @returns boolean - True if tablet device
 */
export function useIsTablet(): boolean {
  return useMediaQuery(BREAKPOINTS.tablet);
}

/**
 * Hook to detect if device is desktop
 * @returns boolean - True if desktop device
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.desktop);
}

/**
 * Hook to detect if device has touch input
 * @returns boolean - True if touch-capable device
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery(BREAKPOINTS.touch);
}

/**
 * Hook to get current device type
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

/**
 * Hook to get viewport dimensions
 * @returns { width: number, height: number }
 */
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
