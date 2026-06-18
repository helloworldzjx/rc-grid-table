import { Key } from 'react';

import { isNum, isValidKey } from '../../_utils/validate';
import type { ColumnState } from '../interface';
import type {
  ColumnStateFeatureOptions,
  InternalColumnState,
} from '../internalInterface';
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

export function filterColumnsStateByFeatures<T = any>(
  columnsState: ColumnState<T>[],
  features: ColumnStateFeatureOptions = {},
): ColumnState<T>[] {
  if (!Array.isArray(columnsState)) return [];

  const { resizableColumns, sortableColumns, fixableColumns, visibleColumns } =
    features;

  const traverse = (columns: ColumnState<T>[]): ColumnState<T>[] =>
    columns.map((column) => {
      const state: ColumnState<T> = { key: column.key };

      if (column.dataIndex !== undefined) state.dataIndex = column.dataIndex;
      if (sortableColumns && isNum(column.order)) state.order = column.order;
      if (visibleColumns && typeof column.visible === 'boolean') {
        state.visible = column.visible;
      }
      if (fixableColumns) {
        if (column.fixed === 'start' || column.fixed === 'end') {
          state.fixed = column.fixed;
        } else if (column.fixed === false) {
          state.fixed = false;
        }
      }
      if (resizableColumns) {
        if (isNum(column.width)) state.width = column.width;
        if (typeof column.widthManuallyChanged === 'boolean') {
          state.widthManuallyChanged = column.widthManuallyChanged;
        }
      }

      const children = column.children?.length ? traverse(column.children) : [];
      if (children.length) state.children = children;

      return state;
    });

  return traverse(columnsState);
}

function applyColumnState<T = any>(
  column: InternalColumnState<T>,
  state?: ColumnState<T>,
  features: ColumnStateFeatureOptions = {},
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

  if (features.sortableColumns && isNum(state.order)) {
    merged.order = state.order;
  }
  if (features.visibleColumns && typeof state.visible === 'boolean') {
    merged.visible = state.visible;
  }
  if (features.fixableColumns) {
    if (state.fixed === 'start' || state.fixed === 'end') {
      merged.fixed = state.fixed;
    } else if (state.fixed === false) {
      delete merged.fixed;
    }
  }
  if (features.resizableColumns) {
    if (isNum(state.width)) {
      merged.width = isNum(column.resizeMinWidth)
        ? Math.max(state.width, column.resizeMinWidth)
        : state.width;
    }
    if (typeof state.widthManuallyChanged === 'boolean') {
      merged.widthManuallyChanged = state.widthManuallyChanged;
    }
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
  storageColumns: ColumnState[],
  features: ColumnStateFeatureOptions = {},
): InternalColumnState[] {
  const storageColumnsKeyMap = createKeyMap(storageColumns);
  const mergeColumn = (column: InternalColumnState<T>): InternalColumnState => {
    const storeColumn = storageColumnsKeyMap.get(column.key);
    const merged = applyColumnState(column, storeColumn, features);

    if (column.resizeDisabled && !column.hasChildren) {
      merged.width = column.width;
      merged.widthManuallyChanged = false;
      merged.autoWidthLocked = false;
    }

    const children = column.children?.length
      ? mergeColumnsStateInternal(
          column.children,
          storeColumn?.children || [],
          features,
        )
      : [];

    return completeColumnState(merged, children);
  };

  const mergedColumns = columns.map((column) => mergeColumn(column));
  return features.sortableColumns
    ? normalizeColumnsOrder(mergedColumns, storageColumns)
    : mergedColumns;
}

export function mergeColumnsState<T = any>(
  columns: InternalColumnState<T>[],
  storageColumns: ColumnState[],
  features: ColumnStateFeatureOptions = {},
): InternalColumnState[] {
  return mergeColumnsStateInternal(columns, storageColumns, features);
}
