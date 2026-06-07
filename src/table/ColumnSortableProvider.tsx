import React, {
  Key,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { isNum } from '../_utils/validate';
import ColumnSortableContext from './columnSortableContext';
import ColumnSortMotionContext from './columnSortMotionContext';
import ColumnSortPreviewLayoutContext, {
  type ColumnSortPreviewLayoutContextProps,
} from './columnSortPreviewLayoutContext';
import useStickyOffsets from './hooks/useStickyOffsets';
import type { ColumnState } from './interface';
import {
  columnsSort,
  getSortablePreviewColumns,
  isColumnsOrderEqual,
} from './utils/handle';

interface ColumnSortableProviderProps<T = any> {
  children?: ReactNode;
  sortableColumns?: boolean;
  baseColumnsState: ColumnState<T>[];
  updateSortableColumnsState: (columnsState: ColumnState<T>[]) => void;
  previewSource: {
    flattenColumns: ColumnState<T>[];
    flattenColumnsWidths: number[];
  };
}

const emptyColumns: ColumnState[] = [];
const emptyWidths: number[] = [];
const emptyPreviewLayout: ColumnSortPreviewLayoutContextProps = {};

const areKeySetsEqual = (a: ReadonlySet<Key>, b: ReadonlySet<Key>) => {
  if (a.size !== b.size) return false;

  let equal = true;
  a.forEach((key) => {
    if (!b.has(key)) {
      equal = false;
    }
  });

  return equal;
};

const ColumnSortableProvider = <T,>({
  children,
  sortableColumns,
  baseColumnsState,
  updateSortableColumnsState,
  previewSource,
}: ColumnSortableProviderProps<T>) => {
  const [sortableDraftState, setSortableDraftState] = useState<
    ColumnState<T>[] | null
  >(null);
  const [sortingColumns, setSortingColumns] = useState(false);
  const [sortableMotionKeys, setSortableMotionKeys] = useState<Set<Key>>(
    () => new Set(),
  );
  const [sortableMotionVersion, setSortableMotionVersion] = useState(0);

  const updateSortableMotionKeys = useCallback(
    (dispatch: SetStateAction<Set<Key>>) => {
      setSortableMotionKeys((prevKeys) => {
        const nextKeys =
          typeof dispatch === 'function' ? dispatch(prevKeys) : dispatch;

        if (nextKeys === prevKeys || areKeySetsEqual(prevKeys, nextKeys)) {
          return prevKeys;
        }

        setSortableMotionVersion((version) => version + 1);
        return nextKeys;
      });
    },
    [],
  );

  const getSortableBaseState = useCallback(() => {
    return sortableDraftState || baseColumnsState;
  }, [baseColumnsState, sortableDraftState]);

  useEffect(() => {
    if (
      sortableDraftState &&
      baseColumnsState.length &&
      isColumnsOrderEqual(baseColumnsState, sortableDraftState)
    ) {
      setSortableDraftState(null);
    }
  }, [baseColumnsState, sortableDraftState]);

  const sortablePreviewColumns = useMemo(() => {
    if (!sortableDraftState || !baseColumnsState.length) {
      return null;
    }

    return getSortablePreviewColumns(
      columnsSort(sortableDraftState),
      previewSource.flattenColumns,
      previewSource.flattenColumnsWidths,
    );
  }, [
    baseColumnsState.length,
    previewSource.flattenColumns,
    previewSource.flattenColumnsWidths,
    sortableDraftState,
  ]);

  const previewFlattenColumns =
    sortablePreviewColumns?.flattenColumns ?? emptyColumns;
  const previewFlattenColumnsWidths =
    sortablePreviewColumns?.flattenColumnsWidths ?? emptyWidths;
  const previewFixedOffset = useStickyOffsets(
    previewFlattenColumnsWidths,
    previewFlattenColumns,
  );
  const previewColumnsWidthTotal = useMemo(
    () =>
      previewFlattenColumnsWidths.reduce(
        (sum, num) => sum + (isNum(num) ? num : 0),
        0,
      ),
    [previewFlattenColumnsWidths],
  );

  const columnSortableContextValue = useMemo(
    () => ({
      sortableColumns,
      sortableDraftState,
      updateSortableDraftState: setSortableDraftState,
      getSortableBaseState,
      updateSortableColumnsState,
      sortingColumns,
      updateSortingColumns: setSortingColumns,
      sortableMotionKeys,
      updateSortableMotionKeys,
      sortableMotionVersion,
    }),
    [
      sortableColumns,
      sortableDraftState,
      getSortableBaseState,
      updateSortableColumnsState,
      sortingColumns,
      sortableMotionKeys,
      updateSortableMotionKeys,
      sortableMotionVersion,
    ],
  );

  const columnSortMotionContextValue = useMemo(
    () => ({
      sortingColumns,
      sortableMotionKeys,
      sortableMotionVersion,
    }),
    [sortingColumns, sortableMotionKeys, sortableMotionVersion],
  );

  const previewLayoutContextValue = useMemo(() => {
    if (!sortablePreviewColumns) {
      return emptyPreviewLayout;
    }

    return {
      columns: sortablePreviewColumns.treeColumns,
      flattenColumns: sortablePreviewColumns.flattenColumns,
      flattenColumnsWidths: sortablePreviewColumns.flattenColumnsWidths,
      columnsWidthTotal: previewColumnsWidthTotal,
      fixedOffset: previewFixedOffset,
    };
  }, [previewColumnsWidthTotal, previewFixedOffset, sortablePreviewColumns]);

  return (
    <ColumnSortableContext.Provider value={columnSortableContextValue}>
      <ColumnSortMotionContext.Provider value={columnSortMotionContextValue}>
        <ColumnSortPreviewLayoutContext.Provider
          value={previewLayoutContextValue}
        >
          {children}
        </ColumnSortPreviewLayoutContext.Provider>
      </ColumnSortMotionContext.Provider>
    </ColumnSortableContext.Provider>
  );
};

export default ColumnSortableProvider;
