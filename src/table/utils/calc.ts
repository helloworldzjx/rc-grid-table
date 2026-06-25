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

  // 剩余未使用的宽度
  const remainingWidth = containerWidth - usedWidthTotal;

  // 获取宽度是自动分配的列
  const resizeEnabledLeafColumns = filterResizeEnabledColumns(leafColumns);
  const distributableColumns = resizeEnabledLeafColumns.filter(
    (column) => column.distribute,
  );
  // 所有列都是自动分配的
  const allDistributable =
    resizeEnabledLeafColumns.length === distributableColumns.length;
  // 所有列都不是自动分配的，即原始列数组的所有列都设置了width
  const unAllDistributable = distributableColumns.length === 0;
  // 是否继续分配宽度
  const distributableAgain =
    allDistributable || unAllDistributable || distributableColumns.length > 0;
  // 只要有一列的宽度是锁定的，则不再继续分配宽度，仅在columnsConfig?.enable为true时生效
  const hasAutoWidthLocked =
    leafColumns.length && leafColumns.some((column) => column.autoWidthLocked);

  if (hasAutoWidthLocked || remainingWidth <= 0 || !distributableAgain) {
    return {
      flattenColumns: leafColumns,
      treeColumns: rebuildColumns(flattenColumns),
    };
  }

  // 需要重新分配的列
  const cols = unAllDistributable
    ? resizeEnabledLeafColumns
    : distributableColumns;

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
  const mergedFlattenColumns = flattenColumns.map((column) => {
    // 当前列是否重新分配
    const distributable =
      !column.hasChildren &&
      !column.resizeDisabled &&
      (column.distribute || unAllDistributable || leafColumns.length === 1);

    if (distributable) {
      const width = column.width as number;
      const newWidth = width + values[index];
      // 仅在columnsConfig?.enable为true时生效，所有列都设置width后仍然未占满容器需要继续分配宽度，设置autoWidthLocked为true
      const autoWidthLocked = unAllDistributable
        ? true
        : column.autoWidthLocked;

      index++;
      return { ...column, width: newWidth, autoWidthLocked };
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
