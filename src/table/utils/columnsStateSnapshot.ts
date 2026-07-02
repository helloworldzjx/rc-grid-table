import type { Key } from 'react';

import type { ColumnState, SizeType } from '../interface';
import type { InternalColumnState } from '../internalInterface';
import { columnsWidthDistribute } from './calc';
import {
  columnsSort,
  hydrateColumnsStateRuntimeWidths,
  parseColumnsState,
} from './handle';

interface FinalizeColumnsStateSnapshotOptions<T = any> {
  containerWidth: number;
  columnsState: InternalColumnState<T>[];
  columnMinWidth: number;
  leafColumnMinWidth: number;
  size: SizeType;
  previewHiddenColumns?: boolean;
  previewRestoredKeys?: ReadonlySet<Key>;
}

export interface FinalizedColumnsStateSnapshot<T = any> {
  finalColumnsState: ColumnState<T>[];
  sortedColumnsState: InternalColumnState<T>[];
  treeColumns: InternalColumnState<T>[];
  flattenColumns: InternalColumnState<T>[];
  flattenColumnsWidths: number[];
}

export function finalizeColumnsStateSnapshot<T = any>({
  containerWidth,
  columnsState,
  columnMinWidth,
  leafColumnMinWidth,
  size,
  previewHiddenColumns,
  previewRestoredKeys,
}: FinalizeColumnsStateSnapshotOptions<T>): FinalizedColumnsStateSnapshot<T> {
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
