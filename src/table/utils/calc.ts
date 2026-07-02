import { Key } from 'react';

import { isNum } from '../../_utils/validate';
import type { ColumnsType, SizeType } from '../interface';
import type { InternalColumnState } from '../internalInterface';
import {
  filterSpan,
  FlattenColumnsOptions,
  flattenColumnsWithTotalWidth,
  rebuildColumns,
} from './handle';

/**
 * 将总数分配到n个位置，返回数组
 * @param total 总数（必须 ≥ 0）
 * @param n 分配数量（必须 ≥ 1）
 */
export const distribute = (total: number, n: number) => {
  if (total < 0 || n < 1) {
    throw 'param `total` should `total >= 0` or param `n` should `n >= 1`';
  }

  const avg = Math.floor(total / n);
  const remainder = parseFloat((total - avg * n).toFixed(2));
  const integerRemainder = Math.floor(remainder);
  const decimalRemainder = parseFloat(
    (remainder - integerRemainder).toFixed(2),
  );

  const result = new Array<number>(n).fill(avg);

  // 余数按列依次分摊
  for (let index = 0; index < integerRemainder; index += 1) {
    result[index] += 1;
  }

  if (decimalRemainder > 0) {
    result[integerRemainder] += decimalRemainder;
  }

  return result;
};

export const filterResizeEnabledColumns = <
  T extends { resizeDisabled?: boolean },
>(
  columns: T[],
) => {
  return columns.filter((column) => !column.resizeDisabled);
};

/**
 * 调整表格列宽度
 * @param containerWidth 容器总宽度
 * @param columns 原始列数组
 * @param topMinWidth 顶层列最小宽度
 * @param leafMinWidth 叶子列最小宽度
 * @returns 调整后的列数组
 */
export function columnsWidthDistribute<T>(
  containerWidth: number,
  columns: ColumnsType<T>,
  topMinWidth: number,
  leafMinWidth: number,
  size?: SizeType,
  options?: FlattenColumnsOptions,
): {
  flattenColumns: InternalColumnState<T>[];
  treeColumns: InternalColumnState<T>[];
} {
  // 第一次分配列宽，只是给width没有值的列设置默认宽度
  const { flattenColumns, usedWidthTotal } = flattenColumnsWithTotalWidth(
    containerWidth,
    columns as InternalColumnState<T>[],
    topMinWidth,
    leafMinWidth,
    size,
    options,
  );
  const leafColumns = flattenColumns.filter((column) => !column.hasChildren);

  // 宽度已锁定表示之前的用户操作已经消费过剩余宽度，本轮不能再次二次分配。
  const hasAutoWidthLocked =
    leafColumns.length && leafColumns.some((column) => column.autoWidthLocked);

  // 剩余未使用的宽度
  const remainingWidth = containerWidth - usedWidthTotal;

  // 有一列的宽度是锁定的或没有剩余宽度，则不再继续分配宽度
  if (hasAutoWidthLocked || remainingWidth <= 0) {
    return {
      flattenColumns: leafColumns,
      treeColumns: rebuildColumns(flattenColumns),
    };
  }

  const resizeEnabledLeafColumns = filterResizeEnabledColumns(leafColumns);
  // 获取宽度是自动分配的列
  const distributableColumns = resizeEnabledLeafColumns.filter(
    (column) => column.distribute,
  );
  // 所有列都是自动分配的
  const allDistributable =
    resizeEnabledLeafColumns.length === distributableColumns.length;
  // 所有列都不是自动分配的，即原始列数组的所有列都设置了width
  const unAllDistributable = distributableColumns.length === 0;

  // 需要二次分配的列
  let cols = distributableColumns;
  if (leafColumns.length === 1) {
    cols = leafColumns;
  } else if (allDistributable || unAllDistributable) {
    cols = resizeEnabledLeafColumns;
  }

  if (!cols.length) {
    return {
      flattenColumns: leafColumns,
      treeColumns: rebuildColumns(flattenColumns),
    };
  }

  // 分配剩余宽度
  const values = distribute(remainingWidth, cols.length);

  // 合并
  let index = 0;
  const targetColumnKeys = new Set(cols.map((column) => column.key));
  const mergedFlattenColumns = flattenColumns.map((column) => {
    // 当前列是否二次分配
    const distributable = targetColumnKeys.has(column.key);

    if (distributable) {
      const width = column.width as number;
      const newWidth = width + values[index];
      index++;
      return { ...column, width: newWidth };
    }

    return column;
  });

  return {
    flattenColumns: mergedFlattenColumns.filter(
      (column) => !column.hasChildren,
    ),
    treeColumns: rebuildColumns(mergedFlattenColumns),
  };
}

export const getMergedSpanKeys = (
  col: { key: Key; hasChildren?: boolean; colSpan?: number },
  flattenColumns: InternalColumnState[],
) => {
  let ks = [col.key];
  let colSpan = col.colSpan;
  if (
    !col.hasChildren &&
    isNum(colSpan) &&
    filterSpan(colSpan) &&
    Math.floor(colSpan) >= 2
  ) {
    colSpan = Math.floor(colSpan);
    const index = flattenColumns.findIndex((column) => column.key === ks[0]);
    if (index === -1) return ks;

    for (let i = index + 1; i < index + 1 + colSpan - 1; i++) {
      ks.push(flattenColumns[i].key);
    }
  }

  return ks;
};
