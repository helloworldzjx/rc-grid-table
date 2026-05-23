import { useIsomorphicLayoutEffect } from 'ahooks';
import type { MouseEventHandler, UIEventHandler } from 'react';
import { useCallback, useRef, useState } from 'react';

import {
  MIN_THUMB_SIZE,
  SCROLLBAR_VISIBLE_TOLERANCE,
} from '../../_utils/const';
import type { ScrollBarContainerRef } from '../../scrollContainer/interface';
import type { HeadRef } from '../Head/Head';

interface UseTableScrollProps {
  containerWidth: number;
  columnsWidthTotal: number;
  fixColumnsGapped?: boolean;
  showSummary?: boolean;
  onScroll?: UIEventHandler<HTMLDivElement>;
  deps?: unknown[];
}

const useElementRef = <T extends HTMLElement>() => {
  const [element, setElement] = useState<T | null>(null);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  return [ref, element] as const;
};

const getMaxScrollLeft = (element: HTMLDivElement) =>
  Math.max(element.scrollWidth - element.clientWidth, 0);

const setElementScrollLeft = (
  element: HTMLDivElement | undefined,
  scrollLeft: number,
) => {
  if (element && element.scrollLeft !== scrollLeft) {
    element.scrollLeft = scrollLeft;
  }
};

export const useTableScroll = ({
  containerWidth,
  columnsWidthTotal,
  fixColumnsGapped,
  showSummary,
  onScroll,
  deps = [],
}: UseTableScrollProps) => {
  const tableBodyRef = useRef<ScrollBarContainerRef | null>(null);
  const tableHeadRef = useRef<HeadRef>(null);
  const tableSummaryRef = useRef<HTMLDivElement>(null);
  const [bodyScrollElement, setBodyScrollElement] = useState<
    HTMLDivElement | undefined
  >();
  const [hasVertical, setHasVertical] = useState(false);
  const [isStart, setIsStart] = useState(true);
  const [isEnd, setIsEnd] = useState(true);
  const [horizontalThumbWidth, setHorizontalThumbWidth] = useState(0);
  const [horizontalTrackRef, horizontalTrackElement] =
    useElementRef<HTMLDivElement>();
  const [horizontalThumbRef, horizontalThumbElement] =
    useElementRef<HTMLDivElement>();

  const hasHorizontal =
    containerWidth > 0 &&
    columnsWidthTotal - containerWidth > SCROLLBAR_VISIBLE_TOLERANCE;

  const getTableBodyScrollElement = useCallback(
    () => bodyScrollElement,
    [bodyScrollElement],
  );

  const setTableBodyRef = useCallback((node: ScrollBarContainerRef | null) => {
    tableBodyRef.current = node;
    setBodyScrollElement(node?.nativeScrollElement);
  }, []);

  const syncScrollState = useCallback(
    (scrollElement?: HTMLDivElement | null) => {
      if (fixColumnsGapped || !hasHorizontal) {
        setIsStart(true);
        setIsEnd(true);
        return;
      }

      if (!scrollElement) return;

      const { scrollLeft } = scrollElement;
      const maxScrollLeft = getMaxScrollLeft(scrollElement);

      setIsStart(scrollLeft <= SCROLLBAR_VISIBLE_TOLERANCE);
      setIsEnd(maxScrollLeft - scrollLeft <= SCROLLBAR_VISIBLE_TOLERANCE);
    },
    [fixColumnsGapped, hasHorizontal],
  );

  const syncHorizontalThumb = useCallback(
    (sourceElement?: HTMLDivElement | null) => {
      if (!horizontalThumbElement || !sourceElement) return;

      const track = horizontalThumbElement.parentElement;
      if (!track) return;

      const maxScrollLeft = getMaxScrollLeft(sourceElement);
      const leftPercent =
        maxScrollLeft > 0 ? sourceElement.scrollLeft / maxScrollLeft : 0;
      const trackWidth = track.clientWidth;
      const thumbWidth =
        horizontalThumbWidth || horizontalThumbElement.offsetWidth;
      const maxTranslateX = trackWidth - thumbWidth;
      const translateX = maxTranslateX > 0 ? leftPercent * maxTranslateX : 0;

      horizontalThumbElement.style.transform = `translateX(${translateX}px)`;
    },
    [horizontalThumbElement, horizontalThumbWidth],
  );

  const syncScrollLeft = useCallback(
    (sourceElement?: HTMLDivElement | null) => {
      const body = bodyScrollElement;
      const head = tableHeadRef.current?.nativeElement;
      const summary = tableSummaryRef.current || undefined;
      const elements = [body, head, showSummary ? summary : undefined].filter(
        Boolean,
      ) as HTMLDivElement[];
      if (!elements.length) return;

      const source =
        sourceElement && elements.includes(sourceElement)
          ? sourceElement
          : body || elements[0];
      const scrollLeft = source.scrollLeft;

      elements.forEach((element) => {
        if (element !== source) {
          setElementScrollLeft(element, scrollLeft);
        }
      });
      syncScrollState(source);
      syncHorizontalThumb(source);
    },
    [bodyScrollElement, showSummary, syncHorizontalThumb, syncScrollState],
  );

  const updateHorizontalScrollbar = useCallback(() => {
    const content = bodyScrollElement;
    if (!horizontalTrackElement || !content) {
      setHorizontalThumbWidth(0);
      return;
    }

    const trackWidth =
      horizontalTrackElement.clientWidth || content.clientWidth;
    const contentWidth = content.scrollWidth;
    const nextThumbWidth =
      hasHorizontal && trackWidth > 0 && contentWidth > 0
        ? Math.min(
            Math.max((trackWidth / contentWidth) * trackWidth, MIN_THUMB_SIZE),
            trackWidth,
          )
        : 0;

    setHorizontalThumbWidth(nextThumbWidth);
  }, [bodyScrollElement, hasHorizontal, horizontalTrackElement]);

  const handleBodyScroll: UIEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      onScroll?.(event);
      syncScrollLeft(event.currentTarget);
    },
    [onScroll, syncScrollLeft],
  );

  const handleHorizontalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const content = bodyScrollElement;
      const thumb = horizontalThumbElement;
      const track = event.currentTarget;
      if (!hasHorizontal || !content || !thumb) return;

      event.preventDefault();
      document.documentElement.style.userSelect = 'none';

      const trackRect = track.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();
      const startClientX = event.clientX;
      const startThumbLeft = thumbRect.left - trackRect.left;

      const moveHandler = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startClientX;
        const trackWidth = track.clientWidth;
        const thumbWidth = horizontalThumbWidth || thumb.offsetWidth;
        const maxTranslateX = trackWidth - thumbWidth;
        const maxScrollLeft = getMaxScrollLeft(content);

        if (maxTranslateX <= 0 || maxScrollLeft <= 0) return;

        const nextTranslateX = Math.min(
          Math.max(startThumbLeft + deltaX, 0),
          maxTranslateX,
        );
        const percent = nextTranslateX / maxTranslateX;
        content.scrollLeft = percent * maxScrollLeft;
        syncScrollLeft(content);
      };

      const upHandler = () => {
        document.documentElement.style.userSelect = '';
        document.documentElement.removeEventListener('mousemove', moveHandler);
        document.documentElement.removeEventListener('mouseup', upHandler);
      };

      document.documentElement.addEventListener('mousemove', moveHandler);
      document.documentElement.addEventListener('mouseup', upHandler);
    },
    [
      bodyScrollElement,
      hasHorizontal,
      horizontalThumbElement,
      horizontalThumbWidth,
      syncScrollLeft,
    ],
  );

  useIsomorphicLayoutEffect(() => {
    updateHorizontalScrollbar();
    syncScrollLeft(bodyScrollElement);
  }, [
    bodyScrollElement,
    columnsWidthTotal,
    containerWidth,
    fixColumnsGapped,
    hasHorizontal,
    horizontalTrackElement,
    showSummary,
    updateHorizontalScrollbar,
    syncScrollLeft,
    ...deps,
  ]);

  useIsomorphicLayoutEffect(() => {
    const head = tableHeadRef.current?.nativeElement;
    const summary = tableSummaryRef.current;
    const elements = [head, showSummary ? summary : undefined].filter(
      Boolean,
    ) as HTMLDivElement[];

    const handlers = elements.map((element) => {
      const handleScroll = () => {
        syncScrollLeft(element);
      };
      element.addEventListener('scroll', handleScroll);
      return handleScroll;
    });

    return () => {
      elements.forEach((element, index) => {
        element.removeEventListener('scroll', handlers[index]);
      });
    };
  }, [bodyScrollElement, showSummary, syncScrollLeft, ...deps]);

  return {
    tableBodyRef,
    tableHeadRef,
    tableSummaryRef,
    bodyScrollElement,
    getTableBodyScrollElement,
    setTableBodyRef,
    horizontalTrackRef,
    horizontalThumbRef,
    horizontalThumbWidth,
    hasHorizontal,
    hasVertical,
    isStart,
    isEnd,
    setHasVertical,
    handleBodyScroll,
    handleHorizontalDrag,
    syncScrollLeft,
    syncScrollState,
    scrollToLeft: tableBodyRef.current?.scrollToLeft,
    scrollToRight: tableBodyRef.current?.scrollToRight,
  };
};

export default useTableScroll;
