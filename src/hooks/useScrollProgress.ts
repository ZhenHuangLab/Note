import { useEffect, useState } from 'react';

export interface ScrollProgressResult {
  scrollProgress: number;  // 0-100
  scrollRotation: number;  // 0-180 (for Y-axis rotation via rotateDeltaSpring.x)
}

/**
 * Hook to track scroll progress and calculate rotation for card flip animation.
 *
 * Returns scrollProgress (0-100%) and scrollRotation (0-180°).
 * The scrollRotation maps to rotateDeltaSpring.x which drives rotateY() transformation
 * (horizontal flip), NOT rotateX() which would be vertical tilt.
 *
 * Performance optimizations:
 * - Uses passive event listener for better scroll performance
 * - RAF throttling with debounce flag prevents memory leak
 * - Division-by-zero guard for short pages
 */
export const useScrollProgress = (): ScrollProgressResult => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollRotation, setScrollRotation] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reason: Prevent RAF memory leak by debouncing with flag.
    // Without this, scroll events (100+/sec) queue more RAF callbacks than can be processed (60/sec).
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return; // Skip if RAF already pending

      rafId = requestAnimationFrame(() => {
        rafId = null;

        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;

        // Reason: Guard against division by zero on short pages or large viewports.
        // If content fits in viewport, documentHeight === windowHeight → denominator = 0 → NaN.
        const progress = (scrollY / Math.max(docHeight - winHeight, 1)) * 100;

        // Clamp rotation at 180° (full flip)
        const rotation = Math.min(progress * 1.8, 180);

        setScrollProgress(progress);
        setScrollRotation(rotation);
      });
    };

    // Initial calculation
    handleScroll();

    // Passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return { scrollProgress, scrollRotation };
};
