import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSpringRaf } from './useSpringRaf';
import CardHud from './CardHud';
import { adjust, clamp, round } from './math';
import { orientation, resetBaseOrientation, OrientationState } from './orientation';

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
  const [isShowcasing, setIsShowcasing] = useState(false);
  const showcaseTimeoutRef = useRef<NodeJS.Timeout>();
  const showcaseAnimationRef = useRef<number>();
  const controllerRef = useRef<'idle' | 'pointer' | 'orientation' | 'showcase'>('idle');
  const orientationEngagedRef = useRef(false);
  const orientationReadyRef = useRef(false);
  const orientationIdleFramesRef = useRef(0);
  const showcasingRef = useRef(false);

  // Always use interactive config for springs, control behavior via target values
  const springConfig = { stiffness: 0.15, damping: 0.8, precision: 0.01 };

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
    const rotateX = adjust(py, 0, 100, 15, -15);  // Y position maps to X rotation (inverted)
    const rotateY = adjust(px, 0, 100, -15, 15);  // X position maps to Y rotation

    // Calculate glare position (follows pointer with some offset)
    const glareX = px;
    const glareY = py;

    // Calculate background position (inverse of pointer for parallax effect)
    const bgX = adjust(px, 0, 100, 60, 40);
    const bgY = adjust(py, 0, 100, 60, 40);

    // Set spring targets
    rotateSpring.setTarget({ x: rotateX, y: rotateY });
    glareSpring.setTarget({ x: glareX, y: glareY });
    backgroundSpring.setTarget({ x: bgX, y: bgY });
    scaleSpring.setTarget(1.05);
    translateSpring.setTarget({ x: 0, y: -5 });
  }, [rotateSpring, glareSpring, backgroundSpring, scaleSpring, translateSpring, setPointerPosition]);

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
    setIsShowcasing(false);
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
      setIsShowcasing(false);
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

  const applyOrientation = useCallback((state: OrientationState) => {
    const limitX = 16;
    const limitY = 18;

    const gamma = clamp(state.relative.gamma, -limitX, limitX);
    const beta = clamp(state.relative.beta, -limitY, limitY);

    const backgroundTarget = {
      x: adjust(gamma, -limitX, limitX, 37, 63),
      y: adjust(beta, -limitY, limitY, 33, 67),
    };

    const rotateTarget = {
      x: round(-gamma),
      y: round(beta),
    };

    const glareTarget = {
      x: adjust(gamma, -limitX, limitX, 0, 100),
      y: adjust(beta, -limitY, limitY, 0, 100),
    };

    rotateSpring.setTarget(rotateTarget);
    glareSpring.setTarget(glareTarget);
    backgroundSpring.setTarget(backgroundTarget);
    scaleSpring.setTarget(1.05);
    translateSpring.setTarget({ x: 0, y: -5 });
    setPointerPosition(glareTarget.x, glareTarget.y);
  }, [rotateSpring, glareSpring, backgroundSpring, scaleSpring, translateSpring, setPointerPosition]);

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
    // These are now set by the springs with proper units
  }, []);

  useEffect(() => {
    showcasingRef.current = isShowcasing;
  }, [isShowcasing]);

  // Showcase animation effect
  useEffect(() => {
    if (!showcase || isActive) return;

    // Start showcase after 2s delay
    showcaseTimeoutRef.current = setTimeout(() => {
      controllerRef.current = 'showcase';
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;
      setIsShowcasing(true);
      const startTime = Date.now();
      const duration = 4000; // 4 seconds

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          // Animation complete, reset
          controllerRef.current = 'idle';
          orientationEngagedRef.current = false;
          orientationReadyRef.current = false;
          orientationIdleFramesRef.current = 0;
          setIsShowcasing(false);
          resetCard();
          return;
        }

        // Sine wave animation matching reference implementation
        // r += 0.05 per frame (~60fps) for full cycle in 4s
        const r = progress * Math.PI * 2; // Full rotation over 4s

        // Rotation: X axis varies more than Y
        const rotateX = Math.sin(r) * 15;
        const rotateY = Math.cos(r) * 7.5;

        // Glare follows a different phase
        const glareX = 50 + Math.sin(r + Math.PI / 4) * 40;
        const glareY = 50 + Math.cos(r + Math.PI / 4) * 40;

        // Background moves inversely
        const bgX = 50 - Math.sin(r) * 10;
        const bgY = 50 - Math.cos(r) * 10;

        // Update springs
        rotateSpring.setTarget({ x: rotateX, y: rotateY });
        glareSpring.setTarget({ x: glareX, y: glareY });
        backgroundSpring.setTarget({ x: bgX, y: bgY });
        scaleSpring.setTarget(1.02);

        showcaseAnimationRef.current = requestAnimationFrame(animate);
      };

      showcaseAnimationRef.current = requestAnimationFrame(animate);
    }, 2000);

    return () => {
      if (showcaseTimeoutRef.current) {
        clearTimeout(showcaseTimeoutRef.current);
      }
      if (showcaseAnimationRef.current) {
        cancelAnimationFrame(showcaseAnimationRef.current);
      }
      controllerRef.current = 'idle';
      orientationEngagedRef.current = false;
      orientationReadyRef.current = false;
      orientationIdleFramesRef.current = 0;
      setIsShowcasing(false);
    };
  }, [showcase, isActive, rotateSpring, glareSpring, backgroundSpring, scaleSpring, resetCard]);

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
          className="card__rotator"
          aria-label={`${name} ${number} - ${rarity} ${subtypes}`}
          tabIndex={0}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
