import { Key } from 'react';

import { ColumnState } from '../interface';
import { findNodeByKey, replaceTreeNode } from './handle';

export type SortablePlacement = 'start' | 'end';

const hasIntersect = (a: Key[], b: Key[]) => {
  const bSet = new Set(b);
  return a.some((key) => bSet.has(key));
};

export function reorderColumnsState(
  columnsState: ColumnState[],
  parentKey: Key,
  activeKeys: Key[],
  overKeys: Key[],
  placement: SortablePlacement,
) {
  if (
    !columnsState.length ||
    !activeKeys.length ||
    !overKeys.length ||
    hasIntersect(activeKeys, overKeys)
  ) {
    return null;
  }

  const parent =
    parentKey === ''
      ? { children: columnsState }
      : findNodeByKey(columnsState, parentKey);
  const children = parent?.children || [];
  const activeKeySet = new Set(activeKeys);
  const overKeySet = new Set(overKeys);

  const activeColumns = children.filter((column) =>
    activeKeySet.has(column.key),
  );
  const overColumns = children.filter((column) => overKeySet.has(column.key));
  if (
    activeColumns.length !== activeKeys.length ||
    overColumns.length !== overKeys.length
  ) {
    return null;
  }

  const sortedChildren = [...children].sort((a, b) => a.order - b.order);
  const nextChildren = sortedChildren.filter(
    (column) => !activeKeySet.has(column.key),
  );
  const overIndexes = nextChildren.reduce(
    (indexes: number[], column, index) => {
      if (overKeySet.has(column.key)) {
        indexes.push(index);
      }
      return indexes;
    },
    [],
  );

  if (!overIndexes.length) {
    return null;
  }

  const insertIndex =
    placement === 'start'
      ? Math.min(...overIndexes)
      : Math.max(...overIndexes) + 1;
  const sortedActiveColumns = [...activeColumns].sort(
    (a, b) => a.order - b.order,
  );
  nextChildren.splice(insertIndex, 0, ...sortedActiveColumns);

  const orderMap = new Map<Key, number>();
  nextChildren.forEach((column, order) => {
    orderMap.set(column.key, order);
  });

  let changed = false;
  const updatedChildren = children.map((column) => {
    const order = orderMap.get(column.key);
    if (order === undefined || order === column.order) {
      return column;
    }
    changed = true;
    return { ...column, order };
  });

  if (!changed) {
    return null;
  }

  return replaceTreeNode(
    columnsState,
    parent?.children?.map((column) => column.key) || [],
    updatedChildren,
  );
}
