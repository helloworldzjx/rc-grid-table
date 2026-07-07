import type { Key } from 'react';

import { isNum, isValidKey } from '../../_utils/validate';
import type { ColumnState, SizeType } from '../interface';
import type { InternalColumnState } from '../internalInterface';
import { columnsWidthDistribute } from './calc';
import {
  columnsSort,
  getColumnKey,
  getColumnOwnFixed,
  hydrateColumnsStateRuntimeWidths,
  parseColumnsState,
} from './handle';

interface FinalizeColumnSnapshotOptions<T = any> {
  containerWidth: number;
  columnsState: InternalColumnState<T>[];
  columnMinWidth: number;
  leafColumnMinWidth: number;
  size: SizeType;
  previewHiddenColumns?: boolean;
  previewRestoredKeys?: ReadonlySet<Key>;
}

export interface FinalizedColumnSnapshot<T = any> {
  finalColumnsState: ColumnState<T>[];
  sortedColumnsState: InternalColumnState<T>[];
  treeColumns: InternalColumnState<T>[];
  flattenColumns: InternalColumnState<T>[];
  flattenColumnsWidths: number[];
}

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
  const ownFixed = getColumnOwnFixed(column);

  return {
    ...column,
    width,
    visible: column.visible ?? true,
    ownFixed,
    effectiveFixed: ownFixed ?? false,
    renderFixed: ownFixed ?? false,
    groupFixedState: ownFixed ?? false,
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
    merged.ownFixed = state.fixed;
    merged.fixed = state.fixed;
  } else if (state.fixed === false) {
    delete merged.fixed;
    merged.ownFixed = false;
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

function normalizeColumnsStateInternal<T = any>(
  columns: InternalColumnState<T>[],
  appearanceState: ColumnState<T>[],
): InternalColumnState<T>[] {
  const stateKeyMap = createSiblingKeyMap(appearanceState);
  const normalizeColumn = (
    column: InternalColumnState<T>,
  ): InternalColumnState<T> => {
    const stateColumn = stateKeyMap.get(column.key);
    const merged = applyColumnState(column, stateColumn);

    if (column.resizeDisabled && !column.hasChildren) {
      merged.width = column.width;
      merged.widthManuallyChanged = false;
      merged.autoWidthLocked = false;
    }

    const children = column.children?.length
      ? normalizeColumnsStateInternal(
          column.children,
          stateColumn?.children || [],
        )
      : [];

    return completeColumnState(merged, children);
  };

  const normalizedColumns = columns.map((column) => normalizeColumn(column));
  return normalizeColumnsOrder(normalizedColumns, appearanceState);
}

export function normalizeColumnsState<T = any>(
  currentColumns: InternalColumnState<T>[],
  appearanceState: ColumnState<T>[],
): InternalColumnState<T>[] {
  return normalizeColumnsStateInternal(currentColumns, appearanceState);
}

export function mergeStorageColumnsState<T = any>(
  currentColumns: InternalColumnState<T>[],
  storageState: ColumnState<T>[],
): InternalColumnState<T>[] {
  return normalizeColumnsState(currentColumns, storageState);
}

export function rebasePreviewColumnsState<T = any>(
  currentColumns: InternalColumnState<T>[],
  draftState: ColumnState<T>[],
): InternalColumnState<T>[] {
  return normalizeColumnsState(currentColumns, draftState);
}

export function finalizeColumnSnapshot<T = any>({
  containerWidth,
  columnsState,
  columnMinWidth,
  leafColumnMinWidth,
  size,
  previewHiddenColumns,
  previewRestoredKeys,
}: FinalizeColumnSnapshotOptions<T>): FinalizedColumnSnapshot<T> {
  const sortedColumnsState = columnsSort(columnsState);

  if (!containerWidth) {
    return {
      finalColumnsState: parseColumnsState(sortedColumnsState),
      sortedColumnsState,
      treeColumns: sortedColumnsState,
      flattenColumns: [] as InternalColumnState<T>[],
      flattenColumnsWidths: [] as number[],
    };
  }

  const { flattenColumns, treeColumns } = columnsWidthDistribute(
    containerWidth,
    sortedColumnsState,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    {
      previewHiddenColumns,
      previewRestoredKeys,
    },
  );
  const flattenColumnsWidths = flattenColumns.map(
    (column) => column.width as number,
  );
  const finalColumnsState = hydrateColumnsStateRuntimeWidths(
    parseColumnsState(sortedColumnsState),
    flattenColumns,
    flattenColumnsWidths,
  );

  return {
    finalColumnsState,
    sortedColumnsState,
    treeColumns,
    flattenColumns,
    flattenColumnsWidths,
  };
}
