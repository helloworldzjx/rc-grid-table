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

  const widthManuallyChanged =
    !hasChildren && !column.resizeDisabled
      ? !!column.widthManuallyChanged
      : false;
  const autoWidthLocked =
    !hasChildren && !column.resizeDisabled
      ? !!column.autoWidthLocked || widthManuallyChanged
      : false;
  const distribute =
    !hasChildren && !column.resizeDisabled && !autoWidthLocked
      ? column.distribute ?? false
      : false;

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

function createSiblingKeyMap<T = any>(
  storageColumns: ColumnState<T>[],
): Map<Key, ColumnState<T>> {
  const map = new Map<Key, ColumnState<T>>();
  storageColumns.forEach((column, index) => {
    map.set(getColumnKey(column, index), column);
  });
  return map;
}

function applyColumnState<T = any>(
  column: InternalColumnState<T>,
  state?: ColumnState<T>,
): InternalColumnState<T> {
  const merged: InternalColumnState<T> = {
    ...column,
    key: column.key,
    dataIndex: column.dataIndex,
    parentKey: column.parentKey,
    ancestorKeys: column.ancestorKeys,
    depth: column.depth,
    resizeDisabled: column.resizeDisabled,
    dragSortDisabled: column.dragSortDisabled,
  };

  if (!state) return merged;

  if (isNum(state.order)) {
    merged.order = state.order;
  }
  if (typeof state.visible === 'boolean') {
    merged.visible = state.visible;
  }
  if (state.fixed === 'start' || state.fixed === 'end') {
    merged.fixed = state.fixed;
    delete merged.columnStateFixed;
  } else if (state.fixed === false) {
    delete merged.fixed;
    merged.columnStateFixed = false;
  }
  if (isNum(state.width)) {
    merged.width = isNum(column.resizeMinWidth)
      ? Math.max(state.width, column.resizeMinWidth)
      : state.width;
  }
  if (typeof state.widthManuallyChanged === 'boolean') {
    merged.widthManuallyChanged = state.widthManuallyChanged;
  }
  if (typeof state.autoWidthLocked === 'boolean') {
    merged.autoWidthLocked = state.autoWidthLocked;
  }

  internalColumnFlagKeys.forEach((flagKey) => {
    if (column[flagKey]) {
      merged[flagKey] = true;
    } else {
      delete merged[flagKey];
    }
  });

  return merged;
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
  storageColumns: ColumnState<T>[],
): InternalColumnState<T>[] {
  const storageColumnsKeyMap = createSiblingKeyMap(storageColumns);
  const mergeColumn = (
    column: InternalColumnState<T>,
  ): InternalColumnState<T> => {
    const storeColumn = storageColumnsKeyMap.get(column.key);
    const merged = applyColumnState(column, storeColumn);

    if (column.resizeDisabled && !column.hasChildren) {
      merged.width = column.width;
      merged.widthManuallyChanged = false;
      merged.autoWidthLocked = false;
    }

    const children = column.children?.length
      ? mergeColumnsStateInternal(column.children, storeColumn?.children || [])
      : [];

    return completeColumnState(merged, children);
  };

  const mergedColumns = columns.map((column) => mergeColumn(column));
  return normalizeColumnsOrder(mergedColumns, storageColumns);
}

export function reconcileColumnsState<T = any>(
  currentColumns: InternalColumnState<T>[],
  state: ColumnState<T>[],
): InternalColumnState<T>[] {
  return mergeColumnsStateInternal(currentColumns, state);
}

export function mergeStorageColumnsState<T = any>(
  currentColumns: InternalColumnState<T>[],
  storageState: ColumnState<T>[],
): InternalColumnState<T>[] {
  return reconcileColumnsState(currentColumns, storageState);
}

export function rebasePreviewColumnsState<T = any>(
  currentColumns: InternalColumnState<T>[],
  draftState: ColumnState<T>[],
): InternalColumnState<T>[] {
  return reconcileColumnsState(currentColumns, draftState);
}
