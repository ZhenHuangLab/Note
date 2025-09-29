import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Reason: The showcase effect needs the latest spring/controller handles without retriggering hooks.
const useLatest = <T,>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
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
  const [isInteracting, setIsInteracting] = useState(false);
  const [isShowcaseActive, setIsShowcaseActive] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const showcaseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const showcaseAnimationRef = useRef<number | undefined>(undefined);
  const controllerRef = useRef<'idle' | 'pointer' | 'orientation' | 'showcase'>('idle');
  const orientationEngagedRef = useRef(false);
  const orientationReadyRef = useRef(false);
  const orientationIdleFramesRef = useRef(0);
  const showcasingRef = useRef(false);
  const showcaseHasRunRef = useRef(false);
  const releaseTimeoutRef = useRef<number | undefined>(undefined);
  const pointerPositionRef = useRef({ x: 50, y: 50 });

  const springInteractiveConfig = useMemo(
    () => ({ stiffness: 0.066, damping: 0.25, precision: 0.001 }),
    []
  );
  const springPopoverConfig = useMemo(
    () => ({ stiffness: 0.033, damping: 0.45, precision: 0.001 }),
    []
  );

  const motionIntensity = prefersReducedMotion ? 0.6 : 1;
  const activeScale = prefersReducedMotion ? 1.015 : 1.06;
  const activeTranslateY = prefersReducedMotion ? -2 : -6;
  const glareActiveOpacity = prefersReducedMotion ? 0.65 : 1;
  const snapSoftFactor = prefersReducedMotion ? 0.28 : 0.16;

  const rotateSpring = useSpringRaf(
    { x: 0, y: 0 },
    springInteractiveConfig,
    cardRef,
    ['--rotate-x', '--rotate-y']
  );

  const rotateDeltaSpring = useSpringRaf(
    { x: 0, y: 0 },
    springPopoverConfig,
    cardRef,
    ['--rotate-delta-x', '--rotate-delta-y']
  );

  const glareSpring = useSpringRaf(
    { x: 50, y: 50, o: 0 },
    springInteractiveConfig,
    cardRef,
    ['--glare-x', '--glare-y', '--card-opacity']
  );

  const backgroundSpring = useSpringRaf(
    { x: 50, y: 50 },
    springInteractiveConfig,
    cardRef,
    ['--background-x', '--background-y']
  );

  const scaleSpring = useSpringRaf(
    1,
    springPopoverConfig,
    cardRef,
    '--card-scale'
  );

  const translateSpring = useSpringRaf(
    { x: 0, y: 0 },
    springPopoverConfig,
    cardRef,
    ['--translate-x', '--translate-y']
  );

  const randomSeedRef = useRef({ x: Math.random(), y: Math.random() });

  const setPointerPosition = useCallback((x: number, y: number) => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--pointer-x', `${x}%`);
    cardRef.current.style.setProperty('--pointer-y', `${y}%`);

    const fromCenterX = (x - 50) / 50;
    const fromCenterY = (y - 50) / 50;
    const fromCenter = Math.sqrt(fromCenterX * fromCenterX + fromCenterY * fromCenterY);

    cardRef.current.style.setProperty('--pointer-from-center', String(clamp(fromCenter, 0, 1)));
    cardRef.current.style.setProperty('--pointer-from-top', String(y / 100));
    cardRef.current.style.setProperty('--pointer-from-left', String(x / 100));
  }, []);

  const clearReleaseTimeout = useCallback(() => {
    if (typeof releaseTimeoutRef.current === 'number') {
      clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = undefined;
    }
  }, []);

  const releaseToIdle = useCallback(
    (withInertia: boolean = true) => {
      clearReleaseTimeout();

      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;

      const rotateVelocity = rotateSpring.getVelocity() as Record<string, number>;
      const glareVelocity = glareSpring.getVelocity() as Record<string, number>;
      const backgroundVelocity = backgroundSpring.getVelocity() as Record<string, number>;

      const inertiaRotateScale = prefersReducedMotion ? 4 : 10;
      const inertiaGlareScale = prefersReducedMotion ? 3 : 8;

      if (withInertia) {
        rotateSpring.setTarget({
          x: clamp((rotateVelocity.x ?? 0) * inertiaRotateScale, -20, 20),
          y: clamp((rotateVelocity.y ?? 0) * inertiaRotateScale, -20, 20),
        }, { soft: 0.5 });

        glareSpring.setTarget({
          x: clamp(50 + (glareVelocity.x ?? 0) * inertiaGlareScale, 0, 100),
          y: clamp(50 + (glareVelocity.y ?? 0) * inertiaGlareScale, 0, 100),
          o: clamp((glareVelocity.o ?? 0) * 0.35 + 0.35, 0, 1),
        }, { soft: 0.45 });

        backgroundSpring.setTarget({
          x: clamp(50 + (backgroundVelocity.x ?? 0) * (inertiaGlareScale * 0.35), 30, 70),
          y: clamp(50 + (backgroundVelocity.y ?? 0) * (inertiaGlareScale * 0.35), 30, 70),
        }, { soft: 0.45 });
      }

      releaseTimeoutRef.current = window.setTimeout(() => {
        rotateSpring.setTarget({ x: 0, y: 0 }, { soft: snapSoftFactor });
        rotateDeltaSpring.setTarget({ x: 0, y: 0 }, { soft: snapSoftFactor });
        glareSpring.setTarget({ x: 50, y: 50, o: 0 }, { soft: snapSoftFactor });
        backgroundSpring.setTarget({ x: 50, y: 50 }, { soft: snapSoftFactor });
        scaleSpring.setTarget(1, { soft: snapSoftFactor });
        translateSpring.setTarget({ x: 0, y: 0 }, { soft: snapSoftFactor });
        setPointerPosition(50, 50);
      }, withInertia ? 120 : 0);

      controllerRef.current = 'idle';
      setIsActive(false);
      setIsInteracting(false);
      setIsShowcaseActive(false);
    },
    [
      backgroundSpring,
      clearReleaseTimeout,
      glareSpring,
      prefersReducedMotion,
      rotateDeltaSpring,
      rotateSpring,
      scaleSpring,
      setPointerPosition,
      snapSoftFactor,
      translateSpring,
    ]
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const element = cardRef.current;
      if (!element) return;

      controllerRef.current = 'pointer';
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;

      const rect = element.getBoundingClientRect();
      const px = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const py = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);

      pointerPositionRef.current = { x: px, y: py };
      setPointerPosition(px, py);

      const centerX = px - 50;
      const centerY = py - 50;

      const rotateTarget = {
        x: round(-(centerX / 3.5) * motionIntensity),
        y: round((centerY / 2) * motionIntensity),
      };

      const glareTarget = {
        x: px,
        y: py,
        o: glareActiveOpacity,
      };

      const backgroundTarget = {
        x: (adjust(px, 0, 100, 37, 63) - 50) * motionIntensity + 50,
        y: (adjust(py, 0, 100, 33, 67) - 50) * motionIntensity + 50,
      };

      rotateSpring.setTarget(rotateTarget);
      glareSpring.setTarget(glareTarget);
      backgroundSpring.setTarget(backgroundTarget);
      scaleSpring.setTarget(activeScale, { soft: 0.35 });
      translateSpring.setTarget({ x: 0, y: activeTranslateY }, { soft: 0.35 });
      rotateDeltaSpring.setTarget({ x: 0, y: 0 }, { soft: 0.4 });

      setIsActive(true);
      setIsInteracting(true);
    },
    [
      activeScale,
      activeTranslateY,
      backgroundSpring,
      glareActiveOpacity,
      glareSpring,
      motionIntensity,
      rotateDeltaSpring,
      rotateSpring,
      scaleSpring,
      setPointerPosition,
      translateSpring,
    ]
  );

  // Event handlers
  const handlePointerEnter = useCallback(
    (event: React.PointerEvent) => {
      showcasingRef.current = false;
      setIsShowcaseActive(false);
      updateFromPointer(event.clientX, event.clientY);
    },
    [updateFromPointer]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (controllerRef.current !== 'pointer') {
        updateFromPointer(event.clientX, event.clientY);
        return;
      }
      updateFromPointer(event.clientX, event.clientY);
    },
    [updateFromPointer]
  );

  const handlePointerUp = useCallback(() => {
    releaseToIdle(true);
  }, [releaseToIdle]);

  const handlePointerLeave = useCallback(() => {
    releaseToIdle(true);
  }, [releaseToIdle]);

  // Touch event handlers (unified with pointer events)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsShowcaseActive(false);
      updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [updateFromPointer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isActive || e.touches.length !== 1) return;
    updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, [isActive, updateFromPointer]);

  const handleTouchEnd = useCallback(() => {
    releaseToIdle(true);
  }, [releaseToIdle]);

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

    rotateSpring.setTarget(rotateTarget, { soft: 0.2 });
    glareSpring.setTarget({ ...glareTarget, o: glareActiveOpacity }, { soft: 0.2 });
    backgroundSpring.setTarget(backgroundTarget, { soft: 0.2 });
    scaleSpring.setTarget(activeScale, { soft: 0.2 });
    translateSpring.setTarget({ x: 0, y: activeTranslateY }, { soft: 0.2 });
    rotateDeltaSpring.setTarget({ x: 0, y: 0 }, { soft: 0.2 });
    setPointerPosition(glareTarget.x, glareTarget.y);
    setIsActive(true);
    setIsInteracting(true);
  }, [
    activeScale,
    activeTranslateY,
    backgroundSpring,
    glareActiveOpacity,
    glareSpring,
    motionIntensity,
    prefersReducedMotion,
    rotateDeltaSpring,
    rotateSpring,
    scaleSpring,
    setPointerPosition,
    translateSpring,
  ]);

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
        releaseToIdle(true);
        return;
      }

      controllerRef.current = 'orientation';
      setIsActive(true);
      applyOrientation(state);
    });

    return () => {
      unsubscribe();
    };
  }, [applyOrientation, releaseToIdle]);

  // Initialize CSS variables on mount
  useEffect(() => {
    if (!cardRef.current) return;

    // Set initial CSS variables
    cardRef.current.style.setProperty('--pointer-x', '50%');
    cardRef.current.style.setProperty('--pointer-y', '50%');
    cardRef.current.style.setProperty('--pointer-from-center', '0');
    cardRef.current.style.setProperty('--pointer-from-top', '0.5');
    cardRef.current.style.setProperty('--pointer-from-left', '0.5');
    cardRef.current.style.setProperty('--card-opacity', '0');
  }, []);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const seed = randomSeedRef.current;
    element.style.setProperty('--seedx', `${seed.x}`);
    element.style.setProperty('--seedy', `${seed.y}`);
    const cosmosX = Math.floor(seed.x * 734);
    const cosmosY = Math.floor(seed.y * 1280);
    element.style.setProperty('--cosmosbg', `${cosmosX}px ${cosmosY}px`);
  }, []);

  useEffect(() => () => {
    clearReleaseTimeout();
  }, [clearReleaseTimeout]);

  const rotateSpringRef = useLatest(rotateSpring);
  const glareSpringRef = useLatest(glareSpring);
  const backgroundSpringRef = useLatest(backgroundSpring);
  const scaleSpringRef = useLatest(scaleSpring);
  const translateSpringRef = useLatest(translateSpring);
  const setPointerPositionRef = useLatest(setPointerPosition);
  const releaseToIdleRef = useLatest(releaseToIdle);

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
        releaseToIdle(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [releaseToIdle]);

  // Showcase animation effect
  useEffect(() => {
    if (!showcase || !isDocumentVisible || prefersReducedMotion) return;
    if (showcaseHasRunRef.current) return;

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

      if (resetSprings && controllerRef.current === 'showcase') {
        // Reason: Reset springs when autoplay finishes naturally without clobbering pointer control.
        releaseToIdleRef.current(false);
      }

      showcasingRef.current = false;
      setIsShowcaseActive(false);
      showcaseHasRunRef.current = true;
    };

    const startShowcaseCycle = () => {
      if (cancelled) return;

      if (controllerRef.current !== 'idle' && controllerRef.current !== 'showcase') {
        // Reason: Defer autoplay until pointer/orientation controllers release the card.
        scheduleAttempt(1000);
        return;
      }

      controllerRef.current = 'showcase';
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;
      showcasingRef.current = true;
      setIsShowcaseActive(true);
      setIsActive(true);
      setIsInteracting(true);
      const startTime = performance.now();

      const step = (timestamp: number) => {
        if (cancelled || controllerRef.current !== 'showcase') {
          finalizeCycle(false);
          return;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / cycleDuration, 1);
        const r = progress * Math.PI * 2;

        const rotateAmplitudeX = prefersReducedMotion ? 8 : 10;
        const rotateAmplitudeY = prefersReducedMotion ? 5 : 6.5;
        const rotateX = Math.sin(r) * rotateAmplitudeX;
        const rotateY = Math.cos(r) * rotateAmplitudeY;

        const glareBase = 50;
        const glareAmplitude = prefersReducedMotion ? 30 : 45;
        const glareX = glareBase + Math.sin(r + Math.PI / 4) * glareAmplitude;
        const glareY = glareBase + Math.cos(r + Math.PI / 4) * glareAmplitude;

        const bgAmplitude = prefersReducedMotion ? 8 : 12;
        const bgX = 50 - Math.sin(r) * bgAmplitude;
        const bgY = 50 - Math.cos(r) * bgAmplitude;

        rotateSpringRef.current.setTarget({ x: rotateX * motionIntensity, y: rotateY * motionIntensity });
        glareSpringRef.current.setTarget({ x: glareX, y: glareY, o: prefersReducedMotion ? 0.6 : 0.9 });
        const bgOffsetX = (bgX - 50) * motionIntensity;
        const bgOffsetY = (bgY - 50) * motionIntensity;
        backgroundSpringRef.current.setTarget({ x: 50 + bgOffsetX, y: 50 + bgOffsetY });
        scaleSpringRef.current.setTarget(prefersReducedMotion ? 1.005 : 1.02);
        translateSpringRef.current.setTarget({ x: 0, y: prefersReducedMotion ? -1.5 : -3 });
        setPointerPositionRef.current(glareX, glareY);

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
      if (showcaseHasRunRef.current || cancelled) return;
      showcaseTimeoutRef.current = setTimeout(() => {
        showcaseTimeoutRef.current = undefined;

        if (
          cancelled ||
          showcaseHasRunRef.current ||
          !showcase ||
          !isDocumentVisible ||
          prefersReducedMotion
        ) {
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
      if (controllerRef.current === 'showcase') {
        releaseToIdleRef.current(false);
        controllerRef.current = 'idle';
      }
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;
      showcasingRef.current = false;
      setIsShowcaseActive(false);
    };
  }, [
    showcase,
    isDocumentVisible,
    prefersReducedMotion,
    motionIntensity,
    releaseToIdleRef,
    rotateSpringRef,
    glareSpringRef,
    backgroundSpringRef,
    scaleSpringRef,
    translateSpringRef,
    setPointerPositionRef,
  ]);

  // Build CSS classes
  const cardClasses = [
    'cards',
    types,
    'interactive',
    isActive && !isShowcaseActive && 'active',
    isShowcaseActive && 'showcase-active',
    isInteracting && 'interacting',
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
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
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
