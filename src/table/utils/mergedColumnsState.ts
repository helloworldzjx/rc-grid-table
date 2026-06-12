import { Key } from 'react';

import { isNum, isValidKey } from '../../_utils/validate';
import type { ColumnState } from '../interface';
import type { InternalColumnState } from '../internalInterface';
import { getColumnKey } from './handle';

const internalColumnFlagKeys = [
  '__RC_GRID_TABLE_EXPAND_COLUMN',
  '__RC_GRID_TABLE_SELECTION_COLUMN',
  '__RC_GRID_TABLE_ROW_SORT_COLUMN',
] as const;

function completeColumnState<T = any>(
  column: InternalColumnState<T>,
  children: InternalColumnState[] = column.children || [],
): InternalColumnState {
  const hasChildren = children.length > 0;

  const width = hasChildren ? undefined : column.width;

  let widthManuallyChanged = false;
  if (!hasChildren) {
    widthManuallyChanged = column.resizeDisabled
      ? false
      : !!column.widthManuallyChanged;
  }

  let autoWidthLocked = false;
  if (!hasChildren) {
    autoWidthLocked = column.resizeDisabled
      ? false
      : !!column.autoWidthLocked || widthManuallyChanged;
  }

  let distribute = false;
  if (!hasChildren) {
    distribute = column.resizeDisabled
      ? false
      : autoWidthLocked
      ? false
      : column.distribute ?? false;
  }

  return {
    ...column,
    width,
    visible: column.visible ?? true,
    distribute,
    widthManuallyChanged,
    autoWidthLocked,
    hasChildren,
    children,
  } as InternalColumnState;
}

function createKeyMap(storageColumns: ColumnState[]): Map<Key, ColumnState> {
  const map = new Map<Key, ColumnState>();
  const traverse = (columns: ColumnState[]) => {
    columns.forEach((column, index) => {
      map.set(getColumnKey(column, index), column);
      if (column.children?.length) traverse(column.children);
    });
  };
  traverse(storageColumns);
  return map;
}

function normalizeColumnsOrder<T = any>(
  columns: InternalColumnState<T>[],
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
        (isNum(a.column.order) ? a.column.order : a.index) -
        (isNum(b.column.order) ? b.column.order : b.index);
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

    const insertIndex = !isValidKey(anchorKey)
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
  columns: InternalColumnState<T>[],
  storageColumns: ColumnState[],
): InternalColumnState[] {
  const storageColumnsKeyMap = createKeyMap(storageColumns);
  const mergeColumn = (column: InternalColumnState<T>): InternalColumnState => {
    const storeColumn = storageColumnsKeyMap.get(column.key);
    if (!storeColumn) {
      const children = column.children?.length
        ? mergeColumnsStateInternal(column.children, [])
        : [];
      return completeColumnState(column, children);
    }

    const merged: ColumnState = {
      ...column,
      // 冲突时优先采用b的数据
      ...JSON.parse(JSON.stringify(storeColumn)),
      // 以下input数据/派生数据以实际传入的为准
      key: column.key,
      dataIndex: column.dataIndex,
      depth: column.depth,
      parentKey: column.parentKey,
      ancestorKeys: column.ancestorKeys,
      resizeDisabled: column.resizeDisabled,
      dragSortDisabled: column.dragSortDisabled,
    };

    internalColumnFlagKeys.forEach((flagKey) => {
      if (column[flagKey]) {
        merged[flagKey] = true;
      } else {
        delete merged[flagKey];
      }
    });

    if (column.resizeDisabled && !column.hasChildren) {
      merged.width = column.width;
      merged.widthManuallyChanged = false;
      merged.autoWidthLocked = false;
    }

    const children = column.children?.length
      ? mergeColumnsStateInternal(column.children, storeColumn.children || [])
      : [];

    return completeColumnState(merged, children);
  };
  const mergedColumns = columns.map((column) => mergeColumn(column));
  return normalizeColumnsOrder(mergedColumns, storageColumns);
}

/** 处理columns数据和存储中的columnsState数据，根据columns增删columnsState中的列，最后合并两种数据 */
export function mergeColumnsState<T = any>(
  columns: InternalColumnState<T>[],
  storageColumns: ColumnState[],
): InternalColumnState[] {
  return mergeColumnsStateInternal(columns, storageColumns);
}
