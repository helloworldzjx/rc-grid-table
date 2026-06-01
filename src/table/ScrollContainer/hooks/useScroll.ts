import { useIsomorphicLayoutEffect } from 'ahooks';
import {
  MouseEventHandler,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  UIEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { MIN_THUMB_SIZE } from '../../../_utils/const';
import { ScrollBarContainerProps } from '../interface';

type UseScrollProps = Omit<ScrollBarContainerProps, 'classNames' | 'prefixCls'>;

type DragEventLike =
  | MouseEvent
  | TouchEvent
  | ReactMouseEvent
  | ReactTouchEvent;

const raf = (callback: FrameRequestCallback) => {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(callback);
  }

  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
};

const cancelRaf = (id: number | null) => {
  if (id === null) return;

  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

const getPageY = (event: DragEventLike) => {
  if ('touches' in event) {
    return event.touches[0]?.pageY ?? 0;
  }

  return event.pageY;
};

const preventDefaultIfCancelable = (
  event: Event | ReactMouseEvent | ReactTouchEvent,
) => {
  if (event.cancelable) {
    event.preventDefault();
  }
};

const useElementRef = <T extends HTMLElement>() => {
  const [element, setElement] = useState<T | null>(null);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  return [ref, element] as const;
};

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
    pageY: 0,
    startTop: 0,
  });
  const verticalScrollFrameRef = useRef<number | null>(null);
  const verticalScrollTopRef = useRef(0);

  wrapperElementRef.current = wrapperElement;
  contentElementRef.current = contentElement;
  onVerticalScrollRef.current = onVerticalScroll;

  const updateVerticalScrollbar = useCallback(() => {
    if (!wrapperElement || !contentElement) return;

    const wrapperHeight = wrapperElement.clientHeight;
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
  }, [contentElement, showVertical, wrapperElement]);

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

      cancelRaf(verticalScrollFrameRef.current);
      verticalScrollFrameRef.current = raf(() => {
        verticalScrollFrameRef.current = null;
        flushVerticalScroll();
      });
    },
    [flushVerticalScroll],
  );

  const scrollByThumbTop = useCallback(
    (top: number) => {
      const content = contentElement;
      const track = verticalTrackElement;
      const thumb = verticalThumbElement;
      if (!track || !thumb || !content) return 0;

      const trackHeight = track.clientHeight;
      const thumbHeight = verticalThumbHeight || thumb.offsetHeight;
      const maxTranslateY = trackHeight - thumbHeight;
      const maxScrollTop = content.scrollHeight - content.clientHeight;
      const nextTop = Math.min(Math.max(top, 0), Math.max(maxTranslateY, 0));

      verticalDragStateRef.current.top = nextTop;
      thumb.style.transform = `translateY(${nextTop}px)`;

      if (maxTranslateY <= 0 || maxScrollTop <= 0) {
        return 0;
      }

      const nextScrollTop = Math.ceil((nextTop / maxTranslateY) * maxScrollTop);
      requestVerticalScroll(nextScrollTop);

      return nextTop;
    },
    [
      contentElement,
      requestVerticalScroll,
      verticalThumbElement,
      verticalThumbHeight,
      verticalTrackElement,
    ],
  );

  const flushVerticalScrollRef = useRef(flushVerticalScroll);
  const scrollByThumbTopRef = useRef(scrollByThumbTop);
  const syncVerticalScrollbarRef = useRef(syncVerticalScrollbar);

  flushVerticalScrollRef.current = flushVerticalScroll;
  scrollByThumbTopRef.current = scrollByThumbTop;
  syncVerticalScrollbarRef.current = syncVerticalScrollbar;

  const startVerticalThumbDrag = useCallback(
    (event: DragEventLike) => {
      if (!wrapperElement || !verticalThumbElement || !verticalTrackElement) {
        return;
      }

      verticalDragStateRef.current = {
        top: verticalDragStateRef.current.top,
        dragging: true,
        pageY: getPageY(event),
        startTop: verticalDragStateRef.current.top,
      };

      wrapperElement.style.userSelect = 'none';
      if (contentElement) {
        contentElement.style.pointerEvents = 'none';
      }
      event.stopPropagation();
      preventDefaultIfCancelable(event);
    },
    [
      contentElement,
      verticalThumbElement,
      verticalTrackElement,
      wrapperElement,
    ],
  );

  const handleVerticalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.stopPropagation();
      preventDefaultIfCancelable(event);

      const thumb = verticalThumbElement;
      const track = verticalTrackElement;
      if (!thumb || !track) return;

      if (event.target === thumb) {
        startVerticalThumbDrag(event);
      }
    },
    [startVerticalThumbDrag, verticalThumbElement, verticalTrackElement],
  );

  useEffect(() => {
    if (!verticalTrackElement || !verticalThumbElement) return undefined;

    const handleTrackTouchStart = (event: TouchEvent) => {
      preventDefaultIfCancelable(event);
    };

    const handleThumbTouchStart = (event: TouchEvent) => {
      startVerticalThumbDrag(event);
    };

    verticalTrackElement.addEventListener('touchstart', handleTrackTouchStart, {
      passive: false,
    });
    verticalThumbElement.addEventListener('touchstart', handleThumbTouchStart, {
      passive: false,
    });

    return () => {
      verticalTrackElement.removeEventListener(
        'touchstart',
        handleTrackTouchStart,
      );
      verticalThumbElement.removeEventListener(
        'touchstart',
        handleThumbTouchStart,
      );
    };
  }, [startVerticalThumbDrag, verticalThumbElement, verticalTrackElement]);

  useEffect(() => {
    const handleMove = (event: MouseEvent | TouchEvent) => {
      const { dragging, pageY, startTop } = verticalDragStateRef.current;
      if (!dragging) return;

      const offset = getPageY(event) - pageY;
      scrollByThumbTopRef.current(startTop + offset);
    };

    const handleUp = () => {
      if (verticalScrollFrameRef.current !== null) {
        cancelRaf(verticalScrollFrameRef.current);
        verticalScrollFrameRef.current = null;
        flushVerticalScrollRef.current();
      }
      verticalDragStateRef.current.dragging = false;
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

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('mouseup', handleUp, { passive: true });
    window.addEventListener('touchend', handleUp, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
      cancelRaf(verticalScrollFrameRef.current);
      const content = contentElementRef.current;
      if (content) {
        content.style.pointerEvents = '';
      }
    };
  }, []);

  const scrollTo = (options?: ScrollToOptions) => {
    contentElement?.scrollTo(options);
  };

  const scrollToTop = () => {
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
  };

  const scrollToBottom = () => {
    if (contentElement) {
      contentElement.scrollTop = contentElement.scrollHeight;
    }
  };

  const scrollToLeft = () => {
    if (contentElement) {
      contentElement.scrollLeft = 0;
    }
  };

  const scrollToRight = () => {
    if (contentElement) {
      contentElement.scrollLeft = contentElement.scrollWidth;
    }
  };

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
    handleVerticalDrag,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollToLeft,
    scrollToRight,
  };
};

export default useScroll;
