import { useEffect } from 'react';

export interface ViewportMousePosition {
  clientX: number;
  clientY: number;
  initialized: boolean;
}

interface WindowTrackerState {
  refCount: number;
  listener: (event: MouseEvent) => void;
  position: ViewportMousePosition;
}

const windowTrackerMap = new WeakMap<Window, WindowTrackerState>();

const getWindowTrackerState = (targetWindow: Window) => {
  const cachedState = windowTrackerMap.get(targetWindow);
  if (cachedState) {
    return cachedState;
  }

  const position: ViewportMousePosition = {
    clientX: 0,
    clientY: 0,
    initialized: false,
  };
  const nextState: WindowTrackerState = {
    refCount: 0,
    listener: (event: MouseEvent) => {
      position.clientX = event.clientX;
      position.clientY = event.clientY;
      position.initialized = true;
    },
    position,
  };

  windowTrackerMap.set(targetWindow, nextState);
  return nextState;
};

const addWindowTracker = (targetWindow: Window) => {
  const trackerState = getWindowTrackerState(targetWindow);

  trackerState.refCount += 1;
  if (trackerState.refCount === 1) {
    targetWindow.addEventListener('mousemove', trackerState.listener, {
      passive: true,
    });
  }
};

const removeWindowTracker = (targetWindow: Window) => {
  const trackerState = windowTrackerMap.get(targetWindow);
  if (!trackerState) {
    return;
  }

  trackerState.refCount = Math.max(trackerState.refCount - 1, 0);
  if (trackerState.refCount === 0) {
    targetWindow.removeEventListener('mousemove', trackerState.listener);
  }
};

export const getViewportMousePosition = (
  targetWindow?: Window | null,
): ViewportMousePosition => {
  if (!targetWindow) {
    return {
      clientX: 0,
      clientY: 0,
      initialized: false,
    };
  }

  return getWindowTrackerState(targetWindow).position;
};

export const setViewportMousePosition = (
  targetWindow: Window | null | undefined,
  clientX: number,
  clientY: number,
) => {
  if (!targetWindow) {
    return;
  }

  const trackerState = getWindowTrackerState(targetWindow);
  trackerState.position.clientX = clientX;
  trackerState.position.clientY = clientY;
  trackerState.position.initialized = true;
};

export default function useViewportMouseTracker(targetWindow?: Window | null) {
  useEffect(() => {
    if (!targetWindow) {
      return;
    }

    addWindowTracker(targetWindow);

    return () => {
      removeWindowTracker(targetWindow);
    };
  }, [targetWindow]);
}
