import React, { useCallback, useMemo } from 'react';

import { isNum } from '../../../_utils/validate';
import type {
  ColumnState,
  SizeType,
  TableScrollToOptions,
  TableVirtualConfig,
} from '../../interface';
import { getCellSpan } from '../../utils/handle';
import { getVirtualFixedHeightConfig } from '../../utils/virtual';
import type {
  BodyItem,
  BodyItemRenderer,
  BodyRowItem,
  TableVirtualBodyController,
} from '../interface';
import VirtualBody, { VirtualRowSpanItem } from './VirtualBody';
import useVirtualBody from './useVirtualBody';

interface UseTableVirtualBodyProps<T = any> {
  bodyItems: BodyItem<T>[];
  flattenDataLength: number;
  flattenColumns: ColumnState<T>[];
  preserveItemKey?: React.Key | null;
  scrollElement?: HTMLDivElement | null;
  scrollY?: number;
  virtual?: boolean | TableVirtualConfig;
  size?: SizeType;
  onBodyScroll: React.UIEventHandler<HTMLDivElement>;
  scrollBodyTo: (options?: ScrollToOptions) => void;
  scrollBodyToTop: () => void;
  extraUpdateDeps?: unknown[];
}

const isBodyRowItem = <T,>(item: BodyItem<T>): item is BodyRowItem<T> =>
  item.type === 'row';

export default function useTableVirtualBody<T = any>({
  bodyItems,
  flattenDataLength,
  flattenColumns,
  preserveItemKey,
  scrollElement,
  scrollY,
  virtual = true,
  size,
  onBodyScroll,
  scrollBodyTo,
  scrollBodyToTop,
  extraUpdateDeps = [],
}: UseTableVirtualBodyProps<T>): TableVirtualBodyController<T> {
  const {
    rowHeight: fixedRowHeight,
    expandedRowHeight: fixedExpandedRowHeight,
  } = useMemo(() => getVirtualFixedHeightConfig(virtual), [virtual]);

  const virtualData = useMemo(
    () =>
      bodyItems.map((item) => ({
        key: item.key,
        item,
      })),
    [bodyItems],
  );

  const getItemFixedHeight = useCallback(
    (item: BodyItem<T>) => {
      if (item.type === 'row') {
        return fixedRowHeight;
      }

      return fixedExpandedRowHeight;
    },
    [fixedExpandedRowHeight, fixedRowHeight],
  );

  const {
    inVirtual,
    scrollHeight,
    offsetY,
    visibleStart,
    visibleEnd,
    visibleItems,
    getItemSize,
    setItemRef,
    collectHeight,
    handleScroll,
    scrollTo: scrollVirtualTo,
  } = useVirtualBody({
    data: virtualData,
    scrollElement,
    scrollY,
    virtual,
    size,
    getItemFixedHeight,
  });

  const preservedItem = useMemo(() => {
    if (
      !inVirtual ||
      preserveItemKey === null ||
      preserveItemKey === undefined
    ) {
      return null;
    }

    const rendered = visibleItems.some(({ key }) => key === preserveItemKey);
    if (rendered) {
      return null;
    }

    const item = virtualData.find(({ key }) => key === preserveItemKey);
    if (!item) {
      return null;
    }

    return {
      ...item,
      top: getItemSize(preserveItemKey).top,
    };
  }, [getItemSize, inVirtual, preserveItemKey, virtualData, visibleItems]);

  const rowItemIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    bodyItems.forEach((item, index) => {
      if (isBodyRowItem(item)) {
        map.set(item.rowIndex, index);
      }
    });
    return map;
  }, [bodyItems]);

  const rowLastItemIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    bodyItems.forEach((item, index) => {
      map.set(item.rowIndex, index);
    });
    return map;
  }, [bodyItems]);

  const getRowSpan = useCallback(
    (columnIndex: number, rowIndex: number) => {
      const bodyItemIndex = rowItemIndexMap.get(rowIndex);
      const bodyItem = !isNum(bodyItemIndex)
        ? undefined
        : bodyItems[bodyItemIndex];

      if (!bodyItem || !isBodyRowItem(bodyItem)) {
        return 1;
      }

      return getCellSpan(
        flattenColumns[columnIndex]?.onCell?.(
          bodyItem.record,
          bodyItem.rowIndex,
        )?.rowSpan,
      );
    },
    [bodyItems, flattenColumns, rowItemIndexMap],
  );

  const rowSpanItems = useMemo<VirtualRowSpanItem<T>[]>(() => {
    if (!inVirtual || !bodyItems.length || !flattenColumns.length) {
      return [];
    }

    const columnIndexes = flattenColumns.map((_, columnIndex) => columnIndex);

    const visibleRowIndexes = bodyItems
      .slice(visibleStart, visibleEnd + 1)
      .filter(isBodyRowItem)
      .map((item) => item.rowIndex);

    if (!visibleRowIndexes.length) {
      return [];
    }

    let startRowIndex = Math.min(...visibleRowIndexes);
    let endRowIndex = Math.max(...visibleRowIndexes);

    let firstRowSpanColumns = columnIndexes.filter(
      (columnIndex) => getRowSpan(columnIndex, startRowIndex) === 0,
    );

    for (let rowIndex = startRowIndex; rowIndex >= 0; rowIndex -= 1) {
      firstRowSpanColumns = firstRowSpanColumns.filter(
        (columnIndex) => getRowSpan(columnIndex, rowIndex) === 0,
      );
      if (!firstRowSpanColumns.length) {
        startRowIndex = rowIndex;
        break;
      }
    }

    let lastRowSpanColumns = columnIndexes.filter(
      (columnIndex) => getRowSpan(columnIndex, endRowIndex) !== 1,
    );

    for (
      let rowIndex = endRowIndex;
      rowIndex < flattenDataLength;
      rowIndex += 1
    ) {
      lastRowSpanColumns = lastRowSpanColumns.filter(
        (columnIndex) => getRowSpan(columnIndex, rowIndex) !== 1,
      );
      if (!lastRowSpanColumns.length) {
        endRowIndex = Math.max(rowIndex - 1, endRowIndex);
        break;
      }
    }

    const items: VirtualRowSpanItem<T>[] = [];

    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
      const bodyItemIndex = rowItemIndexMap.get(rowIndex);
      const bodyItem = !isNum(bodyItemIndex)
        ? undefined
        : bodyItems[bodyItemIndex];

      if (
        !bodyItem ||
        !isBodyRowItem(bodyItem) ||
        !columnIndexes.some(
          (columnIndex) => getRowSpan(columnIndex, rowIndex) > 1,
        )
      ) {
        continue;
      }

      const sourceSize = getItemSize(bodyItem.key);
      items.push({
        bodyItem,
        top: sourceSize.top,
        getHeight: (rowSpan: number) => {
          const endRowIndex = Math.min(
            bodyItem.rowIndex + rowSpan - 1,
            flattenDataLength - 1,
          );
          const endBodyItemIndex = rowLastItemIndexMap.get(endRowIndex);
          const endBodyItem = !isNum(endBodyItemIndex)
            ? undefined
            : bodyItems[endBodyItemIndex];

          if (fixedRowHeight !== undefined && isNum(endBodyItemIndex)) {
            const startIndex = rowItemIndexMap.get(bodyItem.rowIndex);
            if (isNum(startIndex)) {
              return bodyItems
                .slice(startIndex, endBodyItemIndex + 1)
                .reduce((total, item) => {
                  const fixedHeight = getItemFixedHeight(item);
                  if (fixedHeight !== undefined) {
                    return total + fixedHeight;
                  }

                  const size = getItemSize(item.key);
                  return total + size.bottom - size.top;
                }, 0);
            }

            return rowSpan * fixedRowHeight;
          }

          if (!endBodyItem) {
            return sourceSize.bottom - sourceSize.top;
          }

          const size = getItemSize(bodyItem.key, endBodyItem.key);
          return size.bottom - size.top;
        },
      });
    }

    return items;
  }, [
    bodyItems,
    flattenColumns,
    flattenDataLength,
    fixedExpandedRowHeight,
    fixedRowHeight,
    getItemFixedHeight,
    getItemSize,
    getRowSpan,
    inVirtual,
    rowItemIndexMap,
    rowLastItemIndexMap,
    visibleEnd,
    visibleStart,
  ]);

  const handleBodyScroll = useCallback<React.UIEventHandler<HTMLDivElement>>(
    (event) => {
      onBodyScroll(event);
      handleScroll(event.currentTarget.scrollTop);
    },
    [handleScroll, onBodyScroll],
  );

  const handleVerticalScroll = useCallback(
    (scrollTop: number) => {
      if (!inVirtual) {
        return undefined;
      }

      handleScroll(scrollTop, false);
      return true;
    },
    [handleScroll, inVirtual],
  );

  const scrollTo = useCallback(
    (options?: TableScrollToOptions | number | null) => {
      if (
        inVirtual &&
        options &&
        typeof options === 'object' &&
        (options.top !== undefined ||
          options.index !== undefined ||
          options.key !== undefined)
      ) {
        const virtualOptions = { ...options };
        if (options.key !== undefined) {
          virtualOptions.key = `row-${options.key}`;
        }
        if (options.index !== undefined) {
          const targetRowIndex = Math.floor(options.index);
          const targetItemIndex = bodyItems.findIndex(
            (item) => isBodyRowItem(item) && item.rowIndex === targetRowIndex,
          );
          if (targetItemIndex >= 0) {
            virtualOptions.index = targetItemIndex;
          }
        }

        if (scrollVirtualTo(virtualOptions)) {
          if (options.left !== undefined) {
            scrollBodyTo({ left: options.left });
          }
          return;
        }
      }

      if (inVirtual && typeof options === 'number') {
        scrollVirtualTo(options);
        return;
      }

      if (typeof options === 'number') {
        scrollBodyTo({ top: options });
        return;
      }

      scrollBodyTo((options || undefined) as ScrollToOptions | undefined);
    },
    [bodyItems, inVirtual, scrollBodyTo, scrollVirtualTo],
  );

  const scrollToTop = useCallback(() => {
    if (inVirtual) {
      scrollVirtualTo(0);
      return;
    }

    scrollBodyToTop();
  }, [inVirtual, scrollBodyToTop, scrollVirtualTo]);

  const bodyStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (isNum(scrollY) && scrollY > 0) {
      return inVirtual
        ? { height: scrollY, maxHeight: scrollY }
        : { maxHeight: scrollY };
    }

    return undefined;
  }, [inVirtual, scrollY]);

  const updateDeps = useMemo(
    () => [
      ...extraUpdateDeps,
      bodyItems.length,
      scrollY,
      inVirtual,
      scrollHeight,
    ],
    [bodyItems.length, extraUpdateDeps, inVirtual, scrollHeight, scrollY],
  );

  const render = useCallback(
    (renderBodyItem: BodyItemRenderer<T>) => (
      <VirtualBody
        bodyItems={bodyItems}
        inVirtual={inVirtual}
        scrollHeight={scrollHeight}
        offsetY={offsetY}
        visibleItems={visibleItems}
        preservedItem={preservedItem}
        rowSpanItems={rowSpanItems}
        renderBodyItem={renderBodyItem}
        setItemRef={setItemRef}
        onItemResize={collectHeight}
      />
    ),
    [
      bodyItems,
      collectHeight,
      inVirtual,
      offsetY,
      rowSpanItems,
      scrollHeight,
      setItemRef,
      visibleItems,
      preservedItem,
    ],
  );

  return {
    inVirtual,
    scrollHeight,
    bodyStyle,
    updateDeps,
    handleBodyScroll,
    handleVerticalScroll: inVirtual ? handleVerticalScroll : undefined,
    scrollTo,
    scrollToTop,
    render,
  };
}
