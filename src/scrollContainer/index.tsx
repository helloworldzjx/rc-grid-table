import clsx from 'classnames';
import React, {
  forwardRef,
  type MouseEventHandler,
  UIEventHandler,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { useTableContext } from '../table/context';
import { useStyles } from './style';
import { ScrollBarContainerProps, ScrollBarContainerRef } from './interface';

const ScrollContainer = forwardRef<ScrollBarContainerRef, ScrollBarContainerProps>(({
  children,
  className,
  classNames,
  styles,
  contentController,
  horizontalThumbController,
  stickyHorizontalController,
  shouldHorizontalUpdate = [],
  shouldVerticalUpdate = [],
  showHorizontal,
  showVertical,
  showStickyHorizontal,
  footer,
  onScroll,
  ...rest
}, ref) => {
  const containerWidth = useTableContext().containerWidth
  const containerHeight = useTableContext().containerHeight
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
  const [dragging, setDragging] = useState(false);

  const {
    hashId,
    scrollbarCls,
    scrollbarInnerCls,
    xScrollBarCls,
    xScrollBarThumbCls,
    xScrollBarShowCls,
    yScrollBarCls,
    yScrollBarThumbCls,
    yScrollBarShowCls,
  } = useStyles()

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

  useEffect(() => {
    updateHorizontalScrollbar();
  }, [updateHorizontalScrollbar]);

  useEffect(() => {
    updateVerticalScrollbar();
  }, [updateVerticalScrollbar]);

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
      if(stickyHorizontalController || !!showStickyHorizontal) {
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
  }, [horizontalThumbWidth, verticalThumbHeight, showHorizontal, showVertical, showStickyHorizontal]);

  // 拖拽横向滚动条
  const handleHorizontalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const track = e.currentTarget;
      const thumb = horizontalThumbRef.current;
      const stickyThumb = stickyHorizontalThumbRef.current;
      if (!thumb) return;

      setDragging(true);

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
        setDragging(false);
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

      setDragging(true);

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
        setDragging(false);
        document.documentElement.removeEventListener('mousemove', moveHandler);
        document.documentElement.removeEventListener('mouseup', upHandler);
      };

      document.documentElement.addEventListener('mousemove', moveHandler);
      document.documentElement.addEventListener('mouseup', upHandler);
    },
    [verticalThumbHeight],
  );
  
  useLayoutEffect(() => {
    wrapperRef.current!.style.userSelect = dragging ? 'none' : ''
  }, [dragging])

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

  // 暴露方法给外部
  useImperativeHandle(ref, () => ({
    nativeElement: wrapperRef.current!,
    nativeScrollElement: contentRef.current!,
    nativeHorizontalThumbElement: horizontalThumbRef.current!,
    nativeHorizontalTrackElement: horizontalTrackRef.current!,
    nativeVeverticalTrackElement: verticalTrackRef.current!,
    nativeVeverticalThumbElement: verticalThumbRef.current!,
    nativeStickyHorizontalElement: stickyHorizontalThumbRef.current!,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollToLeft,
    scrollToRight,
  }));

  return (
    <>
      <div className={clsx(scrollbarCls, hashId, className)} ref={wrapperRef} {...rest}>
        <div
          className={clsx(scrollbarInnerCls, classNames.inner)}
          ref={contentRef}
          onScroll={handleContentScroll}
          style={styles?.content}
        >
          {children}
        </div>

        {footer}

        <div
          className={clsx(
            xScrollBarCls, hashId,
            { [xScrollBarShowCls]: !!showHorizontal }
          )}
          ref={horizontalTrackRef}
          onMouseDown={handleHorizontalDrag}
          style={{
            display: hasHorizontal ? 'block' : 'none',
            ...typeof showHorizontal !== 'boolean' && {
              top: showHorizontal?.offsetTop,
              bottom: showHorizontal?.offsetBottom,
            }
          }}
        >
          <div
            className={xScrollBarThumbCls}
            ref={horizontalThumbRef}
            style={{ width: horizontalThumbWidth }}
          />
        </div>

        <div
          className={clsx(
            yScrollBarCls, hashId,
            { [yScrollBarShowCls]: !!showVertical }
          )}
          ref={verticalTrackRef}
          onMouseDown={handleVerticalDrag}
          style={{
            display: hasVertical ? 'block' : 'none',
            ...typeof showVertical !== 'boolean' && {
              left: showVertical?.offsetLeft,
              right: showVertical?.offsetRight,
            }
          }}
        >
          <div
            className={yScrollBarThumbCls}
            ref={verticalThumbRef}
            style={{ height: verticalThumbHeight }}
          />
        </div>
      </div>

      <div
        className={clsx(
          xScrollBarCls, hashId,
          { [xScrollBarShowCls]: !!showStickyHorizontal }
        )}
        ref={stickyHorizontalTrackRef}
        onMouseDown={handleHorizontalDrag}
        style={{
          display: hasHorizontal && !!showStickyHorizontal ? 'block' : 'none',
          position: 'sticky',
          ...typeof showStickyHorizontal !== 'boolean' && {
            top: showStickyHorizontal?.offsetTop,
            bottom: showStickyHorizontal?.offsetBottom,
          }
        }}
      >
        <div
          className={xScrollBarThumbCls}
          ref={stickyHorizontalThumbRef}
          style={{ width: horizontalThumbWidth }}
        />
      </div>
    </>
  );
});

export default ScrollContainer;
