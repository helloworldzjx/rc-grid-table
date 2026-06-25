import { useCallback, useEffect, useMemo, useRef } from 'react';

import { cancelRaf, raf } from '../../_utils/raf';
import type { BodyHoverCellMeta, BodyHoverInterval } from '../Body/hover';
import type { BodyHoverContextValue } from '../contexts/BodyHoverContext';

interface UseBodyHoverControllerProps {
  enabled?: boolean;
}

interface PointerMoveInfo {
  bodyElement?: HTMLDivElement | null;
  target: EventTarget | Element | null;
  clientX: number;
  clientY: number;
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
  const pointerInsideRef = useRef(false);
  const pointerClientRef = useRef({ x: 0, y: 0 });
  const syncFrameRef = useRef<number | null>(null);

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
    pointerInsideRef.current = false;
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

  const syncHoverFromPointer = useCallback(
    (bodyElement?: HTMLDivElement | null) => {
      cancelRaf(syncFrameRef.current);
      syncFrameRef.current = null;

      if (!enabled || !bodyElement || !pointerInsideRef.current) {
        return;
      }

      const { x, y } = pointerClientRef.current;
      const target = bodyElement.ownerDocument.elementFromPoint(x, y);
      updateHoverTarget(bodyElement, target, true);
    },
    [enabled, updateHoverTarget],
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
        syncHoverFromPointer(bodyElement);
      });
    },
    [enabled, syncHoverFromPointer],
  );

  const handlePointerMove = useCallback(
    ({ bodyElement, target, clientX, clientY }: PointerMoveInfo) => {
      if (!enabled) {
        return;
      }

      pointerInsideRef.current = true;
      pointerClientRef.current = {
        x: clientX,
        y: clientY,
      };
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
