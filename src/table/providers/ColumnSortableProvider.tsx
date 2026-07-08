import React, {
  Key,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { isNum } from '../../_utils/validate';
import ColumnSortableContext, {
  ColumnSortableSplitProvider,
} from '../contexts/ColumnSortableContext';
import ColumnSortMotionContext, {
  ColumnSortingContext,
} from '../contexts/ColumnSortMotionContext';
import ColumnSortPreviewLayoutContext, {
  type ColumnSortPreviewLayoutContextProps,
} from '../contexts/ColumnSortPreviewLayoutContext';
import useStickyOffsets from '../hooks/useStickyOffsets';
import type {
  ColumnSortActiveStatus,
  InternalColumnState,
} from '../internalInterface';
import { getColumnMotionStartPositions } from '../utils/columnMotion';
import {
  columnsSort,
  getSortablePreviewColumns,
  isColumnsOrderEqual,
} from '../utils/handle';

interface ColumnSortableProviderProps<T = any> {
  children?: ReactNode;
  sortableColumns?: boolean;
  baseColumnsState: InternalColumnState<T>[];
  updateSortableColumnsState: (columnsState: InternalColumnState<T>[]) => void;
  previewSource: {
    flattenColumns: InternalColumnState<T>[];
    flattenColumnsWidths: number[];
  };
}

const emptyColumns: InternalColumnState[] = [];
const emptyWidths: number[] = [];
const emptyPreviewLayout: ColumnSortPreviewLayoutContextProps = {};
const emptyActiveStatus: ColumnSortActiveStatus = {
  keys: new Set<Key>(),
  fixed: false,
};

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
 * 列排序 preview 放在独立 provider 内，TableContext 只保存真实列布局。
 * previewSource 提供真实叶子列和宽度，供预览顺序重新映射使用。
 */
const ColumnSortableProvider = <T,>({
  children,
  sortableColumns,
  baseColumnsState,
  updateSortableColumnsState,
  previewSource,
}: ColumnSortableProviderProps<T>) => {
  const [sortablePreviewState, setSortablePreviewState] = useState<
    InternalColumnState<T>[] | null
  >(null);
  const [sortingColumns, setSortingColumns] = useState(false);
  const [sortableMotionKeys, setSortableMotionKeys] = useState<Set<Key>>(
    () => new Set(),
  );
  const [sortableMotionVersion, setSortableMotionVersion] = useState(0);
  const [activeStatus, setActiveStatus] =
    useState<ColumnSortActiveStatus>(emptyActiveStatus);
  const [hotKeys, setHotKeys] = useState<Set<Key>>(() => new Set());

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

  const updateHotKeys = useCallback((dispatch: SetStateAction<Set<Key>>) => {
    setHotKeys((prevKeys) => {
      const nextKeys =
        typeof dispatch === 'function' ? dispatch(prevKeys) : dispatch;

      return nextKeys === prevKeys || areKeySetsEqual(prevKeys, nextKeys)
        ? prevKeys
        : nextKeys;
    });
  }, []);

  const getSortableBaseState = useCallback(() => {
    return sortablePreviewState || baseColumnsState;
  }, [baseColumnsState, sortablePreviewState]);

  // preview 状态只放在列排序 provider 内部，不再进入根 TableContext。
  // 这样预览排序时只让 header/body/summary 的列布局消费者更新，避免 Table 主体重算虚拟滚动等重逻辑。
  useEffect(() => {
    if (
      sortablePreviewState &&
      baseColumnsState.length &&
      isColumnsOrderEqual(baseColumnsState, sortablePreviewState)
    ) {
      setSortablePreviewState(null);
    }
  }, [baseColumnsState, sortablePreviewState]);

  const sortablePreviewColumns = useMemo(() => {
    if (!sortablePreviewState || !baseColumnsState.length) {
      return null;
    }

    // 使用真实列宽作为预览基准，只重新映射列顺序。
    // 列宽分配、虚拟列表高度测量仍由真实布局负责，drop 时再提交真实结构。
    return getSortablePreviewColumns(
      columnsSort(sortablePreviewState),
      previewSource.flattenColumns,
      previewSource.flattenColumnsWidths,
    );
  }, [
    baseColumnsState.length,
    previewSource.flattenColumns,
    previewSource.flattenColumnsWidths,
    sortablePreviewState,
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
  const previewColumnMotionPositions = useMemo(
    () => getColumnMotionStartPositions(previewFlattenColumnsWidths),
    [previewFlattenColumnsWidths],
  );
  const sortablePreviewing =
    sortingColumns || !!sortablePreviewState || !!sortableMotionKeys.size;

  const columnSortableContextValue = useMemo(
    () => ({
      sortableColumns,
      sortablePreviewState,
      sortablePreviewing,
      updateSortablePreviewState: setSortablePreviewState,
      getSortableBaseState,
      updateSortableColumnsState,
      sortingColumns,
      updateSortingColumns: setSortingColumns,
      activeStatus,
      updateActiveStatus: setActiveStatus,
      sortableMotionKeys,
      updateSortableMotionKeys,
      sortableMotionVersion,
      hotKeys,
      updateHotKeys,
    }),
    [
      sortableColumns,
      sortablePreviewState,
      sortablePreviewing,
      getSortableBaseState,
      updateSortableColumnsState,
      sortingColumns,
      activeStatus,
      sortableMotionKeys,
      updateSortableMotionKeys,
      sortableMotionVersion,
      hotKeys,
      updateHotKeys,
    ],
  );

  const columnSortableConfigContextValue = useMemo(
    () => ({
      sortableColumns,
    }),
    [sortableColumns],
  );

  const columnSortablePreviewingContextValue = useMemo(
    () => ({
      sortablePreviewing,
    }),
    [sortablePreviewing],
  );

  const columnSortableActiveContextValue = useMemo(
    () => ({
      activeStatus,
      updateActiveStatus: setActiveStatus,
      hotKeys,
      updateHotKeys,
    }),
    [activeStatus, hotKeys, updateHotKeys],
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
    // TableLayoutContext 保持真实布局，避免排序临时预览状态触发整表订阅链路。
    return {
      columns: sortablePreviewColumns.treeColumns,
      flattenColumns: sortablePreviewColumns.flattenColumns,
      flattenColumnsWidths: sortablePreviewColumns.flattenColumnsWidths,
      columnMotionPositions: previewColumnMotionPositions,
      columnsWidthTotal: previewColumnsWidthTotal,
      fixedOffset: previewFixedOffset,
    };
  }, [
    previewColumnMotionPositions,
    previewColumnsWidthTotal,
    previewFixedOffset,
    sortablePreviewColumns,
  ]);

  return (
    <ColumnSortableContext.Provider value={columnSortableContextValue}>
      <ColumnSortableSplitProvider
        activeValue={columnSortableActiveContextValue}
        configValue={columnSortableConfigContextValue}
        previewingValue={columnSortablePreviewingContextValue}
      >
        <ColumnSortingContext.Provider value={sortingColumns}>
          <ColumnSortMotionContext.Provider
            value={columnSortMotionContextValue}
          >
            <ColumnSortPreviewLayoutContext.Provider
              value={previewLayoutContextValue}
            >
              {children}
            </ColumnSortPreviewLayoutContext.Provider>
          </ColumnSortMotionContext.Provider>
        </ColumnSortingContext.Provider>
      </ColumnSortableSplitProvider>
    </ColumnSortableContext.Provider>
  );
};

export default ColumnSortableProvider;
