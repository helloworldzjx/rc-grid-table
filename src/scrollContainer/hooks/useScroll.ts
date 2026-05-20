import { useDebounceEffect } from 'ahooks';
import {
  MouseEventHandler,
  UIEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useTableContext } from '../../table/context';
import { ScrollBarContainerProps, ScrollElementController } from '../interface';

type UseScrollProps = Omit<ScrollBarContainerProps, 'classNames'>;

const MIN_THUMB_SIZE = 20;
// 滚动条高度
const HORIZONTAL_SCROLLBAR_HEIGHT = 12;

const getControllerElement = (controller?: ScrollElementController) => {
  return typeof controller === 'function' ? controller() : controller;
};

const useElementRef = <T extends HTMLElement>() => {
  const [element, setElement] = useState<T | null>(null);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  return [ref, element] as const;
};

const useScroll = ({
  contentController,
  horizontalThumbController,
  stickyHorizontalController,
  showStickyHorizontal,
  showHorizontal,
  showVertical,
  shouldHorizontalUpdate = [],
  shouldVerticalUpdate = [],
  onScroll,
}: UseScrollProps) => {
  const { containerWidth, containerHeight } = useTableContext();
  const [wrapperRef, wrapperElement] = useElementRef<HTMLDivElement>();
  const [contentRef, contentElement] = useElementRef<HTMLDivElement>();
  const [horizontalTrackRef, horizontalTrackElement] =
    useElementRef<HTMLDivElement>();
  const [verticalTrackRef, verticalTrackElement] =
    useElementRef<HTMLDivElement>();
  const [stickyHorizontalTrackRef, stickyHorizontalTrackElement] =
    useElementRef<HTMLDivElement>();
  const [stickyHorizontalThumbRef, stickyHorizontalThumbElement] =
    useElementRef<HTMLDivElement>();
  const [horizontalThumbRef, horizontalThumbElement] =
    useElementRef<HTMLDivElement>();
  const [verticalThumbRef, verticalThumbElement] =
    useElementRef<HTMLDivElement>();

  const [hasHorizontal, setHasHorizontal] = useState(false);
  const [hasVertical, setHasVertical] = useState(false);
  const [horizontalThumbWidth, setHorizontalThumbWidth] = useState(0);
  const [verticalThumbHeight, setVerticalThumbHeight] = useState(0);
  const [showStickyXScrollBar, setShowStickyXScrollBar] = useState(false);

  useEffect(() => {
    if (!horizontalTrackElement || !showStickyHorizontal) return;

    let bottomMargin = 0;
    let root: Element | Document | undefined = undefined;
    if (typeof showStickyHorizontal === 'object') {
      root = showStickyHorizontal.getContainer?.();
      if (!!showStickyHorizontal.offsetStickyScroller) {
        bottomMargin = showStickyHorizontal.offsetStickyScroller;
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyXScrollBar(!entry.isIntersecting);
      },
      {
        threshold: [0],
        root,
        rootMargin: `0px 0px ${
          HORIZONTAL_SCROLLBAR_HEIGHT * -1 - bottomMargin
        }px 0px`,
      },
    );
    observer.observe(horizontalTrackElement);

    return () => {
      observer.disconnect();
    };
  }, [horizontalTrackElement, showStickyHorizontal]);

  const showStickyHorizontalScrollBar = useMemo(() => {
    return hasHorizontal && !!showStickyHorizontal && showStickyXScrollBar;
  }, [hasHorizontal, showStickyHorizontal, showStickyXScrollBar]);

  // 横向滚动条计算
  const updateHorizontalScrollbar = useCallback(() => {
    const content = getControllerElement(contentController) || contentElement;
    if (!wrapperElement || !content) return;

    const wrapperWidth = wrapperElement.clientWidth;
    const contentWidth = content.scrollWidth;

    // 计算横向 thumb 尺寸
    const hasH = contentWidth > wrapperWidth;
    const nextThumbWidth =
      hasH && !!showHorizontal
        ? Math.max((wrapperWidth / contentWidth) * wrapperWidth, MIN_THUMB_SIZE)
        : 0;

    setHasHorizontal(hasH);
    setHorizontalThumbWidth(nextThumbWidth);
  }, [
    contentController,
    contentElement,
    containerWidth,
    showHorizontal,
    wrapperElement,
    ...shouldHorizontalUpdate,
  ]);

  // 纵向滚动条计算
  const updateVerticalScrollbar = useCallback(() => {
    if (!wrapperElement || !contentElement) return;

    const wrapperHeight = wrapperElement.clientHeight;
    const contentHeight = contentElement.scrollHeight;

    // 计算纵向 thumb 尺寸
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
  }, [
    containerHeight,
    contentElement,
    showVertical,
    wrapperElement,
    ...shouldVerticalUpdate,
  ]);

  useDebounceEffect(
    () => {
      updateHorizontalScrollbar();
    },
    [updateHorizontalScrollbar],
    { wait: 0 },
  );

  useDebounceEffect(
    () => {
      updateVerticalScrollbar();
    },
    [updateVerticalScrollbar],
    { wait: 0 },
  );

  const syncHorizontalScrollbar = useCallback(
    (content: HTMLDivElement) => {
      const hMaxScroll = content.scrollWidth - content.clientWidth;
      const contentScrollLeft = content.scrollLeft;

      const leftPercent = hMaxScroll > 0 ? contentScrollLeft / hMaxScroll : 0;
      const controlledHorizontalThumb = getControllerElement(
        horizontalThumbController,
      );
      const horizontalThumb =
        controlledHorizontalThumb ||
        (!!showHorizontal ? horizontalThumbElement : undefined);

      if (horizontalThumb) {
        const track = horizontalThumb.parentElement;
        if (!track) return;

        const trackWidth = track.clientWidth;
        const maxTranslateX =
          trackWidth - (horizontalThumbWidth || horizontalThumb.offsetWidth);
        const translateX = maxTranslateX > 0 ? leftPercent * maxTranslateX : 0;
        horizontalThumb.style.transform = `translateX(${translateX}px)`;

        const controlledStickyHorizontalThumb = getControllerElement(
          stickyHorizontalController,
        );
        const stickyHorizontalThumb =
          controlledStickyHorizontalThumb || stickyHorizontalThumbElement;
        if (
          stickyHorizontalThumb &&
          (controlledStickyHorizontalThumb || !!showStickyHorizontalScrollBar)
        ) {
          stickyHorizontalThumb.style.transform = `translateX(${translateX}px)`;
        }
      }
    },
    [
      horizontalThumbController,
      horizontalThumbElement,
      horizontalThumbWidth,
      showHorizontal,
      showStickyHorizontalScrollBar,
      stickyHorizontalThumbElement,
      stickyHorizontalController,
    ],
  );

  const syncVerticalScrollbar = useCallback(
    (content: HTMLDivElement) => {
      const vMaxScroll = content.scrollHeight - content.clientHeight;
      const topPercent = vMaxScroll > 0 ? content.scrollTop / vMaxScroll : 0;

      if (verticalThumbElement && !!showVertical) {
        const track = verticalThumbElement.parentElement;
        if (!track) return;

        const trackHeight = track.clientHeight;
        const maxTranslateY = trackHeight - verticalThumbHeight;
        const translateY = maxTranslateY > 0 ? topPercent * maxTranslateY : 0;
        verticalThumbElement.style.transform = `translateY(${translateY}px)`;
      }
    },
    [showVertical, verticalThumbElement, verticalThumbHeight],
  );

  // 内容滚动事件
  const handleContentScroll: UIEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      onScroll?.(e);

      syncHorizontalScrollbar(e.currentTarget);
      syncVerticalScrollbar(e.currentTarget);
    },
    [onScroll, syncHorizontalScrollbar, syncVerticalScrollbar],
  );

  // 拖拽横向滚动条
  const handleHorizontalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const track = e.currentTarget;
      const thumb =
        getControllerElement(horizontalThumbController) ||
        horizontalThumbElement;
      const stickyThumb =
        getControllerElement(stickyHorizontalController) ||
        stickyHorizontalThumbElement;
      if (!wrapperElement || !thumb) return;

      wrapperElement.style.userSelect = 'none';

      const trackRect = track.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();

      const startClientX = e.clientX;
      const startThumbLeft = thumbRect.left - trackRect.left; // thumb 左侧距离轨道左侧的距离

      const moveHandler = (event: MouseEvent) => {
        const deltaX = event.clientX - startClientX;
        const trackWidth = track.clientWidth;
        const thumbWidth = horizontalThumbWidth;
        const maxTranslateX = trackWidth - thumbWidth;
        const content =
          getControllerElement(contentController) || contentElement;

        if (maxTranslateX <= 0 || !content) return;

        let newTranslateX = startThumbLeft + deltaX;
        newTranslateX = Math.min(Math.max(newTranslateX, 0), maxTranslateX);

        thumb.style.transform = `translateX(${newTranslateX}px)`;
        if (stickyThumb) {
          stickyThumb.style.transform = `translateX(${newTranslateX}px)`;
        }

        const percent = newTranslateX / maxTranslateX;
        const hMaxScroll = content.scrollWidth - content.clientWidth;
        content.scrollLeft = percent * hMaxScroll;
      };

      const upHandler = () => {
        wrapperElement.style.userSelect = '';
        document.documentElement.removeEventListener('mousemove', moveHandler);
        document.documentElement.removeEventListener('mouseup', upHandler);
      };

      document.documentElement.addEventListener('mousemove', moveHandler);
      document.documentElement.addEventListener('mouseup', upHandler);
    },
    [
      contentController,
      contentElement,
      horizontalThumbController,
      horizontalThumbElement,
      horizontalThumbWidth,
      stickyHorizontalController,
      stickyHorizontalThumbElement,
      wrapperElement,
    ],
  );

  // 拖拽纵向滚动条
  const handleVerticalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const track = e.currentTarget;
      const thumb = verticalThumbElement;
      if (!wrapperElement || !thumb) return;

      wrapperElement.style.userSelect = 'none';

      const trackRect = track.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();

      const startClientY = e.clientY;
      const startThumbTop = thumbRect.top - trackRect.top; // thumb 上边距离轨道上边的距离

      const moveHandler = (event: MouseEvent) => {
        const deltaY = event.clientY - startClientY;
        const trackHeight = track.clientHeight;
        const thumbHeight = verticalThumbHeight;
        const maxTranslateY = trackHeight - thumbHeight;
        const content = contentElement;

        if (maxTranslateY <= 0 || !content) return;

        let newTranslateY = startThumbTop + deltaY;
        newTranslateY = Math.min(Math.max(newTranslateY, 0), maxTranslateY);

        thumb.style.transform = `translateY(${newTranslateY}px)`;

        const percent = newTranslateY / maxTranslateY;
        content.scrollTop =
          percent * (content.scrollHeight - content.clientHeight);
      };

      const upHandler = () => {
        wrapperElement.style.userSelect = '';
        document.documentElement.removeEventListener('mousemove', moveHandler);
        document.documentElement.removeEventListener('mouseup', upHandler);
      };

      document.documentElement.addEventListener('mousemove', moveHandler);
      document.documentElement.addEventListener('mouseup', upHandler);
    },
    [contentElement, verticalThumbElement, verticalThumbHeight, wrapperElement],
  );

  const scrollTo = (options?: ScrollToOptions) => {
    if (contentElement) {
      contentElement.scrollTo(options);
    }
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
    horizontalTrackRef,
    horizontalTrackElement,
    horizontalThumbRef,
    horizontalThumbElement,
    showStickyHorizontalScrollBar,
    stickyHorizontalTrackRef,
    stickyHorizontalTrackElement,
    stickyHorizontalThumbRef,
    stickyHorizontalThumbElement,
    verticalTrackRef,
    verticalTrackElement,
    verticalThumbRef,
    verticalThumbElement,
    hasHorizontal,
    hasVertical,
    horizontalThumbWidth,
    verticalThumbHeight,
    handleContentScroll,
    handleHorizontalDrag,
    handleVerticalDrag,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollToLeft,
    scrollToRight,
  };
};

export default useScroll;
