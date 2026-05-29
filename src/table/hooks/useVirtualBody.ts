import { useIsomorphicLayoutEffect } from 'ahooks';
import {
  Key,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { isNum } from '../../_utils/validate';
import type { SizeType, TableScrollToOptions } from '../interface';
import { getDefaultInternalColumnWidth } from '../utils/const';

export type VirtualItem<ItemType = unknown> = {
  key: Key;
  item: ItemType;
};

interface UseVirtualBodyProps<ItemType> {
  data: VirtualItem<ItemType>[];
  scrollElement?: HTMLDivElement | null;
  scrollY?: number;
  virtual?: boolean | { itemHeight?: number; overscan?: number };
  size?: SizeType;
  onScrollTopChange?: (scrollTop: number) => void;
}

const getDefaultItemHeight = getDefaultInternalColumnWidth;

const getVirtualConfig = (
  virtual: UseVirtualBodyProps<unknown>['virtual'],
  size: SizeType | undefined,
  scrollY: number | undefined,
) => {
  const config = typeof virtual === 'object' ? virtual : {};
  const itemHeight = Math.max(
    1,
    config.itemHeight ?? getDefaultItemHeight(size),
  );
  const overscan =
    isNum(config.overscan) && config.overscan >= 0
      ? Math.floor(config.overscan)
      : Math.ceil((scrollY || 0) / itemHeight);

  return {
    itemHeight,
    overscan: Math.max(1, overscan),
  };
};

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

export default function useVirtualBody<ItemType>({
  data,
  scrollElement,
  scrollY,
  virtual = true,
  size,
  onScrollTopChange,
}: UseVirtualBodyProps<ItemType>) {
  const { itemHeight, overscan } = useMemo(
    () => getVirtualConfig(virtual, size, scrollY),
    [scrollY, size, virtual],
  );
  const useVirtual =
    virtual !== false &&
    isNum(scrollY) &&
    scrollY > 0 &&
    data.length > 0 &&
    itemHeight > 0;
  const [offsetTop, setOffsetTop] = useState(0);
  const [heightUpdateMark, setHeightUpdateMark] = useState(0);
  const heightsRef = useRef(new Map<Key, number>());
  const instancesRef = useRef(new Map<Key, HTMLElement>());
  const changedHeightsRef = useRef(new Map<Key, number | undefined>());
  const collectFrameRef = useRef<number | null>(null);
  const scrollTopRef = useRef(0);

  const keyIndexMap = useMemo(() => {
    const map = new Map<Key, number>();
    data.forEach(({ key }, index) => {
      map.set(key, index);
    });
    return map;
  }, [data]);

  const heights = heightsRef.current;

  const getItemHeight = useCallback(
    (key: Key) => heights.get(key) ?? itemHeight,
    [heights, itemHeight],
  );

  const prefixHeights = useMemo(() => {
    const list: number[] = [0];
    data.forEach(({ key }, index) => {
      list[index + 1] = list[index] + getItemHeight(key);
    });
    return list;
  }, [data, getItemHeight, heightUpdateMark]);

  const scrollHeight = prefixHeights[prefixHeights.length - 1] || 0;
  const inVirtual = useVirtual && scrollHeight > (scrollY || 0);
  const maxScrollTop = Math.max(scrollHeight - (scrollY || 0), 0);

  const keepInRange = useCallback(
    (top: number) => Math.min(Math.max(top, 0), maxScrollTop),
    [maxScrollTop],
  );

  const syncScrollTop = useCallback(
    (top: number | ((prev: number) => number), trigger = true) => {
      const rawTop =
        typeof top === 'function' ? top(scrollTopRef.current) : top;
      const nextTop = keepInRange(rawTop);
      scrollTopRef.current = nextTop;
      setOffsetTop(nextTop);

      if (scrollElement && scrollElement.scrollTop !== nextTop) {
        scrollElement.scrollTop = nextTop;
      }
      if (trigger) {
        onScrollTopChange?.(nextTop);
      }
    },
    [keepInRange, onScrollTopChange, scrollElement],
  );

  useIsomorphicLayoutEffect(() => {
    scrollTopRef.current = keepInRange(scrollTopRef.current);
    if (scrollTopRef.current !== offsetTop) {
      setOffsetTop(scrollTopRef.current);
    }
    if (
      scrollElement &&
      isNum(scrollElement.scrollTop) &&
      scrollElement.scrollTop !== scrollTopRef.current
    ) {
      scrollElement.scrollTop = scrollTopRef.current;
    }
  }, [keepInRange, scrollElement, offsetTop]);

  const collectHeight = useCallback(
    (sync = false) => {
      cancelRaf(collectFrameRef.current);

      const doCollect = () => {
        collectFrameRef.current = null;
        let changed = false;

        instancesRef.current.forEach((element, key) => {
          if (!element || !element.offsetParent) return;

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
    [],
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
    };
  }, []);

  let start = 0;
  let end = data.length - 1;
  let offsetY = 0;

  if (inVirtual) {
    const top = offsetTop;
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
    () => (inVirtual ? data.slice(start, end + 1) : data),
    [data, end, inVirtual, start],
  );

  useIsomorphicLayoutEffect(() => {
    const changedRecord = changedHeightsRef.current;
    if (changedRecord.size === 1 && inVirtual) {
      const [changedKey, previousHeight] = Array.from(
        changedRecord.entries(),
      )[0];
      const startKey = data[visibleStart]?.key;

      if (changedKey === startKey && previousHeight === undefined) {
        const nextHeight = heightsRef.current.get(changedKey);
        if (isNum(nextHeight)) {
          syncScrollTop((top) => top + nextHeight - itemHeight, false);
        }
      }
    }

    changedRecord.clear();
  }, [data, heightUpdateMark, inVirtual, itemHeight, syncScrollTop, visibleStart]);

  const handleScroll = useCallback(
    (scrollTop: number) => {
      if (!inVirtual) {
        scrollTopRef.current = scrollTop;
        setOffsetTop(scrollTop);
        return;
      }
      syncScrollTop(scrollTop);
    },
    [inVirtual, syncScrollTop],
  );

  const scrollTo = useCallback(
    (options?: TableScrollToOptions | number | null) => {
      if (options === null || options === undefined) return false;

      if (typeof options === 'number') {
        syncScrollTop(options);
        return true;
      }

      let targetTop: number | undefined;
      if (isNum(options.top)) {
        targetTop = options.top;
      }

      let targetIndex: number | undefined;
      if (isNum(options.index)) {
        targetIndex = Math.min(Math.max(Math.floor(options.index), 0), data.length - 1);
      } else if (options.key !== undefined) {
        targetIndex = keyIndexMap.get(options.key);
      }

      if (targetIndex !== undefined) {
        const align = options.align ?? 'auto';
        const offset = options.offset ?? 0;
        const itemTop = prefixHeights[targetIndex] || 0;
        const itemBottom = prefixHeights[targetIndex + 1] || itemTop + itemHeight;
        const viewTop = scrollTopRef.current;
        const viewBottom = viewTop + (scrollY || 0);

        if (align === 'top') {
          targetTop = itemTop - offset;
        } else if (align === 'bottom') {
          targetTop = itemBottom - (scrollY || 0) + offset;
        } else if (itemTop < viewTop) {
          targetTop = itemTop - offset;
        } else if (itemBottom > viewBottom) {
          targetTop = itemBottom - (scrollY || 0) + offset;
        }
      }

      if (targetTop !== undefined) {
        syncScrollTop(targetTop);
        return true;
      }

      return false;
    },
    [data.length, itemHeight, keyIndexMap, prefixHeights, scrollY, syncScrollTop],
  );

  return {
    inVirtual,
    itemHeight,
    scrollHeight,
    offsetTop,
    offsetY,
    visibleStart,
    visibleEnd,
    visibleItems,
    setItemRef,
    collectHeight,
    handleScroll,
    scrollTo,
  };
}
