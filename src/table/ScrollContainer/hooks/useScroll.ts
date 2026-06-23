import { useIsomorphicLayoutEffect } from 'ahooks';
import {
  PointerEventHandler,
  UIEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { MIN_THUMB_SIZE } from '../../../_utils/const';
import { useElementRef } from '../../../_utils/hooks/useElementRef';
import { cancelRaf, raf } from '../../../_utils/raf';
import { ScrollBarContainerProps } from '../interface';

type UseScrollProps = Omit<ScrollBarContainerProps, 'classNames' | 'prefixCls'>;

const useScroll = ({
  showVertical,
  updateDeps = [],
  onScroll,
  onVerticalScroll,
}: UseScrollProps) => {
  const [wrapperRef, wrapperElement] = useElementRef<HTMLDivElement>();
  const [contentRef, contentElement] = useElementRef<HTMLDivElement>();
  const [verticalTrackRef, verticalTrackElement] =
    useElementRef<HTMLDivElement>();
  const [verticalThumbRef, verticalThumbElement] =
    useElementRef<HTMLDivElement>();

  const [hasVertical, setHasVertical] = useState(false);
  const [verticalThumbHeight, setVerticalThumbHeight] = useState(0);
  const wrapperElementRef = useRef<HTMLDivElement | null>(null);
  const contentElementRef = useRef<HTMLDivElement | null>(null);
  const onVerticalScrollRef = useRef(onVerticalScroll);
  const verticalDragStateRef = useRef({
    top: 0,
    dragging: false,
    pointerId: null as number | null,
    clientY: 0,
    startTop: 0,
    maxTranslateY: 0,
    maxScrollTop: 0,
  });
  const verticalScrollFrameRef = useRef<number | null>(null);
  const verticalScrollTopRef = useRef(0);

  wrapperElementRef.current = wrapperElement;
  contentElementRef.current = contentElement;
  onVerticalScrollRef.current = onVerticalScroll;

  const updateVerticalScrollbar = useCallback(() => {
    if (!wrapperElement || !contentElement) return;

    const wrapperHeight = wrapperElement.clientHeight;
    const contentClientHeight = contentElement.clientHeight;
    const contentHeight = contentElement.scrollHeight;
    const hasV = contentHeight > wrapperHeight;
    const nextThumbHeight =
      hasV && !!showVertical
        ? Math.max(
            (wrapperHeight / contentHeight) * wrapperHeight,
            MIN_THUMB_SIZE,
          )
        : 0;

    setHasVertical(hasV);
    setVerticalThumbHeight(nextThumbHeight);

    if (verticalDragStateRef.current.dragging) {
      const trackHeight = verticalTrackElement?.clientHeight || wrapperHeight;

      verticalDragStateRef.current.maxTranslateY = Math.max(
        trackHeight - nextThumbHeight,
        0,
      );
      verticalDragStateRef.current.maxScrollTop = Math.max(
        contentHeight - contentClientHeight,
        0,
      );
    }
  }, [contentElement, showVertical, verticalTrackElement, wrapperElement]);

  useIsomorphicLayoutEffect(() => {
    updateVerticalScrollbar();
  }, [updateVerticalScrollbar, ...updateDeps]);

  const syncVerticalScrollbar = useCallback(
    (content: HTMLDivElement) => {
      if (verticalDragStateRef.current.dragging) return;

      const vMaxScroll = content.scrollHeight - content.clientHeight;
      const topPercent = vMaxScroll > 0 ? content.scrollTop / vMaxScroll : 0;

      if (verticalThumbElement && !!showVertical) {
        const track = verticalThumbElement.parentElement;
        if (!track) return;

        const trackHeight = track.clientHeight;
        const maxTranslateY = trackHeight - verticalThumbHeight;
        const translateY = maxTranslateY > 0 ? topPercent * maxTranslateY : 0;
        verticalDragStateRef.current.top = translateY;
        verticalThumbElement.style.transform = `translateY(${translateY}px)`;
      }
    },
    [showVertical, verticalThumbElement, verticalThumbHeight],
  );

  useIsomorphicLayoutEffect(() => {
    if (!contentElement) return;

    syncVerticalScrollbar(contentElement);
  });

  const handleContentScroll: UIEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      onScroll?.(e);
      syncVerticalScrollbar(e.currentTarget);
    },
    [onScroll, syncVerticalScrollbar],
  );

  const flushVerticalScroll = useCallback(() => {
    const content = contentElementRef.current;
    if (!content) return;

    const handled = onVerticalScrollRef.current?.(verticalScrollTopRef.current);
    if (!handled) {
      content.scrollTop = verticalScrollTopRef.current;
    }
  }, []);

  const requestVerticalScroll = useCallback(
    (scrollTop: number) => {
      verticalScrollTopRef.current = scrollTop;

      if (!onVerticalScrollRef.current) {
        flushVerticalScroll();
        return;
      }

      if (verticalScrollFrameRef.current === null) {
        verticalScrollFrameRef.current = raf(() => {
          verticalScrollFrameRef.current = null;
          flushVerticalScroll();
        });
      }
    },
    [flushVerticalScroll],
  );

  const scrollByThumbTop = useCallback(
    (top: number) => {
      if (!verticalThumbElement) return 0;

      const { maxScrollTop, maxTranslateY } = verticalDragStateRef.current;
      const nextTop = Math.min(Math.max(top, 0), maxTranslateY);

      verticalDragStateRef.current.top = nextTop;
      verticalThumbElement.style.transform = `translateY(${nextTop}px)`;

      if (maxTranslateY <= 0 || maxScrollTop <= 0) {
        return 0;
      }

      const nextScrollTop = Math.ceil((nextTop / maxTranslateY) * maxScrollTop);
      requestVerticalScroll(nextScrollTop);

      return nextTop;
    },
    [requestVerticalScroll, verticalThumbElement],
  );

  const flushVerticalScrollRef = useRef(flushVerticalScroll);
  const scrollByThumbTopRef = useRef(scrollByThumbTop);
  const syncVerticalScrollbarRef = useRef(syncVerticalScrollbar);

  flushVerticalScrollRef.current = flushVerticalScroll;
  scrollByThumbTopRef.current = scrollByThumbTop;
  syncVerticalScrollbarRef.current = syncVerticalScrollbar;

  const handleVerticalPointerDown: PointerEventHandler<HTMLDivElement> =
    useCallback(
      (event) => {
        if (!wrapperElement || !contentElement) {
          return;
        }
        if (!verticalThumbElement || !verticalTrackElement) {
          return;
        }
        if (event.button !== 0) return;

        const trackHeight = verticalTrackElement.clientHeight;
        const thumbHeight =
          verticalThumbHeight || verticalThumbElement.offsetHeight;
        const maxTranslateY = Math.max(trackHeight - thumbHeight, 0);
        const maxScrollTop = Math.max(
          contentElement.scrollHeight - contentElement.clientHeight,
          0,
        );

        verticalDragStateRef.current = {
          top: verticalDragStateRef.current.top,
          dragging: true,
          pointerId: event.pointerId,
          clientY: event.clientY,
          startTop: verticalDragStateRef.current.top,
          maxTranslateY,
          maxScrollTop,
        };

        wrapperElement.style.userSelect = 'none';
        contentElement.style.pointerEvents = 'none';
        event.stopPropagation();
        if (event.cancelable) {
          event.preventDefault();
        }
      },
      [
        contentElement,
        verticalThumbHeight,
        verticalThumbElement,
        verticalTrackElement,
        wrapperElement,
      ],
    );

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const { dragging, pointerId, clientY, startTop } =
        verticalDragStateRef.current;
      if (!dragging) return;
      if (event.pointerId !== pointerId) return;

      if (event.cancelable) {
        event.preventDefault();
      }

      const offset = event.clientY - clientY;
      scrollByThumbTopRef.current(startTop + offset);
    };

    const handleUp = (event: PointerEvent) => {
      const { dragging, pointerId } = verticalDragStateRef.current;
      if (!dragging) return;
      if (event.pointerId !== pointerId) return;

      if (verticalScrollFrameRef.current !== null) {
        cancelRaf(verticalScrollFrameRef.current);
        verticalScrollFrameRef.current = null;
        flushVerticalScrollRef.current();
      }
      verticalDragStateRef.current.dragging = false;
      verticalDragStateRef.current.pointerId = null;
      const wrapper = wrapperElementRef.current;
      const content = contentElementRef.current;

      if (wrapper) {
        wrapper.style.userSelect = '';
      }
      if (content) {
        content.style.pointerEvents = '';
        syncVerticalScrollbarRef.current(content);
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp, { passive: true });
    window.addEventListener('pointercancel', handleUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      cancelRaf(verticalScrollFrameRef.current);
      const content = contentElementRef.current;
      if (content) {
        content.style.pointerEvents = '';
      }
    };
  }, []);

  const scrollTo = useCallback((options?: ScrollToOptions) => {
    const content = contentElementRef.current;
    content?.scrollTo(options);
    if (content && options?.top !== undefined) {
      syncVerticalScrollbarRef.current(content);
    }
    return content || undefined;
  }, []);

  const scrollToTop = useCallback(() => {
    const content = contentElementRef.current;
    if (content) {
      content.scrollTop = 0;
      syncVerticalScrollbarRef.current(content);
    }
    return content || undefined;
  }, []);

  const scrollToBottom = useCallback(() => {
    const content = contentElementRef.current;
    if (content) {
      content.scrollTop = content.scrollHeight;
      syncVerticalScrollbarRef.current(content);
    }
    return content || undefined;
  }, []);

  const scrollToLeft = useCallback(() => {
    const content = contentElementRef.current;
    if (content) {
      content.scrollLeft = 0;
    }
    return content || undefined;
  }, []);

  const scrollToRight = useCallback(() => {
    const content = contentElementRef.current;
    if (content) {
      content.scrollLeft = content.scrollWidth;
    }
    return content || undefined;
  }, []);

  return {
    wrapperRef,
    wrapperElement,
    contentRef,
    contentElement,
    verticalTrackRef,
    verticalTrackElement,
    verticalThumbRef,
    verticalThumbElement,
    hasVertical,
    verticalThumbHeight,
    handleContentScroll,
    handleVerticalPointerDown,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollToLeft,
    scrollToRight,
  };
};

export default useScroll;
