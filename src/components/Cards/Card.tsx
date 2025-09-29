import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSpringRaf } from './useSpringRaf';
import CardHud from './CardHud';
import { adjust, clamp, round } from './math';
import { orientation, resetBaseOrientation, OrientationState } from './orientation';

const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    handleChange(media);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange as (event: MediaQueryListEvent) => void);
      return () => media.removeEventListener('change', handleChange as (event: MediaQueryListEvent) => void);
    }

    media.addListener(handleChange as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
    return () => media.removeListener(handleChange as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
  }, []);

  return prefersReducedMotion;
};

export interface CardProps {
  img: string;
  imgLarge?: string;
  subtypes?: string;
  supertype?: string;
  number?: string;
  name?: string;
  rarity?: string;
  showcase?: boolean;
  types?: string;
  set?: string;
  pageURL?: string;
  back?: string;
  foil?: string;
  mask?: string;
}

const Card: React.FC<CardProps> = ({
  img,
  imgLarge,
  subtypes = '',
  supertype = '',
  number = '',
  name = '',
  rarity = 'common',
  showcase = false,
  types = '',
  set,
  pageURL,
  back = '/img/card-back.webp',
  foil,
  mask,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const showcaseTimeoutRef = useRef<NodeJS.Timeout>();
  const showcaseAnimationRef = useRef<number>();
  const controllerRef = useRef<'idle' | 'pointer' | 'orientation' | 'showcase'>('idle');
  const orientationEngagedRef = useRef(false);
  const orientationReadyRef = useRef(false);
  const orientationIdleFramesRef = useRef(0);
  const showcasingRef = useRef(false);
  const showcaseHasRunRef = useRef(false);

  // Always use interactive config for springs, control behavior via target values
  const springConfig = { stiffness: 0.15, damping: 0.8, precision: 0.01 };

  const motionIntensity = prefersReducedMotion ? 0.6 : 1;
  const activeScale = prefersReducedMotion ? 1.02 : 1.05;
  const activeTranslateY = prefersReducedMotion ? -2 : -5;

  // Initialize springs for different CSS variable groups
  const rotateSpring = useSpringRaf(
    { x: 0, y: 0 },
    springConfig,
    cardRef,
    ['--rotate-x', '--rotate-y']
  );

  const glareSpring = useSpringRaf(
    { x: 50, y: 50 },
    springConfig,
    cardRef,
    ['--glare-x', '--glare-y']
  );

  const backgroundSpring = useSpringRaf(
    { x: 50, y: 50 },
    springConfig,
    cardRef,
    ['--background-x', '--background-y']
  );

  const scaleSpring = useSpringRaf(
    1,
    springConfig,
    cardRef,
    '--card-scale'
  );

  const translateSpring = useSpringRaf(
    { x: 0, y: 0 },
    springConfig,
    cardRef,
    ['--translate-x', '--translate-y']
  );

  // Pointer position tracking (not spring-animated)
  const setPointerPosition = useCallback((x: number, y: number) => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--pointer-x', `${x}%`);
    cardRef.current.style.setProperty('--pointer-y', `${y}%`);

    // Calculate derived values
    const fromCenterX = (x - 50) / 50;
    const fromCenterY = (y - 50) / 50;
    const fromCenter = Math.sqrt(fromCenterX * fromCenterX + fromCenterY * fromCenterY);

    cardRef.current.style.setProperty('--pointer-from-center', String(clamp(fromCenter, 0, 1)));
    cardRef.current.style.setProperty('--pointer-from-top', String(y / 100));
    cardRef.current.style.setProperty('--pointer-from-left', String(x / 100));
  }, []);

  // Calculate values from pointer position
  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!cardRef.current) return;

    controllerRef.current = 'pointer';
    orientationEngagedRef.current = false;
    orientationReadyRef.current = false;
    orientationIdleFramesRef.current = 0;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // Clamp to valid range
    const px = clamp(x, 0, 100);
    const py = clamp(y, 0, 100);

    // Update pointer position immediately (no spring)
    setPointerPosition(px, py);

    // Calculate rotation values
    const rotateX = adjust(py, 0, 100, 15, -15) * motionIntensity;  // Y position maps to X rotation (inverted)
    const rotateY = adjust(px, 0, 100, -15, 15) * motionIntensity;  // X position maps to Y rotation

    // Calculate glare position (follows pointer with some offset)
    const glareX = px;
    const glareY = py;

    // Calculate background position (inverse of pointer for parallax effect)
    const bgXBase = adjust(px, 0, 100, 60, 40);
    const bgYBase = adjust(py, 0, 100, 60, 40);
    const bgX = (bgXBase - 50) * motionIntensity + 50;
    const bgY = (bgYBase - 50) * motionIntensity + 50;

    // Set spring targets
    rotateSpring.setTarget({ x: rotateX, y: rotateY });
    glareSpring.setTarget({ x: glareX, y: glareY });
    backgroundSpring.setTarget({ x: bgX, y: bgY });
    scaleSpring.setTarget(activeScale);
    translateSpring.setTarget({ x: 0, y: activeTranslateY });
  }, [rotateSpring, glareSpring, backgroundSpring, scaleSpring, translateSpring, setPointerPosition, motionIntensity, activeScale, activeTranslateY]);

  // Reset to default state - for snap-back, jump to values instantly then slowly animate back
  const resetCard = useCallback(() => {
    orientationEngagedRef.current = false;
    orientationReadyRef.current = false;
    orientationIdleFramesRef.current = 0;
    if (controllerRef.current !== 'pointer') {
      controllerRef.current = 'idle';
    }

    setPointerPosition(50, 50);

    // For snap-back effect, we need to slowly animate back
    // Jump to current position first, then set target to default
    rotateSpring.setTarget({ x: 0, y: 0 });
    glareSpring.setTarget({ x: 50, y: 50 });
    backgroundSpring.setTarget({ x: 50, y: 50 });
    scaleSpring.setTarget(1);
    translateSpring.setTarget({ x: 0, y: 0 });
  }, [rotateSpring, glareSpring, backgroundSpring, scaleSpring, translateSpring, setPointerPosition]);

  // Event handlers
  const handlePointerEnter = useCallback((e: React.PointerEvent) => {
    controllerRef.current = 'pointer';
    orientationEngagedRef.current = false;
    orientationReadyRef.current = false;
    orientationIdleFramesRef.current = 0;
    showcasingRef.current = false;
    setIsActive(true);
    updateFromPointer(e.clientX, e.clientY);
  }, [updateFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    controllerRef.current = 'pointer';
    orientationEngagedRef.current = false;
    orientationReadyRef.current = false;
    orientationIdleFramesRef.current = 0;
    if (!isActive) return;
    updateFromPointer(e.clientX, e.clientY);
  }, [isActive, updateFromPointer]);

  const handlePointerLeave = useCallback(() => {
    controllerRef.current = 'idle';
    orientationEngagedRef.current = false;
    orientationReadyRef.current = false;
    orientationIdleFramesRef.current = 0;
    setIsActive(false);
    resetCard();
  }, [resetCard]);

  // Touch event handlers (unified with pointer events)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      controllerRef.current = 'pointer';
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;
      showcasingRef.current = false;
      setIsActive(true);
      updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [updateFromPointer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    controllerRef.current = 'pointer';
    orientationEngagedRef.current = false;
    orientationReadyRef.current = false;
    orientationIdleFramesRef.current = 0;
    if (!isActive || e.touches.length !== 1) return;
    updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, [isActive, updateFromPointer]);

  const handleTouchEnd = useCallback(() => {
    controllerRef.current = 'idle';
    orientationEngagedRef.current = false;
    orientationReadyRef.current = false;
    orientationIdleFramesRef.current = 0;
    setIsActive(false);
    resetCard();
  }, [resetCard]);

  const handleClick = useCallback(() => {
    if (!pageURL) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    if (pageURL.startsWith('#')) {
      const targetId = pageURL.slice(1);
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      window.location.hash = pageURL;
      return;
    }
    window.location.assign(pageURL);
  }, [pageURL]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const applyOrientation = useCallback((state: OrientationState) => {
    const limitX = prefersReducedMotion ? 10 : 16;
    const limitY = prefersReducedMotion ? 12 : 18;

    const gamma = clamp(state.relative.gamma, -limitX, limitX);
    const beta = clamp(state.relative.beta, -limitY, limitY);

    const backgroundTarget = {
      x: (adjust(gamma, -limitX, limitX, 37, 63) - 50) * motionIntensity + 50,
      y: (adjust(beta, -limitY, limitY, 33, 67) - 50) * motionIntensity + 50,
    };

    const rotateTarget = {
      x: round(-gamma * motionIntensity),
      y: round(beta * motionIntensity),
    };

    const glareTarget = {
      x: adjust(gamma, -limitX, limitX, 0, 100),
      y: adjust(beta, -limitY, limitY, 0, 100),
    };

    rotateSpring.setTarget(rotateTarget);
    glareSpring.setTarget(glareTarget);
    backgroundSpring.setTarget(backgroundTarget);
    scaleSpring.setTarget(activeScale);
    translateSpring.setTarget({ x: 0, y: activeTranslateY });
    setPointerPosition(glareTarget.x, glareTarget.y);
  }, [rotateSpring, glareSpring, backgroundSpring, scaleSpring, translateSpring, setPointerPosition, prefersReducedMotion, motionIntensity, activeScale, activeTranslateY]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const engageThreshold = 2;
    const releaseThreshold = 0.75;
    const releaseFrames = 20;

    const unsubscribe = orientation.subscribe((state: OrientationState) => {
      if (!state.supported) return;
      if (showcasingRef.current) return;
      if (controllerRef.current === 'pointer' || controllerRef.current === 'showcase') return;

      const gamma = state.relative.gamma;
      const beta = state.relative.beta;
      const magnitude = Math.abs(gamma) + Math.abs(beta);

      if (!orientationEngagedRef.current) {
        if (magnitude < engageThreshold) {
          return;
        }
        orientationEngagedRef.current = true;
        orientationReadyRef.current = false;
        orientationIdleFramesRef.current = 0;
        resetBaseOrientation();
        return;
      }

      if (!orientationReadyRef.current) {
        orientationReadyRef.current = true;
        orientationIdleFramesRef.current = 0;
        return;
      }

      if (magnitude < releaseThreshold) {
        orientationIdleFramesRef.current += 1;
      } else {
        orientationIdleFramesRef.current = 0;
      }

      if (orientationIdleFramesRef.current > releaseFrames) {
        orientationEngagedRef.current = false;
        orientationReadyRef.current = false;
        orientationIdleFramesRef.current = 0;
        controllerRef.current = 'idle';
        setIsActive(false);
        resetCard();
        return;
      }

      controllerRef.current = 'orientation';
      setIsActive(true);
      applyOrientation(state);
    });

    return () => {
      unsubscribe();
    };
  }, [applyOrientation, resetCard]);

  // Initialize CSS variables on mount
  useEffect(() => {
    if (!cardRef.current) return;

    // Set initial CSS variables
    cardRef.current.style.setProperty('--pointer-x', '50%');
    cardRef.current.style.setProperty('--pointer-y', '50%');
    cardRef.current.style.setProperty('--pointer-from-center', '0');
    cardRef.current.style.setProperty('--pointer-from-top', '0.5');
    cardRef.current.style.setProperty('--pointer-from-left', '0.5');
    cardRef.current.style.setProperty('--card-opacity', '1');
  }, []);

  // Track document visibility changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsDocumentVisible(visible);
      if (!visible) {
        // Stop showcase when document becomes hidden
        showcasingRef.current = false;
        if (showcaseAnimationRef.current) {
          cancelAnimationFrame(showcaseAnimationRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Showcase animation effect
  useEffect(() => {
    // Only start showcase if:
    // 1. showcase prop is true
    // 2. document is visible
    // 3. reduced motion is not preferred
    if (!showcase || !isDocumentVisible || prefersReducedMotion || isActive) return;

    let cancelled = false;
    const initialDelay = 2000;
    const cycleDuration = 4000; // 4 seconds

    const clearShowcaseTimeout = () => {
      if (showcaseTimeoutRef.current) {
        clearTimeout(showcaseTimeoutRef.current);
        showcaseTimeoutRef.current = undefined;
      }
    };

    const stopAnimation = () => {
      if (showcaseAnimationRef.current) {
        cancelAnimationFrame(showcaseAnimationRef.current);
        showcaseAnimationRef.current = undefined;
      }
    };

    const finalizeCycle = (resetSprings: boolean) => {
      stopAnimation();
      if (cancelled) return;

      if (resetSprings) {
        controllerRef.current = 'idle';
        orientationEngagedRef.current = false;
        orientationReadyRef.current = false;
        orientationIdleFramesRef.current = 0;
        resetCard();
      }

      showcasingRef.current = false;
      showcaseHasRunRef.current = true;
    };

    const startShowcaseCycle = () => {
      if (cancelled) return;

      controllerRef.current = 'showcase';
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;
      showcasingRef.current = true;
      const startTime = performance.now();

      const step = (timestamp: number) => {
        if (cancelled || controllerRef.current !== 'showcase') {
          finalizeCycle(false);
          return;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / cycleDuration, 1);

        // Sine wave animation matching reference implementation
        // r += 0.05 per frame (~60fps) for full cycle in 4s
        const r = progress * Math.PI * 2; // Full rotation over 4s

        // Rotation range - target approximately ±10deg on X and slightly less on Y
        const rotateAmplitudeX = prefersReducedMotion ? 8 : 10;
        const rotateAmplitudeY = prefersReducedMotion ? 5 : 6.5;
        const rotateX = Math.sin(r) * rotateAmplitudeX;
        const rotateY = Math.cos(r) * rotateAmplitudeY;

        // Glare follows a different phase with moderate sweep
        const glareBase = 50;
        const glareAmplitude = prefersReducedMotion ? 30 : 45;
        const glareX = glareBase + Math.sin(r + Math.PI / 4) * glareAmplitude;
        const glareY = glareBase + Math.cos(r + Math.PI / 4) * glareAmplitude;

        // Background moves inversely with subtle parallax
        const bgAmplitude = prefersReducedMotion ? 8 : 12;
        const bgX = 50 - Math.sin(r) * bgAmplitude;
        const bgY = 50 - Math.cos(r) * bgAmplitude;

        // Update springs
        if (cardRef.current) {
          cardRef.current.style.setProperty('--rotate-x', `${rotateX * motionIntensity}deg`);
          cardRef.current.style.setProperty('--rotate-y', `${rotateY * motionIntensity}deg`);
          cardRef.current.style.setProperty('--glare-x', `${glareX}%`);
          cardRef.current.style.setProperty('--glare-y', `${glareY}%`);
          cardRef.current.style.setProperty('--background-x', `${50 + (bgX - 50) * motionIntensity}%`);
          cardRef.current.style.setProperty('--background-y', `${50 + (bgY - 50) * motionIntensity}%`);
          cardRef.current.style.setProperty('--card-scale', `${prefersReducedMotion ? 1.005 : 1.02}`);
          cardRef.current.style.setProperty('--translate-y', `${prefersReducedMotion ? -1.5 : -3}px`);
        }

        rotateSpring.setTarget({ x: rotateX * motionIntensity, y: rotateY * motionIntensity });
        glareSpring.setTarget({ x: glareX, y: glareY });
        const bgOffsetX = (bgX - 50) * motionIntensity;
        const bgOffsetY = (bgY - 50) * motionIntensity;
        backgroundSpring.setTarget({ x: 50 + bgOffsetX, y: 50 + bgOffsetY });
        scaleSpring.setTarget(prefersReducedMotion ? 1.005 : 1.02);
        translateSpring.setTarget({ x: 0, y: prefersReducedMotion ? -1.5 : -3 });

        if (progress >= 1) {
          finalizeCycle(true);
          return;
        }

        showcaseAnimationRef.current = requestAnimationFrame(step);
      };

      showcaseAnimationRef.current = requestAnimationFrame(step);
    };

    const scheduleAttempt = (delay: number) => {
      clearShowcaseTimeout();
      if (showcaseHasRunRef.current) return;
      showcaseTimeoutRef.current = setTimeout(() => {
        showcaseTimeoutRef.current = undefined;

        if (cancelled || !showcase || !isDocumentVisible || prefersReducedMotion || showcaseHasRunRef.current) {
          return;
        }

        startShowcaseCycle();
      }, delay);
    };

    scheduleAttempt(initialDelay);

    return () => {
      cancelled = true;
      clearShowcaseTimeout();
      stopAnimation();
      controllerRef.current = 'idle';
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;
      showcasingRef.current = false;
    };
  }, [showcase, isDocumentVisible, isActive, rotateSpring, glareSpring, backgroundSpring, scaleSpring, resetCard, prefersReducedMotion, motionIntensity]);

  // Build CSS classes
  const cardClasses = [
    'cards',
    types,
    'interactive',
    isActive && 'active',
    showcase && 'showcase',
    subtypes,
    rarity
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      data-subtypes={subtypes}
      data-supertype={supertype}
      data-number={number}
      data-rarity={rarity}
      data-showcase={showcase}
      data-set={set || undefined}
      data-types={types || undefined}
      data-page-url={pageURL}
      data-has-foil={foil ? 'true' : undefined}
      data-has-mask={mask ? 'true' : undefined}
    >
      <div className="card__translater">
        <button
          type="button"
          className="card__rotator"
          aria-label={`${name} ${number} - ${rarity} ${subtypes}`}
          tabIndex={0}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <img
            className="card__back"
            src={back}
            alt="Card back"
            loading="lazy"
          />
          <div className="card__front">
            <img
              src={imgLarge || img}
              alt={name}
              loading="lazy"
            />
            <div className="card__shine" />
            <div className="card__glare" />
            {process.env.NODE_ENV !== 'production' && (
              <CardHud cardRef={cardRef as unknown as React.RefObject<HTMLElement>} />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Card;
