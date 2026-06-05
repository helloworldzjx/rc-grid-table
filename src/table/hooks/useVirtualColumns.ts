import { useMemo } from 'react';

import { SCROLLBAR_VISIBLE_TOLERANCE } from '../../_utils/const';
import { isNum } from '../../_utils/validate';
import type { ColumnState, TableVirtualConfig } from '../interface';

export type VirtualRenderColumn<T = any> = {
  column: ColumnState<T>;
  columnIndex: number;
};

export interface VirtualColumnsState<T = any> {
  inVirtual: boolean;
  columns: VirtualRenderColumn<T>[];
  columnIndexSet: Set<number>;
  shouldRenderColumnRange: (colStart: number, colEnd?: number) => boolean;
}

interface UseVirtualColumnsProps<T = any> {
  flattenColumns: ColumnState<T>[];
  flattenColumnsWidths: number[];
  containerWidth: number;
  columnsWidthTotal: number;
  scrollLeft: number;
  hasHorizontal: boolean;
  virtual?: boolean | TableVirtualConfig;
  disabled?: boolean;
}

const getColumnOverscan = (
  virtual: UseVirtualColumnsProps['virtual'],
  containerWidth: number,
) => {
  const config = typeof virtual === 'object' ? virtual : {};
  const overscan = config.columnOverscan;

  return isNum(overscan) ? Math.max(overscan, 0) : containerWidth;
};

const getFullVirtualColumnsState = <T>(
  flattenColumns: ColumnState<T>[],
): VirtualColumnsState<T> => {
  const indexes = flattenColumns.map((_, index) => index);
  const columnIndexSet = new Set(indexes);

  return {
    inVirtual: false,
    columns: flattenColumns.map((column, columnIndex) => ({
      column,
      columnIndex,
    })),
    columnIndexSet,
    shouldRenderColumnRange: () => true,
  };
};

export default function useVirtualColumns<T = any>({
  flattenColumns,
  flattenColumnsWidths,
  containerWidth,
  columnsWidthTotal,
  scrollLeft,
  hasHorizontal,
  virtual = true,
  disabled = false,
}: UseVirtualColumnsProps<T>): VirtualColumnsState<T> {
  return useMemo(() => {
    if (
      disabled ||
      virtual === false ||
      !hasHorizontal ||
      containerWidth <= 0 ||
      columnsWidthTotal - containerWidth <= SCROLLBAR_VISIBLE_TOLERANCE ||
      !flattenColumns.length
    ) {
      return getFullVirtualColumnsState(flattenColumns);
    }

    const nonFixedColumns = flattenColumns.filter((column) => !column.fixed);
    if (!nonFixedColumns.length) {
      return getFullVirtualColumnsState(flattenColumns);
    }

    const columnOverscan = getColumnOverscan(virtual, containerWidth);
    const rangeStart = Math.max(scrollLeft - columnOverscan, 0);
    const rangeEnd = scrollLeft + containerWidth + columnOverscan;
    const renderIndexSet = new Set<number>();

    let offsetLeft = 0;
    flattenColumns.forEach((column, columnIndex) => {
      const width = flattenColumnsWidths[columnIndex] ?? column.width ?? 0;
      const columnWidth = isNum(width) ? width : 0;
      const columnStart = offsetLeft;
      const columnEnd = columnStart + columnWidth;
      const inRange =
        columnEnd >= rangeStart - SCROLLBAR_VISIBLE_TOLERANCE &&
        columnStart <= rangeEnd + SCROLLBAR_VISIBLE_TOLERANCE;

      if (column.fixed || inRange) {
        renderIndexSet.add(columnIndex);
      }

      offsetLeft += columnWidth;
    });

    if (renderIndexSet.size === flattenColumns.length) {
      return getFullVirtualColumnsState(flattenColumns);
    }

    const shouldRenderColumnRange = (colStart: number, colEnd = colStart) => {
      const start = Math.max(Math.floor(colStart), 0);
      const end = Math.min(Math.floor(colEnd), flattenColumns.length - 1);

      for (let index = start; index <= end; index += 1) {
        if (renderIndexSet.has(index) || flattenColumns[index]?.fixed) {
          return true;
        }
      }

      return false;
    };

    return {
      inVirtual: true,
      columns: flattenColumns.reduce<VirtualRenderColumn<T>[]>(
        (result, column, columnIndex) => {
          if (renderIndexSet.has(columnIndex)) {
            result.push({ column, columnIndex });
          }

          return result;
        },
        [],
      ),
      columnIndexSet: renderIndexSet,
      shouldRenderColumnRange,
    };
  }, [
    columnsWidthTotal,
    containerWidth,
    disabled,
    flattenColumns,
    flattenColumnsWidths,
    hasHorizontal,
    scrollLeft,
    virtual,
  ]);
}
