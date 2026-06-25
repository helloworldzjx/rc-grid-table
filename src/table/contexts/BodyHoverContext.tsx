import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';

import {
  getBodyHoverInterval,
  intersectsBodyHoverInterval,
  type BodyHoverCellMeta,
  type BodyHoverInterval,
  type BodyHoverRowMeta,
} from '../Body/hover';

export interface BodyHoverContextValue {
  subscribe: (listener: () => void) => () => void;
  getActiveInterval: () => BodyHoverInterval | null;
  setCellElement: (
    element: HTMLDivElement,
    meta: BodyHoverCellMeta | null,
  ) => void;
}

const BodyHoverContext = createContext<BodyHoverContextValue | null>(null);

const useBodyHoverContext = () => useContext(BodyHoverContext);

const noopUnsubscribe = () => {};
const noopSubscribe = () => noopUnsubscribe;

const isRowHovered = (
  activeInterval: BodyHoverInterval | null,
  { rowIndex, hoverable }: BodyHoverRowMeta,
) =>
  !!activeInterval &&
  hoverable &&
  rowIndex >= activeInterval.start &&
  rowIndex <= activeInterval.end;

const isCellHovered = (
  activeInterval: BodyHoverInterval | null,
  meta: BodyHoverCellMeta,
) =>
  !!activeInterval &&
  meta.hoverable &&
  meta.spanSource &&
  intersectsBodyHoverInterval(meta.interval, activeInterval);

export const useBodyHoverRowHovered = ({
  rowIndex,
  hoverable,
}: BodyHoverRowMeta) => {
  const context = useBodyHoverContext();
  const subscribe = hoverable
    ? context?.subscribe ?? noopSubscribe
    : noopSubscribe;
  const getSnapshot = useCallback(
    () =>
      isRowHovered(context?.getActiveInterval() ?? null, {
        rowIndex,
        hoverable,
      }),
    [context, hoverable, rowIndex],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

export const useBodyHoverCellRef = ({
  rowIndex,
  colIndex,
  rowSpan,
  hoverable,
}: {
  rowIndex: number;
  colIndex?: number;
  rowSpan?: number;
  hoverable: boolean;
}) => {
  const context = useBodyHoverContext();
  const elementRef = useRef<HTMLDivElement | null>(null);

  const setCellRef = useCallback(
    (element: HTMLDivElement | null) => {
      const prevElement = elementRef.current;

      if (prevElement && prevElement !== element) {
        context?.setCellElement(prevElement, null);
        elementRef.current = null;
      }

      if (element) {
        context?.setCellElement(element, {
          rowIndex,
          colIndex,
          hoverable,
          spanSource: typeof rowSpan === 'number' && rowSpan > 1,
          interval: getBodyHoverInterval(rowIndex, rowSpan),
        });
        elementRef.current = element;
      }
    },
    [colIndex, context, hoverable, rowIndex, rowSpan],
  );

  useEffect(
    () => () => {
      if (elementRef.current) {
        context?.setCellElement(elementRef.current, null);
      }
    },
    [context],
  );

  return setCellRef;
};

export const useBodyHoverCellHovered = ({
  rowIndex,
  colIndex,
  rowSpan,
  hoverable,
}: {
  rowIndex: number;
  colIndex?: number;
  rowSpan?: number;
  hoverable: boolean;
}) => {
  const context = useBodyHoverContext();
  const spanSource = typeof rowSpan === 'number' && rowSpan > 1;
  const interval = getBodyHoverInterval(rowIndex, rowSpan);
  const subscribe =
    hoverable && spanSource
      ? context?.subscribe ?? noopSubscribe
      : noopSubscribe;
  const getSnapshot = useCallback(
    () =>
      isCellHovered(context?.getActiveInterval() ?? null, {
        rowIndex,
        colIndex,
        hoverable,
        spanSource,
        interval,
      }),
    [colIndex, context, hoverable, interval, rowIndex, spanSource],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

export default BodyHoverContext;
