import clsx from 'classnames';
import React, { forwardRef, useImperativeHandle } from 'react';

import { useStyles } from './style';
import { ScrollBarContainerProps, ScrollBarContainerRef } from './interface';
import useScroll from './hooks/useScroll';

const ScrollContainer = forwardRef<ScrollBarContainerRef, ScrollBarContainerProps>(({
  className,
  classNames,
  styles,
  children,
  childrenNextSibling,
  contentController,
  horizontalThumbController,
  stickyHorizontalController,
  shouldHorizontalUpdate = [],
  shouldVerticalUpdate = [],
  showHorizontal,
  showVertical,
  showStickyHorizontal,
  onScroll,
  ...rest
}, ref) => {
  const {
    wrapperRef,
    contentRef,
    horizontalTrackRef,
    horizontalThumbRef,
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
  } = useScroll({contentController, horizontalThumbController, stickyHorizontalController, shouldHorizontalUpdate, shouldVerticalUpdate, showHorizontal, showVertical, showStickyHorizontal, onScroll})
  
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
      <div 
        className={clsx(
          className, 
          scrollbarCls, 
          hashId, 
          classNames?.hasXScrollbarCls && {
            [classNames.hasXScrollbarCls]: hasHorizontal
          },
          classNames?.hasYScrollbarCls && {
            [classNames.hasYScrollbarCls]: hasVertical
          },
        )} 
        ref={wrapperRef} 
        {...rest}
      >
        <div
          className={clsx(classNames.inner, scrollbarInnerCls)}
          ref={contentRef}
          onScroll={handleContentScroll}
          style={styles?.content}
        >
          {children}
        </div>

        <div
          className={clsx(
            xScrollBarCls, 
            hashId,
            {[xScrollBarShowCls]: !!showHorizontal}
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
            yScrollBarCls, 
            hashId,
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

      {childrenNextSibling}

      <div
        className={clsx(
          xScrollBarCls, 
          hashId,
          {[xScrollBarShowCls]: !!showStickyHorizontal}
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
