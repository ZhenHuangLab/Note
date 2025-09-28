import { useEffect, useRef, type RefObject } from 'react';

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

const getCssUnit = (varName: string): string => {
  if (varName.includes('rotate')) return 'deg';
  if (varName.includes('translate')) return 'px';
  if (varName.includes('scale') || varName.includes('opacity')) return '';
  return '%';
};

type SpringTrack = {
  step: (deltaMs: number) => boolean;
  hasWork: () => boolean;
  isPaused: () => boolean;
  handlePause: () => void;
  handleResume: () => void;
};

interface SchedulerEntry {
  track: SpringTrack;
  paused: boolean;
}

interface SpringScheduler {
  ensure: (track: SpringTrack) => void;
  remove: (track: SpringTrack) => void;
}

const createSpringScheduler = (): SpringScheduler => {
  const entries = new Map<SpringTrack, SchedulerEntry>();
  let rafId: number | null = null;
  let lastTime = 0;
  let pageHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';

  const tick = (time: number) => {
    if (entries.size === 0) {
      rafId = null;
      lastTime = 0;
      return;
    }

    if (pageHidden) {
      rafId = null;
      lastTime = 0;
      entries.forEach((entry) => {
        if (!entry.paused) {
          entry.track.handlePause();
          entry.paused = true;
        }
      });
      return;
    }

    const deltaMs = lastTime === 0 ? 16 : Math.min(time - lastTime, 1000 / 30);
    lastTime = time;

    const toRemove: SpringTrack[] = [];

    entries.forEach((entry, track) => {
      if (!track.hasWork()) {
        if (!entry.paused) {
          track.handlePause();
          entry.paused = true;
        }
        toRemove.push(track);
        return;
      }

      if (track.isPaused()) {
        if (!entry.paused) {
          track.handlePause();
          entry.paused = true;
        }
        return;
      }

      if (entry.paused) {
        track.handleResume();
        entry.paused = false;
      }

      const stillRunning = track.step(deltaMs);
      if (!stillRunning) {
        entry.paused = true;
        toRemove.push(track);
      }
    });

    if (toRemove.length > 0) {
      toRemove.forEach((track) => entries.delete(track));
    }

    if (entries.size > 0) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
      lastTime = 0;
    }
  };

  const ensureLoop = () => {
    if (rafId === null && entries.size > 0 && !pageHidden) {
      rafId = requestAnimationFrame(tick);
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      pageHidden = document.visibilityState === 'hidden';
      if (!pageHidden) {
        ensureLoop();
      }
    });
  }

  return {
    ensure(track: SpringTrack) {
      if (!entries.has(track)) {
        entries.set(track, { track, paused: true });
      }
      ensureLoop();
    },
    remove(track: SpringTrack) {
      if (entries.delete(track) && entries.size === 0 && rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        lastTime = 0;
      }
    },
  };
};

let schedulerSingleton: SpringScheduler | null = null;

const getScheduler = (): SpringScheduler => {
  if (!schedulerSingleton) {
    schedulerSingleton = createSpringScheduler();
  }
  return schedulerSingleton;
};

type VisibilityCallback = (visible: boolean) => void;

const elementObservers = new WeakMap<Element, Set<VisibilityCallback>>();
let intersectionObserver: IntersectionObserver | null = null;

const ensureIntersectionObserver = () => {
  if (intersectionObserver || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return intersectionObserver;
  }

  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const callbacks = elementObservers.get(entry.target);
      if (!callbacks) return;
      callbacks.forEach((callback) => {
        callback(entry.isIntersecting && entry.intersectionRatio > 0);
      });
    });
  }, { threshold: [0, 0.1, 0.5, 1] });

  return intersectionObserver;
};

const observeVisibility = (element: Element, callback: VisibilityCallback): (() => void) => {
  const observer = ensureIntersectionObserver();
  if (!observer) {
    callback(true);
    return () => {};
  }

  let callbacks = elementObservers.get(element);
  if (!callbacks) {
    callbacks = new Set();
    elementObservers.set(element, callbacks);
  }
  callbacks.add(callback);

  observer.observe(element);
  callback(true);

  return () => {
    callbacks?.delete(callback);
    if (callbacks && callbacks.size === 0) {
      elementObservers.delete(element);
      observer.unobserve(element);
    }
  };
};

export function useSpringRaf(
  initialValue: SpringValue,
  config: SpringConfig,
  elementRef: RefObject<HTMLElement>,
  cssVarNames: string | string[]
): SpringControls {
  const schedulerRef = useRef<SpringScheduler>(getScheduler());
  const isObject = typeof initialValue !== 'number';
  const keyOrderRef = useRef<string[] | null>(
    isObject ? Object.keys(initialValue as Record<string, number>) : null
  );
  const currentRef = useRef<SpringValue>(cloneValue(initialValue));
  const lastValueRef = useRef<SpringValue>(cloneValue(initialValue));
  const targetRef = useRef<SpringValue>(cloneValue(initialValue));
  const initializedRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const isVisibleRef = useRef(true);

  const stiffness = config.stiffness ?? 0.15;
  const damping = config.damping ?? 0.8;
  const precision = config.precision ?? 0.01;

  if (isObject) {
    const keys = keyOrderRef.current as string[];
    const vars = cssVarNames as string[];
    if (!Array.isArray(vars) || keys.length !== vars.length) {
      throw new Error(
        `useSpringRaf: cssVarNames length (${Array.isArray(vars) ? vars.length : 'n/a'}) must match object keys (${keys.length})`
      );
    }
  }

  const trackRef = useRef<SpringTrack>();

  if (!trackRef.current) {
    trackRef.current = {
      step: (deltaMs: number) => {
        const element = elementRef.current;
        if (!element) {
          isAnimatingRef.current = false;
          return false;
        }

        const dt = (deltaMs * 60) / 1000;
        let settled = true;

        if (isObject) {
          const keys = keyOrderRef.current as string[];
          const vars = cssVarNames as string[];
          const current = currentRef.current as Record<string, number>;
          const last = lastValueRef.current as Record<string, number>;
          const target = targetRef.current as Record<string, number>;
          const nextValue: Record<string, number> = {};

          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const delta = target[key] - current[key];
            const velocity = (current[key] - last[key]) / (dt || 1 / 60);
            const spring = stiffness * delta;
            const damper = damping * velocity;
            const acceleration = spring - damper;
            const d = (velocity + acceleration) * dt;

            if (Math.abs(d) < precision && Math.abs(delta) < precision) {
              nextValue[key] = target[key];
            } else {
              nextValue[key] = current[key] + d;
              settled = false;
            }

            if (vars[i] !== undefined) {
              const unit = getCssUnit(vars[i]);
              element.style.setProperty(vars[i], `${nextValue[key]}${unit}`);
            }
          }

          lastValueRef.current = { ...current };
          currentRef.current = nextValue;
        } else {
          const varName = cssVarNames as string;
          const current = currentRef.current as number;
          const last = lastValueRef.current as number;
          const target = targetRef.current as number;
          const delta = target - current;
          const velocity = (current - last) / (dt || 1 / 60);
          const spring = stiffness * delta;
          const damper = damping * velocity;
          const acceleration = spring - damper;
          const d = (velocity + acceleration) * dt;

          let nextValue: number;
          if (Math.abs(d) < precision && Math.abs(delta) < precision) {
            nextValue = target;
          } else {
            nextValue = current + d;
            settled = false;
          }

          lastValueRef.current = current;
          currentRef.current = nextValue;
          element.style.setProperty(varName, `${nextValue}${getCssUnit(varName)}`);
        }

        if (settled) {
          isAnimatingRef.current = false;
          return false;
        }

        return true;
      },
      hasWork: () => isAnimatingRef.current,
      isPaused: () => !elementRef.current || !isVisibleRef.current,
      handlePause: () => {
        lastValueRef.current = cloneValue(currentRef.current);
      },
      handleResume: () => {
        lastValueRef.current = cloneValue(currentRef.current);
      },
    };
  }

  const scheduler = schedulerRef.current;
  const track = trackRef.current;

  // Initialize CSS variables once element is available
  useEffect(() => {
    const element = elementRef.current;
    if (!element || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    if (isObject) {
      const vars = cssVarNames as string[];
      const keys = keyOrderRef.current as string[];
      const initial = initialValue as Record<string, number>;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const unit = getCssUnit(vars[i]);
        element.style.setProperty(vars[i], `${initial[key]}${unit}`);
      }
    } else {
      const varName = cssVarNames as string;
      element.style.setProperty(varName, `${initialValue as number}${getCssUnit(varName)}`);
    }
  }, [cssVarNames, elementRef, initialValue, isObject]);

  // Attach IntersectionObserver for per-element visibility pausing
  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return undefined;
    }

    const unsubscribe = observeVisibility(element, (visible) => {
      isVisibleRef.current = visible;
      if (visible && isAnimatingRef.current && track) {
        scheduler.ensure(track);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [elementRef, scheduler, track]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (track) {
        scheduler.remove(track);
      }
    };
  }, [scheduler, track]);

  const setTarget = (value: SpringValue): void => {
    if (!valuesCompatible(currentRef.current, value)) {
      console.error('useSpringRaf: target value structure incompatible with current value');
      return;
    }

    targetRef.current = cloneValue(value);
    isAnimatingRef.current = true;
    scheduler.ensure(track);
  };

  const jump = (value: SpringValue): void => {
    if (!valuesCompatible(currentRef.current, value)) {
      console.error('useSpringRaf: jump value structure incompatible with current value');
      return;
    }

    const cloned = cloneValue(value);
    currentRef.current = cloned;
    lastValueRef.current = cloneValue(cloned);
    targetRef.current = cloneValue(cloned);

    const element = elementRef.current;
    if (element) {
      if (isObject) {
        const vars = cssVarNames as string[];
        const keys = keyOrderRef.current as string[];
        const valueObject = cloned as Record<string, number>;
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const unit = getCssUnit(vars[i]);
          element.style.setProperty(vars[i], `${valueObject[key]}${unit}`);
        }
      } else {
        const varName = cssVarNames as string;
        element.style.setProperty(varName, `${cloned as number}${getCssUnit(varName)}`);
      }
    }

    isAnimatingRef.current = false;
    scheduler.remove(track);
  };

  const stop = (): void => {
    isAnimatingRef.current = false;
    scheduler.remove(track);
  };

  return { setTarget, jump, stop };
}
