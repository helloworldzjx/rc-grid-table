import { Key } from "react";

import type { ColumnState, ColumnsType } from "../interface";
import { filterSpan, flattenColumnsWithTotalWidth, rebuildColumns } from "./handle";

/**
 * 将总数分配到n个位置，返回第一个位置值和平均值
 * @param total 总数（必须 ≥ 0）
 * @param n 分配数量（必须 ≥ 1）
 */
export const distribute = (
  total: number,
  n: number,
): { first: number; avg: number } => {
  if(total < 0 || n < 1) {
    throw 'param `total` should `total >= 0` or param `n` should `n >= 1`'
  }
  
  const remainder = total % n;
  // total减去余数再除以n得到的一定是整数
  const avg = (total - remainder) / n;
  const result = new Array(n).fill(avg);

  // 剩余余数给第一列
  if (remainder > 0) {
    result[0] += parseFloat(remainder.toFixed(2));
  }
  
  return { first: result[0], avg: avg };
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
): { flattenColumns: ColumnState<T>[], treeColumns: ColumnState<T>[] } {
  // 第一次分配列宽，只是给width没有值的列设置默认宽度
  const { flattenColumns, usedWidthTotal } = flattenColumnsWithTotalWidth(containerWidth, columns as ColumnState<T>[], topMinWidth, leafMinWidth)
  const leafColumns = flattenColumns.filter(column => !column.hasChildren)

  // 剩余未使用的宽度
  const remainingWidth = containerWidth - usedWidthTotal;
  
  // 获取宽度是自动分配的列
  const distributableColumns = leafColumns.filter(column => column.distribute);
  // 所有列都是自动分配的
  const allDistributable = leafColumns.length === distributableColumns.length
  // 所有列都不是自动分配的，即原始列数组的所有列都设置了width
  const unAllDistributable = distributableColumns.length === 0
  // 是否继续分配宽度
  const distributableAgain = allDistributable || unAllDistributable || distributableColumns.length > 0
  // 只要有一列已经手动修改过宽度，则不再继续分配宽度，仅在columnsConfig?.enable为true时生效
  const hasUpdated = leafColumns.length && leafColumns.some((column) => column.updatedWidth)

  if(hasUpdated || remainingWidth <= 0 || !distributableAgain) {
    return {
      flattenColumns: leafColumns,
      treeColumns: rebuildColumns(flattenColumns),
    };
  }

  // 需要重新分配的列
  const cols = unAllDistributable ? leafColumns : distributableColumns
  const count = cols.length

  // 分配剩余宽度
  const { first, avg } = distribute(remainingWidth, count);

  // 合并
  let index = 0;
  const mergedFlattenColumns = flattenColumns.map(column => {
    // 当前列是否重新分配
    const distributable = !column.hasChildren && (column.distribute || unAllDistributable || count === 1)
    if (distributable) {
      const width = column.width as number
      const newWidth = width + (index === 0 ? first : avg);
      // 仅在columnsConfig?.enable为true时生效，所有列都设置width后仍然未占满容器需要继续分配宽度，设置updatedWidth为true
      const updatedWidth = unAllDistributable ? true : column.updatedWidth
      index++;
      return { ...column, width: newWidth, updatedWidth };
    }
    return column;
  });

  return {
    flattenColumns: mergedFlattenColumns.filter(column => !column.hasChildren),
    treeColumns: rebuildColumns(mergedFlattenColumns),
  };
}

export const getMergedSpanKeys = (col: {key: Key, hasChildren?: boolean, colSpan?: number}, flattenColumns: ColumnState[]) => {
  let ks = [col.key]
  let colSpan = col.colSpan
  if(!col.hasChildren && filterSpan(colSpan) && Math.floor(colSpan as number) >= 2) {
    colSpan = Math.floor(colSpan as number)
    const index = flattenColumns.findIndex(((column) => column.key === ks[0]))
    for(let i = index + 1; i < index + 1 + colSpan - 1; i++) {
      ks.push(flattenColumns[i].key)
    }
  }

  return ks
}