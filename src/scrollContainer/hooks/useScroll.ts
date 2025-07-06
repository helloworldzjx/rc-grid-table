import { MouseEventHandler, UIEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounceEffect } from "ahooks";

import { useTableContext } from "../../table/context";
import { ScrollBarContainerProps } from "../interface";

interface UseScrollProps extends Omit<ScrollBarContainerProps, 'classNames'> {
  
}

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const verticalTrackRef = useRef<HTMLDivElement>(null);
  const stickyHorizontalTrackRef = useRef<HTMLDivElement>(null);
  const stickyHorizontalThumbRef = useRef<HTMLDivElement>(null);
  const horizontalThumbRef = useRef<HTMLDivElement>(null);
  const verticalThumbRef = useRef<HTMLDivElement>(null);

  const [hasHorizontal, setHasHorizontal] = useState(false);
  const [hasVertical, setHasVertical] = useState(false);
  const [horizontalThumbWidth, setHorizontalThumbWidth] = useState(0);
  const [verticalThumbHeight, setVerticalThumbHeight] = useState(0);
  const [showStickyXScrollBar, setShowStickyXScrollBar] = useState(false);

  useEffect(() => {
    if(!wrapperRef.current || !showStickyHorizontal) return
    
    let bottom = 0
    let root: Element | Document | undefined = undefined
    if(typeof showStickyHorizontal === 'object') {
      root = showStickyHorizontal.getContainer?.()
      if(!!showStickyHorizontal.offsetStickyScroller) {
        bottom = showStickyHorizontal.offsetStickyScroller
      }
    }
    const { height } = wrapperRef.current.getBoundingClientRect()
    let threshold = [1]
    if(bottom) {
      threshold = [(height - bottom) / height, 1].sort((a, b) => a - b)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyXScrollBar(!entry.isIntersecting && entry.intersectionRect.top > bottom);
      },
      {
        threshold,
        root,
        rootMargin: `0px 0px ${bottom * -1}px 0px`,
      }
    );
    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
    };
  }, [wrapperRef.current, showStickyHorizontal]);

  const showStickyHorizontalScrollBar = useMemo(() => {
    return showStickyXScrollBar && !!showStickyHorizontal
  }, [showStickyXScrollBar, showStickyHorizontal])

  // 横向滚动条计算
  const updateHorizontalScrollbar = useCallback(() => {
    const content = contentController || contentRef.current
    if (!wrapperRef.current || !content) return;

    const wrapperWidth = wrapperRef.current.clientWidth;
    const contentWidth = content.scrollWidth

    const hasH = contentWidth > wrapperWidth;

    setHasHorizontal(hasH)

    // 计算横向 thumb 尺寸
    if (hasH && !!showHorizontal) {
      const ratio = wrapperWidth / contentWidth;
      setHorizontalThumbWidth(Math.max(ratio * wrapperWidth, 20));
    }
  }, [containerWidth, showHorizontal, ...shouldHorizontalUpdate]);

  // 纵向滚动条计算
  const updateVerticalScrollbar = useCallback(() => {
    if (!wrapperRef.current || !contentRef.current) return;

    const wrapperHeight = wrapperRef.current.clientHeight;
    const contentHeight = contentRef.current.scrollHeight;

    const hasV = contentHeight > wrapperHeight;

    setHasVertical(hasV)

    // 计算纵向 thumb 尺寸
    if (hasV && !!showVertical) {
      const ratio = wrapperHeight / contentHeight;
      setVerticalThumbHeight(Math.max(ratio * wrapperHeight, 20));
    }
  }, [containerHeight, showVertical, ...shouldVerticalUpdate]);

  useDebounceEffect(() => {
    updateHorizontalScrollbar();
  }, [updateHorizontalScrollbar], { wait: 0 });

  useDebounceEffect(() => {
    updateVerticalScrollbar();
  }, [updateVerticalScrollbar], { wait: 0 });

  // 内容滚动事件
  const handleContentScroll: UIEventHandler<HTMLDivElement> = useCallback((e) => {
    onScroll?.(e)
    
    const content = contentRef.current;
    if (!content) return;

    const hMaxScroll = content.scrollWidth - content.clientWidth;
    const vMaxScroll = content.scrollHeight - content.clientHeight;
    const contentScrollLeft = content.scrollLeft

    const leftPercent = hMaxScroll > 0 ? contentScrollLeft / hMaxScroll : 0;
    const topPercent = vMaxScroll > 0 ? content.scrollTop / vMaxScroll : 0;

    if (horizontalThumbController || (horizontalThumbRef.current && !!showHorizontal)) {
      const horizontalThumb = horizontalThumbController || horizontalThumbRef.current!
      const trackWidth = horizontalThumb.parentElement!.clientWidth;
      const maxTranslateX = trackWidth - (horizontalThumbWidth || horizontalThumb.offsetWidth);
      const translateX = leftPercent * maxTranslateX;
      horizontalThumb.style.transform = `translateX(${translateX}px)`;
      if(stickyHorizontalController || !!showStickyHorizontalScrollBar) {
        const stickyHorizontalThumb = stickyHorizontalController || stickyHorizontalThumbRef.current
        stickyHorizontalThumb!.style.transform = `translateX(${translateX}px)`;
      }
    }

    if (verticalThumbRef.current && !!showVertical) {
      const trackHeight = verticalThumbRef.current.parentElement!.clientHeight;
      const maxTranslateY = trackHeight - verticalThumbHeight;
      const translateY = topPercent * maxTranslateY;
      verticalThumbRef.current.style.transform = `translateY(${translateY}px)`;
    }
  }, [horizontalThumbWidth, verticalThumbHeight, showHorizontal, showVertical, showStickyHorizontalScrollBar]);

  // 拖拽横向滚动条
  const handleHorizontalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const track = e.currentTarget;
      const thumb = horizontalThumbRef.current;
      const stickyThumb = stickyHorizontalThumbRef.current;
      if (!thumb) return;

      wrapperRef.current!.style.userSelect = 'none';

      const trackRect = track.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();

      const startClientX = e.clientX;
      const startThumbLeft = thumbRect.left - trackRect.left; // thumb 左侧距离轨道左侧的距离

      const moveHandler = (event: MouseEvent) => {
        const deltaX = event.clientX - startClientX;
        const trackWidth = track.clientWidth;
        const thumbWidth = horizontalThumbWidth;
        const maxTranslateX = trackWidth - thumbWidth;

        let newTranslateX = startThumbLeft + deltaX;
        newTranslateX = Math.min(Math.max(newTranslateX, 0), maxTranslateX);

        thumb.style.transform = `translateX(${newTranslateX}px)`;
        stickyThumb!.style.transform = `translateX(${newTranslateX}px)`;

        const percent = newTranslateX / maxTranslateX;
        const content = contentController || contentRef.current;
        const hMaxScroll = content!.scrollWidth - content!.clientWidth
        content!.scrollLeft = percent * hMaxScroll;
      };

      const upHandler = () => {
        wrapperRef.current!.style.userSelect = ''
        document.documentElement.removeEventListener('mousemove', moveHandler);
        document.documentElement.removeEventListener('mouseup', upHandler);
      };

      document.documentElement.addEventListener('mousemove', moveHandler);
      document.documentElement.addEventListener('mouseup', upHandler);
    },
    [horizontalThumbWidth],
  );

  // 拖拽纵向滚动条
  const handleVerticalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const track = e.currentTarget;
      const thumb = verticalThumbRef.current;
      if (!thumb) return;

      wrapperRef.current!.style.userSelect = 'none';

      const trackRect = track.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();

      const startClientY = e.clientY;
      const startThumbTop = thumbRect.top - trackRect.top; // thumb 上边距离轨道上边的距离

      const moveHandler = (event: MouseEvent) => {
        const deltaY = event.clientY - startClientY;
        const trackHeight = track.clientHeight;
        const thumbHeight = verticalThumbHeight;
        const maxTranslateY = trackHeight - thumbHeight;

        let newTranslateY = startThumbTop + deltaY;
        newTranslateY = Math.min(Math.max(newTranslateY, 0), maxTranslateY);

        thumb.style.transform = `translateY(${newTranslateY}px)`;

        const percent = newTranslateY / maxTranslateY;
        const content = contentRef.current;
        content!.scrollTop =
          percent * (content!.scrollHeight - content!.clientHeight);
      };

      const upHandler = () => {
        wrapperRef.current!.style.userSelect = ''
        document.documentElement.removeEventListener('mousemove', moveHandler);
        document.documentElement.removeEventListener('mouseup', upHandler);
      };

      document.documentElement.addEventListener('mousemove', moveHandler);
      document.documentElement.addEventListener('mouseup', upHandler);
    },
    [verticalThumbHeight],
  );

  const scrollTo = (options?: ScrollToOptions) => {
    if (contentRef.current) {
      contentRef.current.scrollTo(options);
    }
  };

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  };

  const scrollToLeft = () => {
    if (contentRef.current) {
      contentRef.current.scrollLeft = 0;
    }
  };

  const scrollToRight = () => {
    if (contentRef.current) {
      contentRef.current.scrollLeft = contentRef.current.scrollWidth;
    }
  };

  return {
    wrapperRef,
    contentRef,
    horizontalTrackRef,
    horizontalThumbRef,
    showStickyHorizontalScrollBar,
    stickyHorizontalTrackRef,
    stickyHorizontalThumbRef,
    verticalTrackRef,
    verticalThumbRef,
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
  }
}

export default useScroll