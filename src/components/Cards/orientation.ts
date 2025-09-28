interface OrientationAngles {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface OrientationState {
  supported: boolean;
  absolute: OrientationAngles;
  relative: OrientationAngles;
  timestamp: number;
}

type OrientationSubscriber = (state: OrientationState) => void;

const defaultAngles: OrientationAngles = { alpha: 0, beta: 0, gamma: 0 };

const isBrowser = typeof window !== 'undefined';
const isSupported = isBrowser && 'DeviceOrientationEvent' in window;

const subscribers = new Set<OrientationSubscriber>();

let listening = false;
let firstReading = true;
let baseOrientation: OrientationAngles = { ...defaultAngles };
let currentState: OrientationState = {
  supported: isSupported,
  absolute: { ...defaultAngles },
  relative: { ...defaultAngles },
  timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
};

/**
 * Normalize device orientation event values into a consistent object.
 */
const getRawOrientation = (event?: DeviceOrientationEvent | null): OrientationAngles => ({
  alpha: typeof event?.alpha === 'number' ? event.alpha : 0,
  beta: typeof event?.beta === 'number' ? event.beta : 0,
  gamma: typeof event?.gamma === 'number' ? event.gamma : 0,
});

const computeRelativeOrientation = (absolute: OrientationAngles): OrientationAngles => ({
  alpha: absolute.alpha - baseOrientation.alpha,
  beta: absolute.beta - baseOrientation.beta,
  gamma: absolute.gamma - baseOrientation.gamma,
});

const updateState = (event?: DeviceOrientationEvent | null): OrientationState => {
  const absolute = getRawOrientation(event);

  if (firstReading) {
    firstReading = false;
    baseOrientation = { ...absolute };
  }

  const relative = computeRelativeOrientation(absolute);

  currentState = {
    supported: isSupported,
    absolute,
    relative,
    timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  };

  return currentState;
};

const notify = (state: OrientationState) => {
  subscribers.forEach((subscriber) => {
    try {
      subscriber(state);
    } catch (error) {
      console.error('orientation subscriber error', error);
    }
  });
};

const handleOrientation = (event: DeviceOrientationEvent): void => {
  const state = updateState(event);
  notify(state);
};

const startListening = (): void => {
  if (!isSupported || listening || !isBrowser) return;
  window.addEventListener('deviceorientation', handleOrientation, true);
  listening = true;
};

const stopListening = (): void => {
  if (!isSupported || !listening || !isBrowser) return;
  window.removeEventListener('deviceorientation', handleOrientation, true);
  listening = false;
};

export const orientation = {
  subscribe(subscriber: OrientationSubscriber): () => void {
    subscribers.add(subscriber);

    // Immediately push the current state so subscribers don't wait for first event
    try {
      subscriber(currentState);
    } catch (error) {
      console.error('orientation subscriber error', error);
    }

    startListening();

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stopListening();
      }
    };
  },
};

export const resetBaseOrientation = (): void => {
  firstReading = true;
  baseOrientation = { ...getRawOrientation() };
};

export const getOrientationState = (): OrientationState => currentState;

