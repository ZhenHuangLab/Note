import { useEffect, useState } from 'react';

export interface ScrollProgressResult {
  scrollProgress: number;  // 0-100
  scrollRotation: number;  // 0-180 (for Y-axis rotation via rotateDeltaSpring.x)
  isFlipping: boolean;     // True when rotation is actively changing
  flipVelocity: number;    // Absolute rotation velocity (deg/frame) for elastic effect
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
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipVelocity, setFlipVelocity] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Virtual scroll accumulator (0 to VIRTUAL_SCROLL_MAX)
    let virtualScroll = 0;
    let rafId: number | null = null;
    let lastRotation = 0;
    let flipTimeoutId: number | null = null;
    
    // Touch/pointer tracking
    let pointerStartY: number | null = null;
    let isPointerActive = false;

    // Reason: Unified update function for both wheel and touch inputs
    const updateVirtualScroll = (delta: number) => {
      // Bail out if document is hidden (performance optimization)
      if (document.visibilityState !== 'visible') return;

      virtualScroll += delta;
      virtualScroll = Math.max(0, Math.min(VIRTUAL_SCROLL_MAX, virtualScroll));

      // RAF throttling: skip if already pending
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        // Map virtual scroll to 0-100% progress
        const progress = (virtualScroll / VIRTUAL_SCROLL_MAX) * 100;

        // Map to 0-180° rotation (full flip)
        const rotation = Math.min(progress * 1.8, 180);

        // Reason: Calculate rotation delta to detect active flipping state
        const rotationDelta = Math.abs(rotation - lastRotation);
        lastRotation = rotation;

        // Reason: Velocity drives elastic effect - clamp to [0, 10] for smooth animation
        const velocity = Math.min(rotationDelta, 10);

        setScrollProgress(progress);
        setScrollRotation(rotation);
        setFlipVelocity(velocity);

        // Reason: Show indicator instantly when rotation changes (threshold 0.1° filters noise)
        if (rotationDelta > 0.1) {
          setIsFlipping(true);

          // Reason: Clear previous timeout to reset hide delay
          if (flipTimeoutId !== null) {
            clearTimeout(flipTimeoutId);
          }

          // Reason: Hide indicator 150ms after flip stops (instant feedback, no lag)
          flipTimeoutId = window.setTimeout(() => {
            setIsFlipping(false);
            setFlipVelocity(0);
          }, 150);
        }
      });
    };

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll behavior (keeps page static)
      e.preventDefault();

      // Accumulate deltaY into virtual scroll with sensitivity multiplier
      updateVirtualScroll(e.deltaY * WHEEL_SENSITIVITY);
    };

    // Reason: Touch support for mobile devices - track vertical drag to drive flip
    const handlePointerDown = (e: PointerEvent) => {
      // Only handle touch input (mouse is handled by wheel)
      if (e.pointerType !== 'touch') return;

      pointerStartY = e.clientY;
      isPointerActive = true;
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Only process if touch is active and started
      if (!isPointerActive || pointerStartY === null || e.pointerType !== 'touch') return;

      // Prevent default to avoid page scroll during card flip
      e.preventDefault();

      // Calculate vertical delta (negative = swipe up = increase rotation)
      const deltaY = pointerStartY - e.clientY;
      
      // Update pointer position for next delta calculation
      pointerStartY = e.clientY;

      // Apply to virtual scroll (sensitivity tuned for touch)
      updateVirtualScroll(deltaY * 1.5);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;

      isPointerActive = false;
      pointerStartY = null;
    };

    // Must use passive: false to allow preventDefault()
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (flipTimeoutId !== null) {
        clearTimeout(flipTimeoutId);
      }
    };
  }, []);

  return { scrollProgress, scrollRotation, isFlipping, flipVelocity };
};
