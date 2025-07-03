import { Key } from "react";

import { ColumnState } from "../interface";

/**
 * 将传入组件的columns数据和存储中的columnsState数据进行合并
 * @param a 组件columns参数
 * @param b middleState
 * @returns a和b合并后的columnsState
 */
export function mergeColumnsState<T = any>(a: ColumnState<T>[], b: ColumnState[]): ColumnState[] {
  const bKeyMap = createKeyMap(b);
  return a.map(column => mergeColumn(column, bKeyMap));
}

function mergeColumn<T = any>(column: ColumnState<T>, bKeyMap: Map<Key, ColumnState>): ColumnState {
  const bColumn = bKeyMap.get(column.key as Key);
  if (!bColumn) return JSON.parse(JSON.stringify(column));

  const merged: ColumnState = {
    ...column,
    ...JSON.parse(JSON.stringify(bColumn)), // 冲突时优先采用b的数据
    key: column.key,
    parentKey: column.parentKey,
    title: column.title,
  };

  if (column.children?.length || bColumn.children?.length) {
    const aChildren = column.children || [];
    const bChildren = bColumn.children || [];
    merged.children = mergeColumnsState(aChildren, bChildren);
  }

  return merged;
}

function createKeyMap<T = any>(columns: ColumnState<T>[]): Map<Key, ColumnState<T>> {
  const map = new Map<Key, ColumnState<T>>();
  const traverse = (cols: ColumnState<T>[]) => {
    cols.forEach((column, index) => {
      map.set(column.key || column.dataIndex || index, column);
      if (column.children?.length) traverse(column.children);
    });
  };
  traverse(columns);
  return map;
}