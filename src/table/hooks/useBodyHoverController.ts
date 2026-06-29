import { useCallback, useEffect, useMemo, useRef } from 'react';

import { cancelRaf, raf } from '../../_utils/raf';
import type { BodyHoverCellMeta, BodyHoverInterval } from '../Body/hover';
import type { BodyHoverContextValue } from '../contexts/BodyHoverContext';
import { getViewportMousePosition } from './viewportMouseTracker';

interface UseBodyHoverControllerProps {
  enabled?: boolean;
}

interface PointerMoveInfo {
  bodyElement?: HTMLDivElement | null;
  target: EventTarget | Element | null;
}

export interface BodyHoverController {
  contextValue: BodyHoverContextValue;
  handlePointerMove: (info: PointerMoveInfo) => void;
  handlePointerLeave: () => void;
  scheduleSyncHoverFromPointer: (bodyElement?: HTMLDivElement | null) => void;
}

const isSameInterval = (
  current: BodyHoverInterval | null,
  target: BodyHoverInterval | null,
) => current?.start === target?.start && current?.end === target?.end;

export default function useBodyHoverController({
  enabled = true,
}: UseBodyHoverControllerProps): BodyHoverController {
  const cellRecordsRef = useRef(new Map<HTMLDivElement, BodyHoverCellMeta>());
  const listenersRef = useRef(new Set<() => void>());
  const hoveredCellRef = useRef<HTMLDivElement | null>(null);
  const activeIntervalRef = useRef<BodyHoverInterval | null>(null);
  const lastBodyElementRef = useRef<HTMLDivElement | null>(null);
  const syncFrameRef = useRef<number | null>(null);
  const scheduleSyncHoverRef = useRef<
    (bodyElement?: HTMLDivElement | null) => void
  >(() => {});

  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach((listener) => {
      listener();
    });
  }, []);

  const setActiveInterval = useCallback(
    (nextInterval: BodyHoverInterval | null) => {
      if (isSameInterval(activeIntervalRef.current, nextInterval)) {
        return;
      }

      activeIntervalRef.current = nextInterval;
      notifyListeners();
    },
    [notifyListeners],
  );

  const clearHover = useCallback(() => {
    hoveredCellRef.current = null;
    cancelRaf(syncFrameRef.current);
    syncFrameRef.current = null;
    setActiveInterval(null);
  }, [setActiveInterval]);

  const setCellElement = useCallback(
    (element: HTMLDivElement, meta: BodyHoverCellMeta | null) => {
      if (cellRecordsRef.current.has(element)) {
        cellRecordsRef.current.delete(element);
      }

      const wasHoveredCell = hoveredCellRef.current === element;

      if (!meta?.hoverable) {
        if (wasHoveredCell) {
          hoveredCellRef.current = null;
          setActiveInterval(null);
          scheduleSyncHoverRef.current(lastBodyElementRef.current);
        }
        return;
      }

      cellRecordsRef.current.set(element, meta);

      if (wasHoveredCell) {
        setActiveInterval(meta.interval);
      }
    },
    [setActiveInterval],
  );

  const findHoverCell = useCallback(
    (
      bodyElement: HTMLDivElement | null | undefined,
      target: EventTarget | Element | null,
    ) => {
      if (!bodyElement) {
        return null;
      }

      let element: Element | null = target instanceof Element ? target : null;

      while (element && element !== bodyElement) {
        if (
          element instanceof HTMLDivElement &&
          cellRecordsRef.current.has(element)
        ) {
          return element;
        }
        element = element.parentElement;
      }

      return null;
    },
    [],
  );

  const updateHoverTarget = useCallback(
    (
      bodyElement: HTMLDivElement | null | undefined,
      target: EventTarget | Element | null,
      force = false,
    ) => {
      if (!enabled || !bodyElement) {
        setActiveInterval(null);
        return;
      }

      lastBodyElementRef.current = bodyElement;

      const cell = findHoverCell(bodyElement, target);
      if (!cell) {
        hoveredCellRef.current = null;
        setActiveInterval(null);
        return;
      }

      const meta = cellRecordsRef.current.get(cell);
      if (!meta) {
        hoveredCellRef.current = null;
        setActiveInterval(null);
        return;
      }

      const prevCell = hoveredCellRef.current;
      hoveredCellRef.current = cell;

      if (
        !force &&
        prevCell === cell &&
        isSameInterval(activeIntervalRef.current, meta.interval)
      ) {
        return;
      }

      setActiveInterval(meta.interval);
    },
    [enabled, findHoverCell, setActiveInterval],
  );

  const syncHoverFromViewportPointer = useCallback(
    (bodyElement?: HTMLDivElement | null) => {
      cancelRaf(syncFrameRef.current);
      syncFrameRef.current = null;

      if (!enabled || !bodyElement) {
        return;
      }

      lastBodyElementRef.current = bodyElement;

      const viewportMouse = getViewportMousePosition(
        bodyElement.ownerDocument.defaultView,
      );
      if (!viewportMouse.initialized) {
        return;
      }

      const { clientX, clientY } = viewportMouse;
      const bodyRect = bodyElement.getBoundingClientRect();
      const inBodyRect =
        clientX >= bodyRect.left &&
        clientX <= bodyRect.right &&
        clientY >= bodyRect.top &&
        clientY <= bodyRect.bottom;

      if (!inBodyRect) {
        hoveredCellRef.current = null;
        setActiveInterval(null);
        return;
      }

      const target = bodyElement.ownerDocument.elementFromPoint(
        clientX,
        clientY,
      );
      updateHoverTarget(bodyElement, target, true);
    },
    [enabled, setActiveInterval, updateHoverTarget],
  );

  const scheduleSyncHoverFromPointer = useCallback(
    (bodyElement?: HTMLDivElement | null) => {
      cancelRaf(syncFrameRef.current);

      if (!enabled || !bodyElement) {
        syncFrameRef.current = null;
        return;
      }

      syncFrameRef.current = raf(() => {
        syncFrameRef.current = null;
        syncHoverFromViewportPointer(bodyElement);
      });
    },
    [enabled, syncHoverFromViewportPointer],
  );
  scheduleSyncHoverRef.current = scheduleSyncHoverFromPointer;

  const handlePointerMove = useCallback(
    ({ bodyElement, target }: PointerMoveInfo) => {
      if (!enabled) {
        return;
      }

      updateHoverTarget(bodyElement, target);
    },
    [enabled, updateHoverTarget],
  );

  const handlePointerLeave = useCallback(() => {
    clearHover();
  }, [clearHover]);

  useEffect(() => {
    if (!enabled) {
      clearHover();
    }
  }, [clearHover, enabled]);

  useEffect(
    () => () => {
      cancelRaf(syncFrameRef.current);
    },
    [],
  );

  const contextValue = useMemo<BodyHoverContextValue>(
    () => ({
      subscribe: (listener: () => void) => {
        listenersRef.current.add(listener);

        return () => {
          listenersRef.current.delete(listener);
        };
      },
      getActiveInterval: () => activeIntervalRef.current,
      setCellElement,
    }),
    [setCellElement],
  );

  return {
    contextValue,
    handlePointerMove,
    handlePointerLeave,
    scheduleSyncHoverFromPointer,
  };
}
