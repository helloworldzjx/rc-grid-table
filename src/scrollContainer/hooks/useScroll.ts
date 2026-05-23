import { useIsomorphicLayoutEffect } from 'ahooks';
import {
  MouseEventHandler,
  UIEventHandler,
  useCallback,
  useState,
} from 'react';

import { MIN_THUMB_SIZE } from '../../_utils/const';
import { ScrollBarContainerProps } from '../interface';

type UseScrollProps = Omit<ScrollBarContainerProps, 'classNames' | 'prefixCls'>;

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
}: UseScrollProps) => {
  const [wrapperRef, wrapperElement] = useElementRef<HTMLDivElement>();
  const [contentRef, contentElement] = useElementRef<HTMLDivElement>();
  const [verticalTrackRef, verticalTrackElement] =
    useElementRef<HTMLDivElement>();
  const [verticalThumbRef, verticalThumbElement] =
    useElementRef<HTMLDivElement>();

  const [hasVertical, setHasVertical] = useState(false);
  const [verticalThumbHeight, setVerticalThumbHeight] = useState(0);

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

  const handleVerticalDrag: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const track = e.currentTarget;
      const thumb = verticalThumbElement;
      if (!wrapperElement || !thumb) return;

      wrapperElement.style.userSelect = 'none';

      const trackRect = track.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();

      const startClientY = e.clientY;
      const startThumbTop = thumbRect.top - trackRect.top;
      const moveHandler = (event: MouseEvent) => {
        const deltaY = event.clientY - startClientY;
        const trackHeight = track.clientHeight;
        const maxTranslateY = trackHeight - verticalThumbHeight;
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
