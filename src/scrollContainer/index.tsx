import { useIsomorphicLayoutEffect } from 'ahooks';
import clsx from 'classnames';
import React, { forwardRef, useImperativeHandle } from 'react';

import useScroll from './hooks/useScroll';
import { ScrollBarContainerProps, ScrollBarContainerRef } from './interface';
import { useStyles } from './style';

const ScrollContainer = forwardRef<
  ScrollBarContainerRef,
  ScrollBarContainerProps
>(
  (
    {
      prefixCls,
      className,
      classNames,
      styles,
      children,
      contentComponent: ContentComponent = 'div',
      showVertical,
      updateDeps,
      onVerticalVisibleChange,
      onScroll,
      ...rest
    },
    ref,
  ) => {
    const {
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
    } = useScroll({
      showVertical,
      updateDeps,
      onScroll,
    });

    const {
      hashId,
      scrollbarCls,
      scrollbarInnerCls,
      yScrollBarCls,
      yScrollBarThumbCls,
      yScrollBarShowCls,
    } = useStyles(prefixCls);
    const showVerticalScrollbar = !!showVertical && hasVertical;

    useImperativeHandle(ref, () => ({
      nativeElement: wrapperElement!,
      nativeScrollElement: contentElement!,
      nativeVerticalTrackElement: verticalTrackElement!,
      nativeVerticalThumbElement: verticalThumbElement!,
      scrollTo,
      scrollToTop,
      scrollToBottom,
      scrollToLeft,
      scrollToRight,
    }));

    useIsomorphicLayoutEffect(() => {
      onVerticalVisibleChange?.(showVerticalScrollbar);
    }, [onVerticalVisibleChange, showVerticalScrollbar]);

    return (
      <div
        className={clsx(
          className,
          scrollbarCls,
          hashId,
          classNames?.hasYScrollbarCls && {
            [classNames.hasYScrollbarCls]: showVerticalScrollbar,
          },
        )}
        ref={wrapperRef}
        {...rest}
      >
        <ContentComponent
          className={clsx(classNames?.inner, scrollbarInnerCls)}
          ref={contentRef}
          onScroll={handleContentScroll}
          style={styles?.content}
        >
          {children}
        </ContentComponent>

        <div
          className={clsx(yScrollBarCls, hashId, {
            [yScrollBarShowCls]: showVerticalScrollbar,
          })}
          ref={verticalTrackRef}
          onMouseDown={handleVerticalDrag}
          style={{
            ...(typeof showVertical !== 'boolean' && {
              left: showVertical?.offsetLeft,
              right: showVertical?.offsetRight,
            }),
          }}
        >
          <div
            className={yScrollBarThumbCls}
            ref={verticalThumbRef}
            style={{ height: verticalThumbHeight }}
          />
        </div>
      </div>
    );
  },
);

export default ScrollContainer;
