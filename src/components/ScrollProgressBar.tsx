import React from 'react';
import styles from './ScrollProgressBar.module.css';

export interface ScrollProgressBarProps {
  scrollProgress: number;  // Scroll progress percentage (0-100) for dynamic height
  isFlipping: boolean;     // Show indicator only during active flip
  flipVelocity: number;    // Rotation velocity (deg/frame) for elastic effect
}

/**
 * Elastic flip progress indicator that appears on the right edge during card flip.
 *
 * Design changes:
 * - Dynamic height (0-20vh) mapped from scroll progress (0-100%)
 * - Pure white color (no glassmorphism)
 * - Elastic scaling based on flip velocity (faster flip = more stretch)
 * - Shows only during active flip motion (instant on/off)
 * - Smooth height transitions prevent jarring jumps during non-uniform scrolling
 */
const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({ scrollProgress, isFlipping, flipVelocity }) => {
  // Reason: Elastic factor amplifies visual feedback - velocity [0-10] → scale [1.0-1.3]
  // Clamped to prevent excessive stretch that breaks visual hierarchy
  const elasticFactor = Math.min(flipVelocity * 0.03, 0.3);

  // Reason: Map scroll progress (0-100%) to height (0-20vh)
  // This provides visual feedback of flip progress, not just flip velocity
  const progressHeight = `${scrollProgress * 0.2}vh`;

  return (
    <div
      className={styles.progressBar}
      style={{
        '--elastic-scale': 1 + elasticFactor,
        '--progress-height': progressHeight,
        opacity: isFlipping ? 1 : 0,
      } as React.CSSProperties}
      aria-label={isFlipping ? 'Card is flipping' : 'Card flip indicator'}
      aria-hidden={!isFlipping}
      role="status"
      aria-live="polite"
    />
  );
};

export default ScrollProgressBar;
