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

/**
 * 列排序 draft 放在独立 provider 内，TableContext 只保存真实列布局。
 * previewSource 提供真实叶子列和宽度，供预览顺序重新映射使用。
 */
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
  const [sortableActiveKeys, setSortableActiveKeys] = useState<Set<Key>>(
    () => new Set(),
  );
  const [sortableHotKeys, setSortableHotKeys] = useState<Set<Key>>(
    () => new Set(),
  );

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

  // draft 状态只放在列排序 provider 内部，不再进入根 TableContext。
  // 这样预览排序时只让 header/body/summary 的列布局消费者更新，避免 Table 主体重算虚拟滚动等重逻辑。
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

    // 使用真实列宽作为预览基准，只重新映射列顺序。
    // 列宽分配、虚拟列表高度测量仍由真实布局负责，drop 时再提交真实结构。
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
      sortableActiveKeys,
      updateSortableActiveKeys: setSortableActiveKeys,
      sortableHotKeys,
      updateSortableHotKeys: setSortableHotKeys,
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
      sortableActiveKeys,
      sortableHotKeys,
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

    // 预览布局单独通过 ColumnSortPreviewLayoutContext 下发。
    // TableLayoutContext 保持真实布局，避免 sortableDraftState 触发整表订阅链路。
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
