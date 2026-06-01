import { useIsomorphicLayoutEffect } from 'ahooks';
import clsx from 'classnames';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';

import { usePrefixClsContext } from '../prefixClsContext';
import { getScrollbarCls } from '../style/classNames';
import useScroll from './hooks/useScroll';
import { ScrollBarContainerProps, ScrollBarContainerRef } from './interface';

const ScrollContainer = forwardRef<
  ScrollBarContainerRef,
  ScrollBarContainerProps
>(
  (
    {
      className,
      classNames,
      styles,
      children,
      contentComponent: ContentComponent = 'div',
      showVertical,
      updateDeps,
      onVerticalVisibleChange,
      onVerticalScroll,
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
      onVerticalScroll,
    });

    const prefixCls = usePrefixClsContext();
    const { yScrollBarCls, yScrollBarThumbCls, yScrollBarShowCls } = useMemo(
      () => getScrollbarCls(prefixCls),
      [prefixCls],
    );

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
          classNames?.hasYScrollbarCls && {
            [classNames.hasYScrollbarCls]: showVerticalScrollbar,
          },
        )}
        ref={wrapperRef}
        {...rest}
      >
        <ContentComponent
          className={classNames?.inner}
          ref={contentRef}
          onScroll={handleContentScroll}
          style={styles?.content}
        >
          {children}
        </ContentComponent>

        <div
          className={clsx(yScrollBarCls, {
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
