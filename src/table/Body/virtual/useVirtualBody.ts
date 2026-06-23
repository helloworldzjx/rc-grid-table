import { useIsomorphicLayoutEffect } from 'ahooks';
import { Key, useCallback, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { preventDefaultIfCancelable } from '../../../_utils/event';
import { isNum } from '../../../_utils/validate';
import type {
  SizeType,
  TableScrollToOptions,
  TableVirtualConfig,
} from '../../interface';
import { getDefaultInternalColumnWidth } from '../../utils/const';

type VirtualWheelEvent = WheelEvent & {
  _virtualHandled?: boolean;
};

type VirtualTouchEvent = TouchEvent & {
  _virtualHandled?: boolean;
};

type KeyedVirtualBodyItem = {
  key: Key;
};

type ScrollTargetAlign = Exclude<TableScrollToOptions['align'], undefined>;

interface PendingScrollTarget {
  index: number;
  align: ScrollTargetAlign;
  offset: number;
  syncTimes: number;
}

interface UseVirtualBodyProps<ItemType extends KeyedVirtualBodyItem> {
  data: ItemType[];
  scrollElement?: HTMLDivElement | null;
  scrollY?: number;
  virtual?: boolean | TableVirtualConfig;
  size?: SizeType;
  getItemFixedHeight?: (item: ItemType) => number | undefined;
  onScrollTopChange?: (scrollTop: number) => void;
}

const getDefaultEstimatedRowHeight = getDefaultInternalColumnWidth;

const getVirtualConfig = (
  virtual: boolean | TableVirtualConfig | undefined,
  size: SizeType | undefined,
  scrollY: number | undefined,
) => {
  const config = typeof virtual === 'object' ? virtual : {};
  const estimatedRowHeight = Math.max(
    1,
    config.rowHeight ??
      config.estimatedRowHeight ??
      getDefaultEstimatedRowHeight(size),
  );
  const fixedRowHeight =
    isNum(config.rowHeight) && config.rowHeight > 0
      ? config.rowHeight
      : undefined;
  const visibleCount = Math.ceil((scrollY || 0) / estimatedRowHeight);
  const overscan =
    isNum(config.rowOverscan) && config.rowOverscan >= 0
      ? Math.floor(config.rowOverscan)
      : Math.ceil(visibleCount / 2);

  return {
    estimatedRowHeight,
    fixedRowHeight,
    overscan: Math.max(2, overscan),
  };
};

const rafIds = new Map<number, number>();
let rafUid = 0;

const raf = (callback: FrameRequestCallback, times = 1) => {
  const id = (rafUid += 1);

  const request = (leftTimes: number) => {
    const requestId =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame((time) => {
            if (!rafIds.has(id)) return;

            if (leftTimes <= 1) {
              rafIds.delete(id);
              callback(time);
            } else {
              request(leftTimes - 1);
            }
          })
        : (setTimeout(() => {
            if (!rafIds.has(id)) return;

            if (leftTimes <= 1) {
              rafIds.delete(id);
              callback(Date.now());
            } else {
              request(leftTimes - 1);
            }
          }, 16) as unknown as number);

    rafIds.set(id, requestId);
  };

  request(times);
  return id;
};

const cancelRaf = (id: number | null) => {
  if (!isNum(id)) return;

  const requestId = rafIds.get(id);
  if (requestId === undefined) return;

  rafIds.delete(id);
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(requestId);
  } else {
    clearTimeout(requestId);
  }
};

const isFirefox =
  typeof navigator === 'object' && /Firefox/i.test(navigator.userAgent);

const touchSmoothRatio = 14 / 15;
const scrollToMeasureSyncTimes = 5;
const scrollToMeasureExpireFrames = 8;

const getPageXY = (event: MouseEvent | TouchEvent, horizontal = false) => {
  const target = 'touches' in event ? event.touches[0] : event;
  return (
    target[horizontal ? 'pageX' : 'pageY'] -
    window[horizontal ? 'scrollX' : 'scrollY']
  );
};

const getDragScrollOffset = (offset: number) =>
  Math.floor(Math.sqrt(Math.max(offset, 0)));

export default function useVirtualBody<ItemType extends KeyedVirtualBodyItem>({
  data,
  scrollElement,
  scrollY,
  virtual = true,
  size,
  getItemFixedHeight,
  onScrollTopChange,
}: UseVirtualBodyProps<ItemType>) {
  const { estimatedRowHeight, fixedRowHeight, overscan } = useMemo(
    () => getVirtualConfig(virtual, size, scrollY),
    [scrollY, size, virtual],
  );
  const useVirtual =
    virtual !== false &&
    isNum(scrollY) &&
    scrollY > 0 &&
    data.length > 0 &&
    estimatedRowHeight > 0;
  const [offsetTop, setOffsetTop] = useState(0);
  const [heightUpdateMark, setHeightUpdateMark] = useState(0);
  const heightsRef = useRef(new Map<Key, number>());
  const instancesRef = useRef(new Map<Key, HTMLElement>());
  const changedHeightsRef = useRef(new Map<Key, number | undefined>());
  const collectFrameRef = useRef<number | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelDirectionRef = useRef<'x' | 'y' | 'sx' | null>(null);
  const wheelDirectionCleanRef = useRef<number | null>(null);
  const firefoxWheelValueRef = useRef<number | null>(null);
  const firefoxMouseScrollRef = useRef(false);
  const pendingScrollTargetRef = useRef<PendingScrollTarget | null>(null);
  const pendingScrollTargetFrameRef = useRef<number | null>(null);
  const originScrollLockRef = useRef(false);
  const originScrollLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scrollTopRef = useRef(0);

  const keyIndexMap = useMemo(() => {
    const map = new Map<Key, number>();
    data.forEach((item, index) => {
      map.set(item.key, index);
    });
    return map;
  }, [data]);

  const heights = heightsRef.current;

  const getRowHeight = useCallback(
    (key: Key) => {
      const index = keyIndexMap.get(key);
      const item = index === undefined ? undefined : data[index];
      if (item !== undefined && getItemFixedHeight) {
        const fixedHeight = getItemFixedHeight(item);
        return fixedHeight ?? heights.get(key) ?? estimatedRowHeight;
      }

      return fixedRowHeight ?? heights.get(key) ?? estimatedRowHeight;
    },
    [
      data,
      estimatedRowHeight,
      fixedRowHeight,
      getItemFixedHeight,
      heights,
      keyIndexMap,
    ],
  );

  const prefixHeights = useMemo(() => {
    const list: number[] = [0];
    data.forEach((item, index) => {
      list[index + 1] = list[index] + getRowHeight(item.key);
    });
    return list;
  }, [data, getRowHeight, heightUpdateMark]);

  const scrollHeight = prefixHeights[prefixHeights.length - 1] || 0;
  const inVirtual = useVirtual && scrollHeight > (scrollY || 0);
  const maxScrollTop = Math.max(scrollHeight - (scrollY || 0), 0);

  const keepInRange = useCallback(
    (top: number) => Math.min(Math.max(top, 0), maxScrollTop),
    [maxScrollTop],
  );

  const clearPendingScrollTarget = useCallback(() => {
    if (
      pendingScrollTargetRef.current === null &&
      pendingScrollTargetFrameRef.current === null
    ) {
      return;
    }

    pendingScrollTargetRef.current = null;
    cancelRaf(pendingScrollTargetFrameRef.current);
    pendingScrollTargetFrameRef.current = null;
  }, []);

  const schedulePendingScrollTargetClear = useCallback(() => {
    cancelRaf(pendingScrollTargetFrameRef.current);
    pendingScrollTargetFrameRef.current = raf(() => {
      pendingScrollTargetFrameRef.current = null;
      pendingScrollTargetRef.current = null;
    }, scrollToMeasureExpireFrames);
  }, []);

  const setPendingScrollTarget = useCallback(
    (target: Omit<PendingScrollTarget, 'syncTimes'>) => {
      pendingScrollTargetRef.current = {
        ...target,
        syncTimes: scrollToMeasureSyncTimes,
      };
      schedulePendingScrollTargetClear();
    },
    [schedulePendingScrollTargetClear],
  );

  const lockOriginScroll = useCallback(() => {
    if (originScrollLockTimerRef.current) {
      clearTimeout(originScrollLockTimerRef.current);
    }

    originScrollLockRef.current = true;
    originScrollLockTimerRef.current = setTimeout(() => {
      originScrollLockRef.current = false;
    }, 50);
  }, []);

  const shouldUseOriginScroll = useCallback(
    (delta: number, smoothOffset = false) => {
      if (pendingScrollTargetRef.current) {
        return false;
      }

      const originScroll =
        (delta < 0 && scrollTopRef.current <= 0) ||
        (delta > 0 && scrollTopRef.current >= maxScrollTop);

      if (smoothOffset && originScroll) {
        if (originScrollLockTimerRef.current) {
          clearTimeout(originScrollLockTimerRef.current);
        }
        originScrollLockRef.current = false;
      } else if (!originScroll || originScrollLockRef.current) {
        lockOriginScroll();
      }

      return !originScrollLockRef.current && originScroll;
    },
    [lockOriginScroll, maxScrollTop],
  );

  const updateOffsetTop = useCallback((top: number, sync = false) => {
    if (sync) {
      flushSync(() => {
        setOffsetTop(top);
      });
    } else {
      setOffsetTop(top);
    }
  }, []);

  const syncScrollTop = useCallback(
    (
      top: number | ((prev: number) => number),
      trigger = true,
      sync = false,
    ) => {
      const rawTop =
        typeof top === 'function' ? top(scrollTopRef.current) : top;
      const prevTop = scrollTopRef.current;
      const nextTop = keepInRange(rawTop);
      const scrollTopChanged = prevTop !== nextTop;
      scrollTopRef.current = nextTop;

      if (scrollTopChanged) {
        updateOffsetTop(nextTop, sync);
      }

      if (scrollElement && scrollElement.scrollTop !== nextTop) {
        scrollElement.scrollTop = nextTop;
      }
      if (trigger && scrollTopChanged) {
        onScrollTopChange?.(nextTop);
      }
    },
    [keepInRange, onScrollTopChange, scrollElement, updateOffsetTop],
  );

  useIsomorphicLayoutEffect(() => {
    if (!inVirtual) return;

    scrollTopRef.current = keepInRange(scrollTopRef.current);
    if (scrollTopRef.current !== offsetTop) {
      setOffsetTop(scrollTopRef.current);
    }

    if (!scrollElement) return;

    const scrollElScrollTop = scrollElement.scrollTop;
    if (
      isNum(scrollElScrollTop) &&
      scrollElScrollTop !== scrollTopRef.current
    ) {
      scrollElement.scrollTop = scrollTopRef.current;
    }
  }, [inVirtual, keepInRange, scrollElement, offsetTop]);

  const collectHeight = useCallback(
    (sync = false) => {
      if (fixedRowHeight !== undefined && !getItemFixedHeight) {
        return;
      }

      cancelRaf(collectFrameRef.current);

      const doCollect = () => {
        collectFrameRef.current = null;
        let changed = false;

        instancesRef.current.forEach((element, key) => {
          if (!element || !element.offsetParent) return;

          const itemIndex = keyIndexMap.get(key);
          const item = itemIndex === undefined ? undefined : data[itemIndex];
          if (item !== undefined && getItemFixedHeight?.(item) !== undefined) {
            return;
          }

          const prev = heightsRef.current.get(key);
          const next = element.getBoundingClientRect().height;
          if (isNum(next) && next > 0 && prev !== next) {
            changedHeightsRef.current.set(key, prev);
            heightsRef.current.set(key, next);
            changed = true;
          }
        });

        if (changed) {
          setHeightUpdateMark((mark) => mark + 1);
        }
      };

      if (sync) {
        doCollect();
      } else {
        collectFrameRef.current = raf(doCollect);
      }
    },
    [data, fixedRowHeight, getItemFixedHeight, keyIndexMap],
  );

  const setItemRef = useCallback(
    (key: Key, element: HTMLElement | null) => {
      if (element) {
        instancesRef.current.set(key, element);
        collectHeight();
      } else {
        instancesRef.current.delete(key);
      }
    },
    [collectHeight],
  );

  useIsomorphicLayoutEffect(() => {
    return () => {
      cancelRaf(collectFrameRef.current);
      cancelRaf(wheelFrameRef.current);
      cancelRaf(wheelDirectionCleanRef.current);
      cancelRaf(pendingScrollTargetFrameRef.current);
      if (originScrollLockTimerRef.current) {
        clearTimeout(originScrollLockTimerRef.current);
      }
    };
  }, []);

  let start = 0;
  let end = data.length - 1;
  let offsetY = 0;

  if (inVirtual) {
    const top = keepInRange(offsetTop);
    const bottom = top + (scrollY || 0);
    let startIndex = 0;
    let endIndex = data.length - 1;

    for (let i = 0; i < data.length; i += 1) {
      if (prefixHeights[i + 1] >= top) {
        startIndex = i;
        break;
      }
    }

    for (let i = startIndex; i < data.length; i += 1) {
      if (prefixHeights[i] > bottom) {
        endIndex = i;
        break;
      }
    }

    start = Math.max(0, startIndex - overscan);
    end = Math.min(data.length - 1, endIndex + overscan);
    offsetY = prefixHeights[start] || 0;
  }

  const visibleStart = start;
  const visibleEnd = end;
  const visibleItems = useMemo(
    () => (inVirtual ? data.slice(start, end + 1) : []),
    [data, end, inVirtual, start],
  );

  const getItemSize = useCallback(
    (startKey: Key, endKey: Key = startKey) => {
      const startIndex = keyIndexMap.get(startKey);
      const endIndex = keyIndexMap.get(endKey);

      if (startIndex === undefined || endIndex === undefined) {
        return {
          top: 0,
          bottom: 0,
        };
      }

      const realStartIndex = Math.min(startIndex, endIndex);
      const realEndIndex = Math.max(startIndex, endIndex);

      return {
        top: prefixHeights[realStartIndex] || 0,
        bottom:
          prefixHeights[realEndIndex + 1] ??
          (prefixHeights[realEndIndex] || 0) + estimatedRowHeight,
      };
    },
    [estimatedRowHeight, keyIndexMap, prefixHeights],
  );

  const getScrollTargetTop = useCallback(
    (targetIndex: number, align: ScrollTargetAlign, offset: number) => {
      if (targetIndex < 0 || targetIndex >= data.length) {
        return undefined;
      }

      const itemTop = prefixHeights[targetIndex] || 0;
      const itemBottom =
        prefixHeights[targetIndex + 1] || itemTop + estimatedRowHeight;
      const viewTop = scrollTopRef.current;
      const viewBottom = viewTop + (scrollY || 0);

      if (align === 'top') {
        return itemTop - offset;
      }
      if (align === 'bottom') {
        return itemBottom - (scrollY || 0) + offset;
      }
      if (itemTop < viewTop) {
        return itemTop - offset;
      }
      if (itemBottom > viewBottom) {
        return itemBottom - (scrollY || 0) + offset;
      }

      return undefined;
    },
    [data.length, estimatedRowHeight, prefixHeights, scrollY],
  );

  const shouldSyncScrollTargetAfterMeasure = useCallback(
    (targetIndex: number) => {
      if (!inVirtual) {
        return false;
      }

      const targetItem = data[targetIndex];
      if (!targetItem) {
        return false;
      }

      if (getItemFixedHeight) {
        return getItemFixedHeight(targetItem) === undefined;
      }

      return (
        fixedRowHeight === undefined &&
        heightsRef.current.get(targetItem.key) === undefined
      );
    },
    [data, fixedRowHeight, getItemFixedHeight, inVirtual],
  );

  const isScrollTargetHeightResolved = useCallback(
    (targetIndex: number) => {
      const targetItem = data[targetIndex];
      if (!targetItem) {
        return true;
      }

      if (getItemFixedHeight) {
        return (
          getItemFixedHeight(targetItem) !== undefined ||
          heightsRef.current.has(targetItem.key)
        );
      }

      return (
        fixedRowHeight !== undefined || heightsRef.current.has(targetItem.key)
      );
    },
    [data, fixedRowHeight, getItemFixedHeight],
  );

  useIsomorphicLayoutEffect(() => {
    const changedRecord = changedHeightsRef.current;
    if (changedRecord.size === 1 && inVirtual) {
      const [changedKey, previousHeight] = Array.from(
        changedRecord.entries(),
      )[0];
      const startItem = data[visibleStart];
      const startKey = startItem?.key;

      if (changedKey === startKey && !isNum(previousHeight)) {
        const nextHeight = heightsRef.current.get(changedKey);
        if (isNum(nextHeight)) {
          syncScrollTop((top) => top + nextHeight - estimatedRowHeight, false);
        }
      }
    }

    const pendingTarget = pendingScrollTargetRef.current;
    if (pendingTarget && inVirtual) {
      const heightResolved = isScrollTargetHeightResolved(pendingTarget.index);
      const targetTop = getScrollTargetTop(
        pendingTarget.index,
        pendingTarget.align,
        pendingTarget.offset,
      );

      if (targetTop === undefined) {
        clearPendingScrollTarget();
      } else if (Math.abs(targetTop - scrollTopRef.current) <= 1) {
        if (heightResolved) {
          clearPendingScrollTarget();
        } else {
          schedulePendingScrollTargetClear();
        }
      } else {
        pendingTarget.syncTimes -= 1;
        syncScrollTop(targetTop);

        if (pendingTarget.syncTimes <= 0) {
          clearPendingScrollTarget();
        } else {
          schedulePendingScrollTargetClear();
        }
      }
    }

    changedRecord.clear();
  }, [
    data,
    clearPendingScrollTarget,
    estimatedRowHeight,
    heightUpdateMark,
    getScrollTargetTop,
    inVirtual,
    syncScrollTop,
    isScrollTargetHeightResolved,
    schedulePendingScrollTargetClear,
    visibleStart,
  ]);

  const handleScroll = useCallback(
    (scrollTop: number, sync = true) => {
      if (!sync && pendingScrollTargetRef.current) {
        return;
      }

      if (!inVirtual) {
        if (scrollTopRef.current === scrollTop) {
          return;
        }
        scrollTopRef.current = scrollTop;
        return;
      }

      const renderedTop = prefixHeights[visibleStart] || 0;
      const renderedBottom =
        prefixHeights[visibleEnd + 1] ?? prefixHeights[visibleEnd] ?? 0;
      const viewBottom = scrollTop + (scrollY || 0);
      const needSync =
        sync || scrollTop < renderedTop || viewBottom > renderedBottom;

      syncScrollTop(scrollTop, true, needSync);
    },
    [
      inVirtual,
      prefixHeights,
      scrollY,
      syncScrollTop,
      visibleEnd,
      visibleStart,
    ],
  );

  const syncScrollBy = useCallback(
    (delta: number, smoothOffset = false) => {
      if (pendingScrollTargetRef.current) {
        return true;
      }

      if (shouldUseOriginScroll(delta, smoothOffset)) {
        return false;
      }

      syncScrollTop((top) => top + delta, true, true);
      return true;
    },
    [shouldUseOriginScroll, syncScrollTop],
  );

  const scrollByWheel = useCallback(
    (delta: number) => {
      wheelDeltaRef.current += delta;
      firefoxWheelValueRef.current = delta;

      cancelRaf(wheelFrameRef.current);
      wheelFrameRef.current = raf(() => {
        const wheelDelta = wheelDeltaRef.current;
        const patchMultiple = firefoxMouseScrollRef.current ? 10 : 1;
        wheelDeltaRef.current = 0;
        wheelFrameRef.current = null;
        syncScrollBy(wheelDelta * patchMultiple);
      });
    },
    [syncScrollBy],
  );

  useIsomorphicLayoutEffect(() => {
    if (!scrollElement || !inVirtual) return undefined;

    const handleWheel = (event: VirtualWheelEvent) => {
      const { deltaX, deltaY, shiftKey } = event;
      let mergedDeltaX = deltaX;
      let mergedDeltaY = deltaY;

      cancelRaf(wheelDirectionCleanRef.current);
      wheelDirectionCleanRef.current = raf(() => {
        wheelDirectionRef.current = null;
      }, 2);

      if (
        wheelDirectionRef.current === 'sx' ||
        (!wheelDirectionRef.current && shiftKey && deltaY && !deltaX)
      ) {
        mergedDeltaX = deltaY;
        mergedDeltaY = 0;
        wheelDirectionRef.current = 'sx';
      }

      const absX = Math.abs(mergedDeltaX);
      const absY = Math.abs(mergedDeltaY);

      if (!wheelDirectionRef.current) {
        wheelDirectionRef.current = absX > absY ? 'x' : 'y';
      }

      if (wheelDirectionRef.current !== 'y' || !mergedDeltaY) return;
      if (shouldUseOriginScroll(mergedDeltaY)) return;
      if (event._virtualHandled) return;

      event._virtualHandled = true;
      if (!isFirefox) {
        preventDefaultIfCancelable(event);
      }
      scrollByWheel(mergedDeltaY);
    };

    const handleFirefoxScroll = (event: Event) => {
      const detail = (event as WheelEvent).detail;
      firefoxMouseScrollRef.current = detail === firefoxWheelValueRef.current;
    };

    const handleFirefoxPixelScroll = (event: Event) => {
      const detail = (event as WheelEvent).detail;
      const scrollingUpAtTop = scrollTopRef.current <= 0 && detail < 0;
      const scrollingDownAtBottom =
        scrollTopRef.current >= maxScrollTop && detail > 0;

      if (!scrollingUpAtTop && !scrollingDownAtBottom) {
        preventDefaultIfCancelable(event);
      }
    };

    scrollElement.addEventListener('wheel', handleWheel, { passive: false });
    scrollElement.addEventListener('DOMMouseScroll', handleFirefoxScroll, {
      passive: true,
    });
    scrollElement.addEventListener(
      'MozMousePixelScroll',
      handleFirefoxPixelScroll,
      { passive: false },
    );

    return () => {
      scrollElement.removeEventListener('wheel', handleWheel);
      scrollElement.removeEventListener('DOMMouseScroll', handleFirefoxScroll);
      scrollElement.removeEventListener(
        'MozMousePixelScroll',
        handleFirefoxPixelScroll,
      );
      cancelRaf(wheelFrameRef.current);
      cancelRaf(wheelDirectionCleanRef.current);
      wheelDeltaRef.current = 0;
    };
  }, [
    inVirtual,
    maxScrollTop,
    scrollByWheel,
    scrollElement,
    shouldUseOriginScroll,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!scrollElement || !inVirtual) return undefined;

    let touched = false;
    let touchX = 0;
    let touchY = 0;
    let touchElement: HTMLElement | null = null;
    let touchInterval: ReturnType<typeof setInterval> | null = null;
    let cleanupTouchEvents = () => {};

    const clearTouchInterval = () => {
      if (touchInterval) {
        clearInterval(touchInterval);
        touchInterval = null;
      }
    };

    const scrollTouchOffset = (
      offset: number,
      smoothOffset: boolean,
      event?: VirtualTouchEvent,
    ) => {
      if (shouldUseOriginScroll(offset, smoothOffset)) {
        return false;
      }

      if (!event || !event._virtualHandled) {
        if (event) {
          event._virtualHandled = true;
        }

        scrollByWheel(offset);
        return true;
      }

      return false;
    };

    function handleTouchMove(event: VirtualTouchEvent) {
      if (!touched || !event.touches.length) return;

      const currentX = Math.ceil(event.touches[0].pageX);
      const currentY = Math.ceil(event.touches[0].pageY);
      const offsetX = touchX - currentX;
      let offsetY = touchY - currentY;
      const isHorizontal = Math.abs(offsetX) > Math.abs(offsetY);

      if (isHorizontal) {
        touchX = currentX;
      } else {
        touchY = currentY;
      }

      if (isHorizontal) return;

      if (pendingScrollTargetRef.current) {
        if (!event._virtualHandled) {
          event._virtualHandled = true;
        }
        preventDefaultIfCancelable(event);
        clearTouchInterval();
        return;
      }

      const handled = scrollTouchOffset(offsetY, false, event);
      const prevented = handled && preventDefaultIfCancelable(event);

      clearTouchInterval();

      if (prevented) {
        touchInterval = setInterval(() => {
          offsetY *= touchSmoothRatio;

          const nextOffset = Math.floor(offsetY);
          if (
            !scrollTouchOffset(nextOffset, true) ||
            Math.abs(nextOffset) <= 0.1
          ) {
            clearTouchInterval();
          }
        }, 16);
      }
    }

    function handleTouchEnd() {
      touched = false;
      cleanupTouchEvents();
    }

    cleanupTouchEvents = () => {
      if (touchElement) {
        touchElement.removeEventListener('touchmove', handleTouchMove);
        touchElement.removeEventListener('touchend', handleTouchEnd);
      }
      touchElement = null;
    };

    const handleTouchStart = (event: TouchEvent) => {
      cleanupTouchEvents();

      if (event.touches.length === 1 && !touched) {
        touched = true;
        touchX = Math.ceil(event.touches[0].pageX);
        touchY = Math.ceil(event.touches[0].pageY);
        touchElement = event.target as HTMLElement;
        touchElement.addEventListener('touchmove', handleTouchMove, {
          passive: false,
        });
        touchElement.addEventListener('touchend', handleTouchEnd, {
          passive: true,
        });
      }
    };

    scrollElement.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });

    return () => {
      scrollElement.removeEventListener('touchstart', handleTouchStart);
      cleanupTouchEvents();
      clearTouchInterval();
    };
  }, [inVirtual, scrollByWheel, scrollElement, shouldUseOriginScroll]);

  useIsomorphicLayoutEffect(() => {
    if (!scrollElement || !inVirtual) return undefined;

    let mouseDownLock = false;
    let dragFrame: number | null = null;
    let dragOffset = 0;

    const stopScroll = () => {
      cancelRaf(dragFrame);
      dragFrame = null;
    };

    const continueScroll = () => {
      stopScroll();
      dragFrame = raf(() => {
        syncScrollBy(dragOffset);
        continueScroll();
      });
    };

    const clearDragState = () => {
      mouseDownLock = false;
      stopScroll();
    };

    const handleMouseDown = (
      event: MouseEvent & { _virtualHandled?: boolean },
    ) => {
      if ((event.target as HTMLElement).draggable || event.button !== 0) {
        return;
      }

      if (!event._virtualHandled) {
        event._virtualHandled = true;
        mouseDownLock = true;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseDownLock) return;

      const mouseY = getPageXY(event, false);
      const { top, bottom } = scrollElement.getBoundingClientRect();

      if (mouseY <= top) {
        dragOffset = -getDragScrollOffset(top - mouseY);
        continueScroll();
      } else if (mouseY >= bottom) {
        dragOffset = getDragScrollOffset(mouseY - bottom);
        continueScroll();
      } else {
        stopScroll();
      }
    };

    scrollElement.addEventListener('mousedown', handleMouseDown);
    scrollElement.ownerDocument.addEventListener('mouseup', clearDragState);
    scrollElement.ownerDocument.addEventListener('mousemove', handleMouseMove);
    scrollElement.ownerDocument.addEventListener('dragend', clearDragState);

    return () => {
      scrollElement.removeEventListener('mousedown', handleMouseDown);
      scrollElement.ownerDocument.removeEventListener(
        'mouseup',
        clearDragState,
      );
      scrollElement.ownerDocument.removeEventListener(
        'mousemove',
        handleMouseMove,
      );
      scrollElement.ownerDocument.removeEventListener(
        'dragend',
        clearDragState,
      );
      stopScroll();
    };
  }, [inVirtual, scrollElement, syncScrollBy]);

  const scrollTo = useCallback(
    (options?: TableScrollToOptions | number | null) => {
      if (options === null || options === undefined) return false;

      if (typeof options === 'number') {
        clearPendingScrollTarget();
        syncScrollTop(options);
        return true;
      }

      let targetTop: number | undefined;
      if (isNum(options.top)) {
        targetTop = options.top;
      }

      let targetIndex: number | undefined;
      if (isNum(options.index)) {
        targetIndex = Math.min(
          Math.max(Math.floor(options.index), 0),
          data.length - 1,
        );
      } else if (options.key !== undefined) {
        targetIndex = keyIndexMap.get(options.key);
      }

      let pendingTarget: Omit<PendingScrollTarget, 'syncTimes'> | null = null;
      if (targetIndex !== undefined) {
        const align = options.align ?? 'auto';
        const offset = options.offset ?? 0;
        const alignedTop = getScrollTargetTop(targetIndex, align, offset);

        if (alignedTop !== undefined) {
          targetTop = alignedTop;
          if (shouldSyncScrollTargetAfterMeasure(targetIndex)) {
            pendingTarget = {
              index: targetIndex,
              align,
              offset,
            };
          }
        }
      }

      if (targetTop !== undefined) {
        if (pendingTarget) {
          setPendingScrollTarget(pendingTarget);
        } else {
          clearPendingScrollTarget();
        }
        syncScrollTop(targetTop);
        return true;
      }

      clearPendingScrollTarget();
      if (targetIndex !== undefined) {
        return true;
      }

      return false;
    },
    [
      data.length,
      clearPendingScrollTarget,
      getScrollTargetTop,
      keyIndexMap,
      setPendingScrollTarget,
      shouldSyncScrollTargetAfterMeasure,
      syncScrollTop,
    ],
  );

  return {
    inVirtual,
    estimatedRowHeight,
    scrollHeight,
    offsetTop,
    offsetY,
    visibleStart,
    visibleEnd,
    visibleItems,
    getItemSize,
    setItemRef,
    collectHeight,
    handleScroll,
    scrollTo,
  };
}
