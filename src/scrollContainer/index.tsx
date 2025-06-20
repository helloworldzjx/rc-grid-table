import clsx from 'classnames';
import React, {
  forwardRef,
  type MouseEventHandler,
  UIEventHandler,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTableContext } from '../table/context';
import useHorizontalWheelScroll from './hooks/useHorizontalWheelScroll';
import { useStyles } from './style';
import { ScrollBarContainerProps, ScrollBarContainerRef } from './interface';

const ScrollContainer = forwardRef<ScrollBarContainerRef, ScrollBarContainerProps>(({
  children,
  className,
  classNames,
  styles,
  shouldUpdate = [],
  showHorizontal,
  showVertical,
  showStickyHorizontal,
  footer,
  onScroll,
  ...rest
}, ref) => {
  const containerWidth = useTableContext().containerWidth
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const verticalTrackRef = useRef<HTMLDivElement>(null);
  const stickyHorizontalTrackRef = useRef<HTMLDivElement>(null);
  const horizontalThumbRef = useRef<HTMLDivElement>(null);
  const verticalThumbRef = useRef<HTMLDivElement>(null);
  const stickyVerticalThumbRef = useRef<HTMLDivElement>(null);

  const [hasHorizontal, setHasHorizontal] = useState(false);
  const [hasVertical, setHasVertical] = useState(false);
  const [horizontalThumbWidth, setHorizontalThumbWidth] = useState(0);
  const [verticalThumbHeight, setVerticalThumbHeight] = useState(0);
  const [draging, setDraging] = useState(false);
  const maxScrollLeftOffset = -1
  useHorizontalWheelScroll(contentRef.current!, maxScrollLeftOffset);

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
  } = useStyles({})

  const updateScrollbars = useCallback(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;

    if (!wrapper || !content) return;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const contentWidth = content.scrollWidth;
    const contentHeight = content.scrollHeight;

    const hasH = contentWidth > wrapperWidth;
    const hasV = contentHeight > wrapperHeight;

    setHasHorizontal(hasH)
    setHasVertical(hasV)

    // 计算 thumb 尺寸
    if (hasH && !!showHorizontal) {
      const ratio = wrapperWidth / contentWidth;
      setHorizontalThumbWidth(Math.max(ratio * wrapperWidth, 20));
    }

    if (hasV && !!showVertical) {
      const ratio = wrapperHeight / contentHeight;
      setVerticalThumbHeight(Math.max(ratio * wrapperHeight, 20));
    }
  }, [containerWidth, showHorizontal, showVertical, ...shouldUpdate]);

  // 初始化时调用一次
  useEffect(() => {
    updateScrollbars();
  }, [updateScrollbars]);

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

    if (horizontalThumbRef.current && !!showHorizontal) {
      // @ts-ignore
      const trackWidth = horizontalThumbRef.current.parentNode!.clientWidth;
      const maxTranslateX = trackWidth - horizontalThumbWidth;
      const translateX = leftPercent * maxTranslateX;
      horizontalThumbRef.current.style.transform = `translateX(${translateX}px)`;
      if(!!showStickyHorizontal) {
        stickyVerticalThumbRef.current!.style.transform = `translateX(${translateX}px)`;
      }
    }

    if (verticalThumbRef.current && !!showVertical) {
      // @ts-ignore
      const trackHeight = verticalThumbRef.current.parentNode.clientHeight;
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
      const stickyThumb = stickyVerticalThumbRef.current;
      if (!thumb) return;

      setDraging(true);

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
        const content = contentRef.current;
        const hMaxScroll = content!.scrollWidth - content!.clientWidth + maxScrollLeftOffset
        content!.scrollLeft = percent * hMaxScroll;
      };

      const upHandler = () => {
        setDraging(false);
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    },
    [horizontalThumbWidth],
  );

  // 拖拽纵向滚动条
  const handleVerticalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const track = e.currentTarget;
      const thumb = verticalThumbRef.current;
      if (!thumb) return;

      setDraging(true);

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
        setDraging(false);
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
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

  // 暴露方法给外部
  useImperativeHandle(ref, () => ({
    nativeElement: wrapperRef.current!,
    nativeScrollElement: contentRef.current!,
    nativeHorizontalTrackElement: horizontalTrackRef.current!,
    natiVeverticalTrackElement: verticalTrackRef.current!,
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
          style={{ userSelect: draging ? 'none' : 'auto', ...styles?.content }}
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
          ref={stickyVerticalThumbRef}
          style={{ width: horizontalThumbWidth }}
        />
      </div>
    </>
  );
});

export default ScrollContainer;
