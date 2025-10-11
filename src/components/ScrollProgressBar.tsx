import React, { useEffect, useState } from 'react';
import styles from './ScrollProgressBar.module.css';

export interface ScrollProgressBarProps {
  scrollProgress: number; // 0-100
}

// Auto-hide delay after scroll stops
const HIDE_DELAY_MS = 1000;

/**
 * Animated progress indicator that appears on the right edge during scroll
 * and auto-hides 1 second after scroll stops.
 *
 * Design: Glassmorphism effect with smooth opacity transitions.
 */
const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({ scrollProgress }) => {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    // SSR guard - window doesn't exist during Docusaurus build
    if (typeof window === 'undefined') return;

    // Show progress bar immediately when scroll progress changes
    setIsScrolling(true);

    // Debounced hide after 1 second of no scroll updates
    const hideTimeout = window.setTimeout(() => {
      setIsScrolling(false);
    }, HIDE_DELAY_MS);

    return () => {
      clearTimeout(hideTimeout);
    };
  }, [scrollProgress]);

  // Clamp progress to valid range for defensive programming
  const clampedProgress = Math.max(0, Math.min(100, scrollProgress));

  return (
    <div
      className={styles.progressBar}
      style={{
        '--scroll-progress': clampedProgress,
        opacity: isScrolling ? 1 : 0,
      } as React.CSSProperties}
      aria-label={`Scroll progress: ${Math.round(clampedProgress)}%`}
      aria-hidden={!isScrolling}
      role="progressbar"
      aria-valuenow={Math.round(clampedProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
};

export default ScrollProgressBar;
