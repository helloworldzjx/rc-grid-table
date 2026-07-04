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
  finalizeColumnsStateSnapshot,
  type FinalizedColumnsStateSnapshot,
} from '../utils/columnsStateSnapshot';
import {
  batchPatchColumns,
  columnsSort,
  filterHiddenColumns,
  getColumnsViewState,
  hydrateColumnsStateRuntimeWidths,
  parseColumnsState,
} from '../utils/handle';
import {
  mergeStorageColumnsState,
  rebasePreviewColumnsState,
  reconcileColumnsState,
} from '../utils/mergedColumnsState';
import usePostCommitInitialized from './usePostCommitInitialized';

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
  const [initialized, requestInitialized] = usePostCommitInitialized();
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
  const columnsStateKey = columnsConfig?.columnsStateKey;
  const prevColumnsStateKey = useRef(columnsStateKey);
  const onColumnsStateReadyRef = useRef(columnsConfig?.onColumnsStateReady);
  const columnsStateInitialized = useRef(false);
  const columnsStateReadyEmitted = useRef(false);
  const previewBaseHiddenColumnKeys = useRef<Set<Key>>(new Set());
  const calculatedFlattenColumnsWidthsRef = useRef(
    calculatedFlattenColumnsWidths,
  );

  onColumnsStateReadyRef.current = columnsConfig?.onColumnsStateReady;
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

  const storageColumnsState = columnsConfig?.storageColumnsState;
  const hasExplicitStorageColumnsState = Array.isArray(storageColumnsState);
  const shouldInitializeColumnsState =
    hasAnyColumnStateFeature || hasExplicitStorageColumnsState;
  const columnsStatePipelineActive =
    shouldInitializeColumnsState || columnsStateInitialized.current;
  const columnsStateKeyChanged =
    prevColumnsStateKey.current !== columnsStateKey;
  const columnsStateKeyResetting =
    columnsStateKeyChanged &&
    (columnsStateInitialized.current || shouldInitializeColumnsState);

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

  const publishColumnsStateSnapshot = useCallback(
    (snapshot: FinalizedColumnsStateSnapshot<T>) => {
      setInnerColumnsState(snapshot.sortedColumnsState);
      setCols(snapshot.treeColumns);
      setFlattenCols(snapshot.flattenColumns);
      setCalculatedFlattenColumnsWidths(snapshot.flattenColumnsWidths);
      requestInitialized();

      if (!columnsStateReadyEmitted.current) {
        columnsStateReadyEmitted.current = true;
        const viewState = getColumnsViewState(snapshot.treeColumns);

        onColumnsStateReadyRef.current?.({
          columnsState: parseColumnsState(snapshot.sortedColumnsState),
          viewState,
        });
      }
    },
    [requestInitialized],
  );

  const getCommittedMergedColumnsState = useCallback(() => {
    if (!columnsState.length) return [];

    const realColumns = filterHiddenColumns(size, mergedColumns);
    return reconcileColumnsState(realColumns, columnsState);
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
    return parseColumnsState(columnsState);
  }, [columnsState]);

  const getActiveColumnsState = useCallback(() => {
    if (previewColumnsState) {
      const committedColumnsState = getCommittedMergedColumnsState();
      const rebasedPreviewColumnsState = committedColumnsState.length
        ? parseColumnsState(
            rebasePreviewColumnsState(
              committedColumnsState,
              previewColumnsState,
            ),
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

  const finalizeCommittedColumnsState = useCallback(
    (state: ColumnState<T>[]) => {
      const realColumns = filterHiddenColumns(size, mergedColumns);
      return finalizeColumnsStateSnapshot({
        containerWidth,
        columnsState: reconcileColumnsState(realColumns, state),
        columnMinWidth,
        leafColumnMinWidth,
        size,
        previewHiddenColumns: false,
      });
    },
    [columnMinWidth, containerWidth, leafColumnMinWidth, mergedColumns, size],
  );

  const finalizePreviewColumnsState = useCallback(
    (state: ColumnState<T>[], previewHiddenColumns = true) => {
      const committedColumnsState = getCommittedMergedColumnsState();
      const renderColumnsState = committedColumnsState.length
        ? rebasePreviewColumnsState(committedColumnsState, state)
        : reconcileColumnsState(
            filterHiddenColumns(size, mergedColumns),
            state,
          );

      return finalizeColumnsStateSnapshot({
        containerWidth,
        columnsState: renderColumnsState,
        columnMinWidth,
        leafColumnMinWidth,
        size,
        previewHiddenColumns,
        previewRestoredKeys: previewBaseHiddenColumnKeys.current,
      });
    },
    [
      columnMinWidth,
      containerWidth,
      getCommittedMergedColumnsState,
      leafColumnMinWidth,
      mergedColumns,
      size,
    ],
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
      const candidateState =
        columnsStatePreviewing && columnsStatePreviewMode === 'visibleHotOnly'
          ? batchPatchColumns(
              previousState.length
                ? previousState
                : parseColumnsState(nextState),
              allowedPatches,
            )
          : parseColumnsState(nextState);

      if (columnsStatePreviewing) {
        const { finalColumnsState } =
          finalizePreviewColumnsState(candidateState);
        setPreviewSession((session) =>
          session
            ? {
                ...session,
                columnsState: finalColumnsState,
                userPatches: [...session.userPatches, ...allowedPatches],
              }
            : session,
        );
        return true;
      }

      const { finalColumnsState, treeColumns } =
        finalizeCommittedColumnsState(candidateState);
      setColumnsState(finalColumnsState);
      columnsConfig?.onColumnsStateChange?.(finalColumnsState, {
        type,
        patches: allowedPatches,
        previousState,
        nextState: finalColumnsState,
        viewState: getColumnsViewState(treeColumns),
        changedKeys: getPatchKeys(allowedPatches),
      });
      return true;
    },
    [
      columnsConfig,
      columnsStatePreviewMode,
      columnsStatePreviewing,
      finalizeCommittedColumnsState,
      finalizePreviewColumnsState,
      getActiveColumnsState,
      getCommittedColumnsState,
      getPreviewAllowedPatches,
    ],
  );

  const commitColumnWidthChange = useCallback(
    (
      type: Extract<ColumnsStateChangeType, 'resizeWidth' | 'autoFillWidth'>,
      patches: ColumnStatePatch<T>[],
      nextFlattenColumnsWidths: number[],
    ) => {
      if (columnsStatePreviewMode === 'visibleHotOnly') return false;
      if (!patches.length || !flattenCols.length) return false;

      const baseColumnsState = hydrateColumnsStateRuntimeWidths(
        getActiveColumnsState(),
        flattenCols,
        nextFlattenColumnsWidths,
      );
      if (!baseColumnsState.length) return false;

      const statePatches = patches.map((patch) => ({
        key: patch.key,
        partial: {
          ...patch.partial,
          autoWidthLocked: true,
        },
      }));
      const nextState = batchPatchColumns(baseColumnsState, statePatches);

      return commitColumnsStateChange(nextState, type, patches);
    },
    [
      columnsStatePreviewMode,
      commitColumnsStateChange,
      flattenCols,
      getActiveColumnsState,
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
    const { finalColumnsState, treeColumns } = finalizePreviewColumnsState(
      getActiveColumnsState(),
      false,
    );
    const compactedPatches = compactUserColumnStatePatches(
      previewSession.baseColumnsState,
      finalColumnsState,
      previewSession.userPatches,
    );
    const patches =
      columnsStatePreviewMode === 'visibleHotOnly'
        ? getPreviewAllowedPatches('visible', compactedPatches)
        : compactedPatches;

    setPreviewSession(null);
    previewBaseHiddenColumnKeys.current = new Set();
    clearFlattenColumnsWidthPreview();

    setColumnsState(finalColumnsState);
    if (!patches.length) return false;

    columnsConfig?.onColumnsStateChange?.(finalColumnsState, {
      type: 'previewSave',
      patches,
      previousState,
      nextState: finalColumnsState,
      viewState: getColumnsViewState(treeColumns),
      changedKeys: getPatchKeys(patches),
    });
    return true;
  }, [
    columnsConfig,
    columnsStatePreviewMode,
    clearFlattenColumnsWidthPreview,
    finalizePreviewColumnsState,
    getCommittedColumnsState,
    getActiveColumnsState,
    getPreviewAllowedPatches,
    previewSession,
  ]);

  const getSortableBaseState = useCallback(() => {
    return innerColumnsState;
  }, [innerColumnsState]);

  const updateSortableColumnsState = useCallback(
    (nextColumnsState: InternalColumnState<T>[]) => {
      const previousState = getActiveColumnsState();
      const sortedState = parseColumnsState(nextColumnsState);
      const patches = collectChangedPatches(
        previousState,
        sortedState,
        'order',
      );
      if (!patches.length) return;

      const state = batchPatchColumns(previousState, patches);
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
      if (!columnsStateKeyResetting) return;

      columnsStateInitialized.current = false;
      columnsStateReadyEmitted.current = false;
      setColumnsState([]);
      setInnerColumnsState([]);
      setPreviewSession(null);
      previewBaseHiddenColumnKeys.current = new Set();
      setPreviewFlattenColumnsWidths(null);
    }
  }, [columnsStateKey, columnsStateKeyResetting]);

  useIsomorphicLayoutEffect(() => {
    if (columnsStateKeyResetting) return;

    if (
      columnsStatePreviewing &&
      (!hasAnyColumnStateFeature ||
        (columnsStatePreviewMode === 'visibleHotOnly' && !visibleColumns))
    ) {
      cancelColumnsStatePreview();
    }
  }, [
    cancelColumnsStatePreview,
    columnsStateKeyResetting,
    columnsStatePreviewMode,
    columnsStatePreviewing,
    hasAnyColumnStateFeature,
    visibleColumns,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (columnsStateKeyResetting) return;

    if (
      !columnsStateInitialized.current &&
      containerWidth &&
      ready &&
      shouldInitializeColumnsState
    ) {
      const noHiddenColumns = filterHiddenColumns(size, mergedColumns);
      const initialColumnsState = hasExplicitStorageColumnsState
        ? mergeStorageColumnsState(noHiddenColumns, storageColumnsState || [])
        : reconcileColumnsState(noHiddenColumns, []);
      const snapshot = finalizeColumnsStateSnapshot({
        containerWidth,
        columnsState: initialColumnsState,
        columnMinWidth,
        leafColumnMinWidth,
        size,
        previewHiddenColumns: false,
      });

      setColumnsState(snapshot.finalColumnsState);
      columnsStateInitialized.current = true;
      publishColumnsStateSnapshot(snapshot);
    }
  }, [
    containerWidth,
    columnsStateKeyResetting,
    columnMinWidth,
    ready,
    shouldInitializeColumnsState,
    hasExplicitStorageColumnsState,
    storageColumnsState,
    mergedColumns,
    leafColumnMinWidth,
    size,
    publishColumnsStateSnapshot,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (columnsStateKeyResetting) return;

    if (containerWidth && columnsState.length) {
      const committedColumnsState = getCommittedMergedColumnsState();

      const currentPreviewColumnsState = previewColumnsState;
      const activeSnapshotColumnsState =
        columnsStatePreviewing && currentPreviewColumnsState?.length
          ? rebasePreviewColumnsState(
              committedColumnsState,
              currentPreviewColumnsState,
            )
          : committedColumnsState;

      const snapshot = finalizeColumnsStateSnapshot({
        containerWidth,
        columnsState: activeSnapshotColumnsState,
        columnMinWidth,
        leafColumnMinWidth,
        size,
        previewHiddenColumns: columnsStatePreviewing,
        previewRestoredKeys: previewBaseHiddenColumnKeys.current,
      });

      if (columnsStatePreviewing && currentPreviewColumnsState?.length) {
        if (
          !isColumnsStateEqual(
            currentPreviewColumnsState,
            snapshot.finalColumnsState,
          )
        ) {
          setPreviewSession((session) =>
            session
              ? { ...session, columnsState: snapshot.finalColumnsState }
              : session,
          );
          return;
        }
      } else if (
        !isColumnsStateEqual(columnsState, snapshot.finalColumnsState)
      ) {
        parseUpdateColumnsState(snapshot.finalColumnsState);
        return;
      }

      publishColumnsStateSnapshot(snapshot);
    }
  }, [
    containerWidth,
    columnsStateKeyResetting,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    columnsState,
    columnsStatePreviewing,
    previewColumnsState,
    getCommittedMergedColumnsState,
    parseUpdateColumnsState,
    publishColumnsStateSnapshot,
  ]);

  /** 使用了列配置的处理 end */

  /** 未使用列配置的处理 start */

  useIsomorphicLayoutEffect(() => {
    if (columnsStateKeyResetting) return;

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
      requestInitialized();
    }
  }, [
    containerWidth,
    columnsStateKeyResetting,
    ready,
    columnsStatePipelineActive,
    mergedColumns,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    requestInitialized,
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
    commitColumnWidthChange,
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
