import { Key } from 'react';

import { ColumnState } from '../interface';

const getColumnKey = <T = any>(column: ColumnState<T>, index: number) =>
  column.key || column.dataIndex || index;

function completeColumnState<T = any>(
  column: ColumnState<T>,
  children: ColumnState[] = column.children || [],
): ColumnState {
  return {
    ...column,
    visible: column.visible ?? true,
    distribute: column.resizeDisabled ? false : column.distribute ?? false,
    updatedWidth: column.resizeDisabled ? false : !!column.updatedWidth,
    hasChildren: children.length > 0,
    children,
  } as ColumnState;
}

function createKeyMap<T = any>(
  columns: ColumnState<T>[],
): Map<Key, ColumnState<T>> {
  const map = new Map<Key, ColumnState<T>>();
  const traverse = (cols: ColumnState<T>[]) => {
    cols.forEach((column, index) => {
      map.set(getColumnKey(column, index), column);
      if (column.children?.length) traverse(column.children);
    });
  };
  traverse(columns);
  return map;
}

function normalizeColumnsOrder<T = any>(
  columns: ColumnState<T>[],
  storedColumns: ColumnState[] = [],
) {
  const storedSiblingKeySet = new Set<Key>(
    storedColumns.map((column, index) => getColumnKey(column, index)),
  );
  const placedColumns = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => storedSiblingKeySet.has(column.key as Key))
    .sort((a, b) => {
      const orderDiff =
        (a.column.order ?? a.index) - (b.column.order ?? b.index);
      return orderDiff || a.index - b.index;
    })
    .map(({ column }) => column);
  const placedKeySet = new Set<Key>(
    placedColumns.map((column) => column.key as Key),
  );

  columns.forEach((column, index) => {
    if (storedSiblingKeySet.has(column.key as Key)) return;

    let anchorKey: Key | undefined;
    for (let i = index - 1; i >= 0; i--) {
      const prevKey = columns[i].key as Key;
      if (placedKeySet.has(prevKey)) {
        anchorKey = prevKey;
        break;
      }
    }

    const insertIndex =
      anchorKey === undefined
        ? 0
        : placedColumns.findIndex((item) => item.key === anchorKey) + 1;
    placedColumns.splice(insertIndex, 0, column);
    placedKeySet.add(column.key as Key);
  });

  const orderMap = new Map<Key, number>();
  placedColumns.forEach((column, order) => {
    orderMap.set(column.key as Key, order);
  });

  return columns.map((column) => {
    const order = orderMap.get(column.key as Key) ?? column.order;
    return order === column.order ? column : { ...column, order };
  });
}

function mergeColumnsStateInternal<T = any>(
  a: ColumnState<T>[],
  b: ColumnState[],
): ColumnState[] {
  const bKeyMap = createKeyMap(b);
  const mergeColumn = (column: ColumnState<T>): ColumnState => {
    const bColumn = bKeyMap.get(column.key as Key);
    if (!bColumn) {
      const children = column.children?.length
        ? mergeColumnsStateInternal(column.children, [])
        : [];
      return completeColumnState(column, children);
    }

    const merged: ColumnState = {
      ...column,
      ...JSON.parse(JSON.stringify(bColumn)), // 冲突时优先采用b的数据
      key: column.key,
      parentKey: column.parentKey,
      ancestorKeys: column.ancestorKeys,
      title: column.title,
      resizeDisabled: column.resizeDisabled,
      dragSortDisabled: column.dragSortDisabled,
    };

    if (column.resizeDisabled && !column.hasChildren) {
      merged.width = column.width;
      merged.updatedWidth = false;
    }

    const children =
      column.children?.length || bColumn.children?.length
        ? mergeColumnsStateInternal(
            column.children || [],
            bColumn.children || [],
          )
        : [];

    return completeColumnState(merged, children);
  };
  const mergedColumns = a.map((column) => mergeColumn(column));
  return normalizeColumnsOrder(mergedColumns, b);
}

/**
 * 将传入组件的columns数据和存储中的columnsState数据进行合并
 * @param a 组件columns参数
 * @param b middleState
 * @returns a和b合并后的columnsState
 */
export function mergeColumnsState<T = any>(
  a: ColumnState<T>[],
  b: ColumnState[],
): ColumnState[] {
  return mergeColumnsStateInternal(a, b);
}
