import { useEffect, useRef } from 'react';

type SpringValue = number | Record<string, number>;

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  precision?: number;
}

interface SpringControls {
  setTarget: (value: SpringValue) => void;
  jump: (value: SpringValue) => void;
  stop: () => void;
}

/**
 * Deep clone a spring value (number or object)
 */
function cloneValue(value: SpringValue): SpringValue {
  if (typeof value === 'number') {
    return value;
  }
  return { ...value };
}

/**
 * Check if two spring values are compatible (same structure)
 */
function valuesCompatible(a: SpringValue, b: SpringValue): boolean {
  const aIsNumber = typeof a === 'number';
  const bIsNumber = typeof b === 'number';

  if (aIsNumber !== bIsNumber) return false;
  if (aIsNumber) return true;

  const aKeys = Object.keys(a as Record<string, number>).sort();
  const bKeys = Object.keys(b as Record<string, number>).sort();

  return aKeys.length === bKeys.length && aKeys.every((key, i) => key === bKeys[i]);
}

/**
 * RAF-based spring animation hook for CSS variables
 * Implements Svelte-compatible spring physics without React re-renders
 *
 * Physics based on Svelte's spring: velocity = (current - last) / dt
 * Acceleration = (stiffness * delta - damping * velocity) * inv_mass
 *
 * @param initialValue - Initial spring value (number or object like {x: 0, y: 0})
 * @param config - Spring configuration {stiffness=0.15, damping=0.8, precision=0.01}
 * @param elementRef - React ref to the target element
 * @param cssVarNames - CSS variable name(s). For objects, provide array like ['--x', '--y'] matching Object.keys order
 * @returns Controls {setTarget, jump, stop}
 */
export function useSpringRaf(
  initialValue: SpringValue,
  config: SpringConfig,
  elementRef: React.RefObject<HTMLElement>,
  cssVarNames: string | string[]
): SpringControls {
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Merge config with Svelte defaults
  const stiffness = config.stiffness ?? 0.15;
  const damping = config.damping ?? 0.8;
  const precision = config.precision ?? 0.01;

  // Spring state - all cloned to avoid external mutations
  const currentRef = useRef<SpringValue>(cloneValue(initialValue));
  const lastValueRef = useRef<SpringValue>(cloneValue(initialValue));
  const targetRef = useRef<SpringValue>(cloneValue(initialValue));

  const isObject = typeof initialValue !== 'number';

  // For object springs, capture a stable key order once
  // so we can consistently map each key to its CSS variable index.
  // Using a ref avoids re-computing and protects against Object.keys
  // iteration order differences across different objects with the same shape.
  const keyOrderRef = useRef<string[] | null>(
    isObject ? Object.keys(initialValue as Record<string, number>) : null
  );

  /**
   * Determine CSS unit based on variable name
   */
  const getCssUnit = (varName: string): string => {
    if (varName.includes('rotate')) return 'deg';
    if (varName.includes('translate')) return 'px';
    if (varName.includes('scale') || varName.includes('opacity')) return '';
    // Default to % for background and glare positions
    return '%';
  };

  // Validate cssVarNames alignment for objects
  if (isObject) {
    const keys = keyOrderRef.current as string[];
    const vars = cssVarNames as string[];
    if (keys.length !== vars.length) {
      throw new Error(
        `useSpringRaf: cssVarNames length (${vars.length}) must match object keys (${keys.length})`
      );
    }
  }

  /**
   * Single unified animation loop matching Svelte's tick_spring
   */
  const animate = (currentTime: number): void => {
    if (!elementRef.current) {
      // Don't spin the RAF loop if element is missing
      rafIdRef.current = null;
      return;
    }

    // deltaTime: clamp to max 33ms (1000/30) like Svelte to prevent instability
    const elapsed = lastTimeRef.current === 0
      ? 16
      : Math.min(currentTime - lastTimeRef.current, 1000 / 30);

    const dt = (elapsed * 60) / 1000; // Normalize to 60fps scale
    lastTimeRef.current = currentTime;

    let settled = true;
    const inv_mass = 1; // Can be made dynamic for soft springs

    if (isObject) {
      const current = currentRef.current as Record<string, number>;
      const last = lastValueRef.current as Record<string, number>;
      const target = targetRef.current as Record<string, number>;
      const vars = cssVarNames as string[];
      const keys = keyOrderRef.current as string[];


      const nextValue: Record<string, number> = {};

      // Iterate using the stable key order and map 1:1 to cssVarNames
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const delta = target[key] - current[key];
        const velocity = (current[key] - last[key]) / (dt || 1 / 60);

        const spring = stiffness * delta;
        const damper = damping * velocity;
        const acceleration = (spring - damper) * inv_mass;

        const d = (velocity + acceleration) * dt;

        if (Math.abs(d) < precision && Math.abs(delta) < precision) {
          nextValue[key] = target[key];
        } else {
          nextValue[key] = current[key] + d;
          settled = false;
        }

        if (elementRef.current && vars[i] !== undefined) {
          const unit = getCssUnit(vars[i]);
          const cssValue = `${nextValue[key]}${unit}`;
          elementRef.current.style.setProperty(vars[i], cssValue);
        }
      }

      lastValueRef.current = { ...current };
      currentRef.current = nextValue;

    } else {
      const current = currentRef.current as number;
      const last = lastValueRef.current as number;
      const target = targetRef.current as number;

      const delta = target - current;
      const velocity = (current - last) / (dt || 1 / 60);

      const spring = stiffness * delta;
      const damper = damping * velocity;
      const acceleration = (spring - damper) * inv_mass;

      const d = (velocity + acceleration) * dt;

      let nextValue: number;
      if (Math.abs(d) < precision && Math.abs(delta) < precision) {
        nextValue = target; // Snap to target
      } else {
        nextValue = current + d;
        settled = false;
      }

      lastValueRef.current = current;
      currentRef.current = nextValue;

      // Update CSS variable
      if (elementRef.current) {
        const unit = getCssUnit(cssVarNames as string);
        elementRef.current.style.setProperty(cssVarNames as string, `${nextValue}${unit}`);
      }
    }

    // Continue or stop animation
    if (!settled) {
      rafIdRef.current = requestAnimationFrame(animate);
    } else {
      rafIdRef.current = null;
    }
  };

  // Initial CSS variable setup on mount
  useEffect(() => {
    if (!elementRef.current || initializedRef.current) return;

    initializedRef.current = true;

    if (isObject) {
      const vars = cssVarNames as string[];
      const keys = keyOrderRef.current as string[];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (elementRef.current) {
          const unit = getCssUnit(vars[i]);
          elementRef.current.style.setProperty(
            vars[i],
            `${(initialValue as Record<string, number>)[key]}${unit}`
          );
        }
      }
    } else {
      const unit = getCssUnit(cssVarNames as string);
      elementRef.current.style.setProperty(cssVarNames as string, `${initialValue}${unit}`);
    }
  }); // Check on every render, but only initialize once

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []); // Only cleanup on unmount

  const setTarget = (value: SpringValue): void => {
    // Don't start animation if element doesn't exist yet
    if (!elementRef.current) {
      console.warn('useSpringRaf: element ref not set, skipping setTarget');
      return;
    }

    // Validate compatibility
    if (!valuesCompatible(currentRef.current, value)) {
      console.error('useSpringRaf: target value structure incompatible with current value');
      return;
    }

    targetRef.current = cloneValue(value);

    // Start animation if not already running
    if (rafIdRef.current === null) {
      lastTimeRef.current = 0;
      rafIdRef.current = requestAnimationFrame(animate);
    }
  };

  const jump = (value: SpringValue): void => {
    // Validate compatibility
    if (!valuesCompatible(currentRef.current, value)) {
      console.error('useSpringRaf: jump value structure incompatible with current value');
      return;
    }

    const clonedValue = cloneValue(value);
    currentRef.current = clonedValue;
    lastValueRef.current = cloneValue(clonedValue);
    targetRef.current = cloneValue(clonedValue);

    // Update CSS immediately
    if (elementRef.current) {
      if (isObject) {
        const vars = cssVarNames as string[];
        const keys = keyOrderRef.current as string[];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (elementRef.current) {
            const unit = getCssUnit(vars[i]);
            elementRef.current.style.setProperty(
              vars[i],
              `${(value as Record<string, number>)[key]}${unit}`
            );
          }
        }
      } else {
        const unit = getCssUnit(cssVarNames as string);
        elementRef.current.style.setProperty(cssVarNames as string, `${value}${unit}`);
      }
    }

    // Stop animation
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  const stop = (): void => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  return { setTarget, jump, stop };
}
