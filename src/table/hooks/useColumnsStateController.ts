import warning from '@rc-component/util/lib/warning';
import { useIsomorphicLayoutEffect } from 'ahooks';
import {
  Key,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ColumnState,
  ColumnStatePatch,
  ColumnsConfig,
  ColumnsStateChangeType,
  ColumnsStatePreviewMode,
  ColumnsStatePreviewOptions,
  ColumnsType,
  SizeType,
} from '../interface';
import type { InternalColumnState } from '../internalInterface';
import { columnsWidthDistribute, getMergedSpanKeys } from '../utils/calc';
import {
  collectChangedPatches,
  collectInvisibleColumnKeys,
  compactUserColumnStatePatches,
  getPatchKeys,
  isColumnsStateEqual,
  patchColumnsStateFixed,
  patchColumnsStateVisible,
} from '../utils/columnsState';
import {
  batchPatchColumns,
  columnsSort,
  filterHiddenColumns,
  getColumnsViewState,
  parseColumnsState,
} from '../utils/handle';
import { mergeColumnsState } from '../utils/mergedColumnsState';

interface UseColumnsStateControllerProps<T = any> {
  ready: boolean;
  containerWidth: number;
  mergedColumns: ColumnsType<T>;
  columnsConfig?: ColumnsConfig<T>;
  columnMinWidth: number;
  leafColumnMinWidth: number;
  size: SizeType;
  resizableColumns?: boolean;
  sortableColumns?: boolean;
  fixableColumns?: boolean;
  visibleColumns?: boolean;
}

type ColumnsStatePreviewSession<T = any> = {
  baseColumnsState: ColumnState<T>[];
  columnsState: ColumnState<T>[];
  mode: ColumnsStatePreviewMode;
  userPatches: ColumnStatePatch<T>[];
};

const DEFAULT_PREVIEW_MODE: ColumnsStatePreviewMode = 'full';

const findColumnByKey = <T>(
  columns: InternalColumnState<T>[],
  targetKey: Key,
): InternalColumnState<T> | undefined => {
  for (const column of columns) {
    if (column.key === targetKey) return column;

    const found = column.children?.length
      ? findColumnByKey(column.children, targetKey)
      : undefined;
    if (found) return found;
  }

  return undefined;
};

const collectLeafColumns = <T>(
  columns: InternalColumnState<T>[],
): InternalColumnState<T>[] =>
  columns.reduce<InternalColumnState<T>[]>((result, column) => {
    if (column.children?.length) {
      result.push(...collectLeafColumns(column.children));
    } else {
      result.push(column);
    }

    return result;
  }, []);

export default function useColumnsStateController<T = any>({
  ready,
  containerWidth,
  mergedColumns,
  columnsConfig,
  columnMinWidth,
  leafColumnMinWidth,
  size,
  resizableColumns,
  sortableColumns,
  fixableColumns,
  visibleColumns,
}: UseColumnsStateControllerProps<T>) {
  const [initialized, setInitialized] = useState(false);
  const [cols, setCols] = useState<InternalColumnState<T>[]>([]);
  const [calculatedFlattenColumnsWidths, setCalculatedFlattenColumnsWidths] =
    useState<number[]>([]);
  const [previewFlattenColumnsWidths, setPreviewFlattenColumnsWidths] =
    useState<number[] | null>(null);
  const [flattenCols, setFlattenCols] = useState<InternalColumnState<T>[]>([]);
  const [innerColumnsState, setInnerColumnsState] = useState<
    InternalColumnState<T>[]
  >([]);
  const [columnsState, setColumnsState] = useState<ColumnState<T>[]>([]);
  const [previewSession, setPreviewSession] =
    useState<ColumnsStatePreviewSession<T> | null>(null);
  const storageColumnsStateInitialized = useRef(false);
  const columnsStateReadyEmitted = useRef(false);
  const columnsStateKey = columnsConfig?.columnsStateKey;
  const prevColumnsStateKey = useRef(columnsConfig?.columnsStateKey);
  const previewBaseHiddenColumnKeys = useRef<Set<Key>>(new Set());
  const calculatedFlattenColumnsWidthsRef = useRef(
    calculatedFlattenColumnsWidths,
  );

  calculatedFlattenColumnsWidthsRef.current = calculatedFlattenColumnsWidths;

  const flattenColumnsWidths =
    previewFlattenColumnsWidths ?? calculatedFlattenColumnsWidths;

  const updateFlattenColumnsWidths = useCallback(
    (value: SetStateAction<number[]>) => {
      setPreviewFlattenColumnsWidths((prevWidths) => {
        const baseWidths =
          prevWidths ?? calculatedFlattenColumnsWidthsRef.current;

        return typeof value === 'function' ? value(baseWidths) : value;
      });
    },
    [],
  );

  const clearFlattenColumnsWidthPreview = useCallback(
    (nextCalculatedWidths?: number[]) => {
      if (nextCalculatedWidths) {
        setCalculatedFlattenColumnsWidths(nextCalculatedWidths);
      }
      setPreviewFlattenColumnsWidths(null);
    },
    [],
  );

  const hasAnyColumnStateFeature = useMemo(() => {
    return (
      resizableColumns || sortableColumns || fixableColumns || visibleColumns
    );
  }, [resizableColumns, sortableColumns, fixableColumns, visibleColumns]);

  const hasExplicitStorageColumnsState = Array.isArray(
    columnsConfig?.storageColumnsState,
  );
  const shouldInitializeColumnsState =
    hasAnyColumnStateFeature || hasExplicitStorageColumnsState;
  const columnsStatePipelineActive =
    shouldInitializeColumnsState ||
    storageColumnsStateInitialized.current ||
    columnsState.length > 0;

  const previewColumnsState = useMemo(
    () => previewSession?.columnsState ?? null,
    [previewSession?.columnsState],
  );
  const columnsStatePreviewMode = previewSession?.mode;
  const columnsStatePreviewing = previewSession !== null;

  const parseUpdateColumnsState = useCallback(
    (input: Array<ColumnState<T> | InternalColumnState<T>>) => {
      setColumnsState(parseColumnsState(input));
    },
    [],
  );

  const getCurrentViewState = useCallback(() => {
    return getColumnsViewState(cols);
  }, [cols]);

  const getCommittedMergedColumnsState = useCallback(() => {
    if (!columnsState.length) return [];

    const realColumns = filterHiddenColumns(size, mergedColumns);
    return mergeColumnsState(realColumns, columnsState);
  }, [columnsState, mergedColumns, size]);

  const resetRuntimeWidths = useCallback(() => {
    const committedColumnsState = getCommittedMergedColumnsState();
    if (!containerWidth || !committedColumnsState.length) {
      if (!flattenCols.length) return;

      clearFlattenColumnsWidthPreview(
        flattenCols.map((column) => column.width as number),
      );
      return;
    }

    const { flattenColumns } = columnsWidthDistribute(
      containerWidth,
      columnsSort(committedColumnsState),
      columnMinWidth,
      leafColumnMinWidth,
      size,
      {
        previewHiddenColumns: false,
        previewRestoredKeys: previewBaseHiddenColumnKeys.current,
      },
    );
    clearFlattenColumnsWidthPreview(
      flattenColumns.map((column) => column.width as number),
    );
  }, [
    clearFlattenColumnsWidthPreview,
    columnMinWidth,
    containerWidth,
    flattenCols,
    getCommittedMergedColumnsState,
    leafColumnMinWidth,
    size,
  ]);

  const getCommittedColumnsState = useCallback(() => {
    const currentState = columnsState.length
      ? columnsState
      : innerColumnsState.length
      ? parseColumnsState(innerColumnsState)
      : cols.length
      ? parseColumnsState(cols)
      : [];

    return parseColumnsState(currentState);
  }, [cols, columnsState, innerColumnsState]);

  const getActiveColumnsState = useCallback(() => {
    if (previewColumnsState) {
      const committedColumnsState = getCommittedMergedColumnsState();
      const rebasedPreviewColumnsState = committedColumnsState.length
        ? parseColumnsState(
            mergeColumnsState(committedColumnsState, previewColumnsState),
          )
        : previewColumnsState;

      return parseColumnsState(rebasedPreviewColumnsState);
    }

    return parseColumnsState(getCommittedColumnsState());
  }, [
    getCommittedColumnsState,
    getCommittedMergedColumnsState,
    previewColumnsState,
  ]);

  const activeColumnsState = useMemo(
    () => getActiveColumnsState(),
    [getActiveColumnsState],
  );

  const getPreviewAllowedPatches = useCallback(
    (type: ColumnsStateChangeType, patches: ColumnStatePatch<T>[]) => {
      if (columnsStatePreviewMode !== 'visibleHotOnly') return patches;

      if (type !== 'visible') return [];

      return patches.reduce<ColumnStatePatch<T>[]>((result, patch) => {
        if (!previewBaseHiddenColumnKeys.current.has(patch.key)) {
          return result;
        }

        if (typeof patch.partial.visible !== 'boolean') {
          return result;
        }

        result.push({
          key: patch.key,
          partial: { visible: patch.partial.visible },
        });
        return result;
      }, []);
    },
    [columnsStatePreviewMode],
  );

  const commitColumnsStateChange = useCallback(
    (
      nextState: ColumnState<T>[],
      type: ColumnsStateChangeType,
      patches: ColumnStatePatch<T>[],
    ) => {
      const allowedPatches = columnsStatePreviewing
        ? getPreviewAllowedPatches(type, patches)
        : patches;
      if (!allowedPatches.length) return false;

      const previousState = columnsStatePreviewing
        ? getActiveColumnsState()
        : getCommittedColumnsState();
      const state =
        columnsStatePreviewing && columnsStatePreviewMode === 'visibleHotOnly'
          ? batchPatchColumns(
              previousState.length
                ? previousState
                : parseColumnsState(nextState),
              allowedPatches,
            )
          : parseColumnsState(nextState);

      if (columnsStatePreviewing) {
        setPreviewSession((session) =>
          session
            ? {
                ...session,
                columnsState: state,
                userPatches: [...session.userPatches, ...allowedPatches],
              }
            : session,
        );
        return true;
      }

      setColumnsState(state);
      columnsConfig?.onColumnsStateChange?.(state, {
        type,
        patches: allowedPatches,
        previousState,
        nextState: state,
        viewState: getCurrentViewState(),
        changedKeys: getPatchKeys(allowedPatches),
      });
      return true;
    },
    [
      columnsConfig,
      columnsStatePreviewMode,
      columnsStatePreviewing,
      getActiveColumnsState,
      getCommittedColumnsState,
      getCurrentViewState,
      getPreviewAllowedPatches,
    ],
  );

  const cancelColumnsStatePreview = useCallback(() => {
    setPreviewSession(null);
    previewBaseHiddenColumnKeys.current = new Set();
    resetRuntimeWidths();
  }, [resetRuntimeWidths]);

  const startColumnsStatePreview = useCallback(
    (options: ColumnsStatePreviewOptions = {}) => {
      if (!hasAnyColumnStateFeature) {
        warning(
          false,
          'Table `startColumnsStatePreview` requires at least one columns state feature to be enabled.',
        );
        return false;
      }

      const mode = options.mode ?? DEFAULT_PREVIEW_MODE;
      if (mode === 'visibleHotOnly' && !visibleColumns) {
        warning(
          false,
          'Table `startColumnsStatePreview({ mode: "visibleHotOnly" })` requires `visibleColumns` to be enabled.',
        );
        return false;
      }

      if (previewSession) return true;

      const state = getCommittedColumnsState();
      if (!state.length) return false;

      previewBaseHiddenColumnKeys.current = new Set(
        collectInvisibleColumnKeys(state),
      );
      setPreviewSession({
        baseColumnsState: state,
        columnsState: state,
        mode,
        userPatches: [],
      });
      return true;
    },
    [
      getCommittedColumnsState,
      hasAnyColumnStateFeature,
      previewSession,
      visibleColumns,
    ],
  );

  const saveColumnsStatePreview = useCallback(() => {
    if (!previewSession) return false;

    const previousState = getCommittedColumnsState();
    const nextState = getActiveColumnsState();
    const compactedPatches = compactUserColumnStatePatches(
      previewSession.baseColumnsState,
      nextState,
      previewSession.userPatches,
    );
    const patches =
      columnsStatePreviewMode === 'visibleHotOnly'
        ? getPreviewAllowedPatches('visible', compactedPatches)
        : compactedPatches;

    setPreviewSession(null);
    previewBaseHiddenColumnKeys.current = new Set();
    clearFlattenColumnsWidthPreview();

    setColumnsState(nextState);
    if (!patches.length) return false;

    columnsConfig?.onColumnsStateChange?.(nextState, {
      type: 'previewSave',
      patches,
      previousState,
      nextState,
      viewState: getCurrentViewState(),
      changedKeys: getPatchKeys(patches),
    });
    return true;
  }, [
    columnsConfig,
    columnsStatePreviewMode,
    clearFlattenColumnsWidthPreview,
    getCommittedColumnsState,
    getCurrentViewState,
    getActiveColumnsState,
    getPreviewAllowedPatches,
    previewSession,
  ]);

  const getSortableBaseState = useCallback(() => {
    return innerColumnsState;
  }, [innerColumnsState]);

  const updateSortableColumnsState = useCallback(
    (nextColumnsState: InternalColumnState<T>[]) => {
      const state = parseColumnsState(nextColumnsState);
      const patches = collectChangedPatches(
        getActiveColumnsState(),
        state,
        'order',
      );
      if (!patches.length) return;

      commitColumnsStateChange(state, 'sort', patches);
    },
    [commitColumnsStateChange, getActiveColumnsState],
  );

  const getColumnActionKeys = useCallback(
    (key: Key) => {
      const realColumns = columnsStatePreviewing
        ? innerColumnsState
        : filterHiddenColumns(size, mergedColumns);
      const targetColumn = findColumnByKey(realColumns, key);
      if (!targetColumn) return [];

      if (targetColumn.children?.length) return [key];

      return getMergedSpanKeys(
        {
          key,
          hasChildren: false,
          colSpan: targetColumn.colSpan,
        },
        collectLeafColumns(realColumns),
      );
    },
    [columnsStatePreviewing, innerColumnsState, mergedColumns, size],
  );

  const setColumnVisible = useCallback(
    (key: Key, visible: boolean) => {
      if (!visibleColumns) return false;

      const actionKeys = getColumnActionKeys(key);
      if (!actionKeys.length) return false;

      const previousState = getActiveColumnsState();
      let found = false;
      const nextState = actionKeys.reduce((state, actionKey) => {
        const patchResult = patchColumnsStateVisible(state, actionKey, visible);
        found = found || patchResult.found;
        return patchResult.nextState;
      }, previousState);
      if (!found) return false;

      const patches = collectChangedPatches(
        previousState,
        nextState,
        'visible',
      );
      if (!patches.length) return false;

      return commitColumnsStateChange(nextState, 'visible', patches);
    },
    [
      visibleColumns,
      getColumnActionKeys,
      getActiveColumnsState,
      commitColumnsStateChange,
    ],
  );

  const setColumnFixed = useCallback(
    (key: Key, fixed: ColumnState<T>['fixed']) => {
      if (!fixableColumns) return false;

      const actionKeys = getColumnActionKeys(key);
      if (!actionKeys.length) return false;

      const previousState = getActiveColumnsState();
      let found = false;
      const nextState = actionKeys.reduce((state, actionKey) => {
        const patchResult = patchColumnsStateFixed(state, actionKey, fixed);
        found = found || patchResult.found;
        return patchResult.nextState;
      }, previousState);
      if (!found) return false;

      const patches = collectChangedPatches(previousState, nextState, 'fixed');
      if (!patches.length) return false;

      return commitColumnsStateChange(nextState, 'fixed', patches);
    },
    [
      fixableColumns,
      getColumnActionKeys,
      getActiveColumnsState,
      commitColumnsStateChange,
    ],
  );

  /** 使用了列配置的处理 start */

  useIsomorphicLayoutEffect(() => {
    if (prevColumnsStateKey.current !== columnsStateKey) {
      prevColumnsStateKey.current = columnsStateKey;
      if (
        !storageColumnsStateInitialized.current &&
        !shouldInitializeColumnsState
      ) {
        return;
      }

      storageColumnsStateInitialized.current = false;
      columnsStateReadyEmitted.current = false;
      cancelColumnsStatePreview();
      setPreviewFlattenColumnsWidths(null);
      resetRuntimeWidths();
    }
  }, [
    cancelColumnsStatePreview,
    columnsStateKey,
    resetRuntimeWidths,
    shouldInitializeColumnsState,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (
      columnsStatePreviewing &&
      (!hasAnyColumnStateFeature ||
        (columnsStatePreviewMode === 'visibleHotOnly' && !visibleColumns))
    ) {
      cancelColumnsStatePreview();
    }
  }, [
    cancelColumnsStatePreview,
    columnsStatePreviewMode,
    columnsStatePreviewing,
    hasAnyColumnStateFeature,
    visibleColumns,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (
      !storageColumnsStateInitialized.current &&
      containerWidth &&
      ready &&
      columnsStatePipelineActive
    ) {
      const { treeColumns } = columnsWidthDistribute(
        containerWidth,
        mergedColumns,
        columnMinWidth,
        leafColumnMinWidth,
        size,
      );
      const initialColumnsState = hasExplicitStorageColumnsState
        ? mergeColumnsState(
            treeColumns,
            columnsConfig?.storageColumnsState || [],
          )
        : treeColumns;
      parseUpdateColumnsState(initialColumnsState);
      storageColumnsStateInitialized.current = true;
    }
  }, [
    containerWidth,
    ready,
    columnsStatePipelineActive,
    columnsConfig,
    hasExplicitStorageColumnsState,
    mergedColumns,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    parseUpdateColumnsState,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (containerWidth && columnsState.length) {
      const committedColumnsState = getCommittedMergedColumnsState();

      const parsedCommittedColumnsState = parseColumnsState(
        committedColumnsState,
      );
      const columnsStateSynced = isColumnsStateEqual(
        parsedCommittedColumnsState,
        columnsState,
      );

      if (!columnsStateSynced) {
        // 如果input columns对比columnsState有增删，则立刻更新columnsState
        parseUpdateColumnsState(parsedCommittedColumnsState);
        return;
      }

      const currentPreviewColumnsState = previewColumnsState;
      const renderColumnsState =
        columnsStatePreviewing && currentPreviewColumnsState?.length
          ? mergeColumnsState(committedColumnsState, currentPreviewColumnsState)
          : committedColumnsState;

      if (columnsStatePreviewing && currentPreviewColumnsState?.length) {
        const nextPreviewColumnsState = parseColumnsState(renderColumnsState);
        if (
          !isColumnsStateEqual(
            currentPreviewColumnsState,
            nextPreviewColumnsState,
          )
        ) {
          setPreviewSession((session) =>
            session
              ? { ...session, columnsState: nextPreviewColumnsState }
              : session,
          );
          return;
        }
      }

      setInnerColumnsState(columnsSort(renderColumnsState));
    }
  }, [
    containerWidth,
    mergedColumns,
    columnsState,
    columnsStatePreviewing,
    previewColumnsState,
    getCommittedMergedColumnsState,
    parseUpdateColumnsState,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (containerWidth && innerColumnsState.length) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(
        containerWidth,
        innerColumnsState,
        columnMinWidth,
        leafColumnMinWidth,
        size,
        {
          previewHiddenColumns: columnsStatePreviewing,
          previewRestoredKeys: previewBaseHiddenColumnKeys.current,
        },
      );
      const nextFlattenColumnsWidths = flattenColumns.map(
        (column) => column.width as number,
      );

      setCols(treeColumns);
      setFlattenCols(flattenColumns);
      setCalculatedFlattenColumnsWidths(nextFlattenColumnsWidths);
      setInitialized(true);

      if (!columnsStateReadyEmitted.current) {
        columnsStateReadyEmitted.current = true;
        const readyColumnsState = columnsState.length
          ? columnsState
          : parseColumnsState(treeColumns);
        const viewState = getColumnsViewState(treeColumns);

        columnsConfig?.onColumnsStateReady?.({
          columnsState: parseColumnsState(readyColumnsState),
          viewState,
        });
      }
    }
  }, [
    containerWidth,
    innerColumnsState,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    columnsStatePreviewing,
    columnsConfig,
    columnsState,
  ]);

  /** 使用了列配置的处理 end */

  /** 未使用列配置的处理 start */

  useIsomorphicLayoutEffect(() => {
    if (containerWidth && ready && !columnsStatePipelineActive) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(
        containerWidth,
        mergedColumns,
        columnMinWidth,
        leafColumnMinWidth,
        size,
      );
      setCols(treeColumns);
      setFlattenCols(flattenColumns);
      setCalculatedFlattenColumnsWidths(
        flattenColumns.map((column) => column.width as number),
      );
      setInitialized(true);
    }
  }, [
    containerWidth,
    ready,
    columnsStatePipelineActive,
    mergedColumns,
    columnMinWidth,
    leafColumnMinWidth,
    size,
  ]);

  /** 未使用列配置的处理 end */

  return {
    initialized,
    columns: cols,
    flattenColumns: flattenCols,
    flattenColumnsWidths,
    updateFlattenColumnsWidths,
    clearFlattenColumnsWidthPreview,
    columnsState: activeColumnsState,
    commitColumnsStateChange,
    getSortableBaseState,
    updateSortableColumnsState,
    columnsStatePreviewing,
    columnsStatePreviewMode,
    startColumnsStatePreview,
    saveColumnsStatePreview,
    cancelColumnsStatePreview,
    setColumnVisible,
    setColumnFixed,
  };
}
