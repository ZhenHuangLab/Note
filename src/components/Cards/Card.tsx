import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSpringRaf } from './useSpringRaf';
import CardHud from './CardHud';
import { adjust, clamp } from './math';

interface CardProps {
  img: string;
  imgLarge?: string;
  subtypes?: string;
  supertype?: string;
  number?: string;
  name?: string;
  rarity?: string;
  showcase?: boolean;
}

const Card: React.FC<CardProps> = ({
  img,
  imgLarge,
  subtypes = '',
  supertype = '',
  number = '',
  name = '',
  rarity = 'common',
  showcase = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

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
    setIsActive(true);
    updateFromPointer(e.clientX, e.clientY);
  }, [updateFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isActive) return;
    updateFromPointer(e.clientX, e.clientY);
  }, [isActive, updateFromPointer]);

  const handlePointerLeave = useCallback(() => {
    setIsActive(false);
    resetCard();
  }, [resetCard]);

  // Touch event handlers (unified with pointer events)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsActive(true);
      updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [updateFromPointer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isActive || e.touches.length !== 1) return;
    updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, [isActive, updateFromPointer]);

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
    resetCard();
  }, [resetCard]);

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

  // Build CSS classes
  const cardClasses = [
    'cards',
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
            src="/img/card-back.webp"
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
