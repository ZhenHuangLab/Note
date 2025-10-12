import { useEffect, useState } from 'react';

export interface ScrollProgressResult {
  scrollProgress: number;  // 0-100
  scrollRotation: number;  // 0-180 (for Y-axis rotation via rotateDeltaSpring.x)
}

// Virtual scroll configuration
const VIRTUAL_SCROLL_MAX = 1000; // Virtual scroll units for full 180° rotation
const WHEEL_SENSITIVITY = 0.5;    // Multiplier for wheel deltaY (lower = slower, more control)

/**
 * Hook to track virtual scroll progress (via wheel events) for card flip animation.
 *
 * Instead of tracking actual page scroll, this hook:
 * 1. Listens to wheel events (mousewheel up/down)
 * 2. Accumulates deltaY into a virtual scroll value (0 to VIRTUAL_SCROLL_MAX)
 * 3. Maps virtual scroll to scrollProgress (0-100%) and scrollRotation (0-180°)
 *
 * Benefits:
 * - Works on pages with minimal height (no need for tall content)
 * - Allows hiding scrollbar while maintaining interaction
 * - User scrolls up/down to flip card without actual page scroll
 *
 * Performance optimizations:
 * - RAF throttling with debounce flag prevents excessive renders
 * - Passive: false needed to preventDefault() and block actual scroll
 */
export const useScrollProgress = (): ScrollProgressResult => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollRotation, setScrollRotation] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Virtual scroll accumulator (0 to VIRTUAL_SCROLL_MAX)
    let virtualScroll = 0;
    let rafId: number | null = null;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll behavior (keeps page static)
      e.preventDefault();

      // Accumulate deltaY into virtual scroll with sensitivity multiplier
      virtualScroll += e.deltaY * WHEEL_SENSITIVITY;

      // Clamp to valid range
      virtualScroll = Math.max(0, Math.min(VIRTUAL_SCROLL_MAX, virtualScroll));

      // RAF throttling: skip if already pending
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        // Map virtual scroll to 0-100% progress
        const progress = (virtualScroll / VIRTUAL_SCROLL_MAX) * 100;

        // Map to 0-180° rotation (full flip)
        const rotation = Math.min(progress * 1.8, 180);

        setScrollProgress(progress);
        setScrollRotation(rotation);
      });
    };

    // Must use passive: false to allow preventDefault()
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return { scrollProgress, scrollRotation };
};
