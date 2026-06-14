import ResizeObserver, { OnResize } from '@rc-component/resize-observer';
import { useDebounceFn, useIsomorphicLayoutEffect } from 'ahooks';
import React, {
  ForwardedRef,
  Key,
  ReactElement,
  SetStateAction,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { isNum, isValidKey } from '../_utils/validate';
import ComponentsContext from './contexts/ComponentsContext';
import DataSortContext from './contexts/DataSortContext';
import ExpandableContext from './contexts/ExpandableContext';
import PrefixClsContext from './contexts/PrefixClsContext';
import RowSelectionContext from './contexts/RowSelectionContext';
import RowSortableContext from './contexts/RowSortableContext';
import TableColumnStateContext from './contexts/TableColumnStateContext';
import TableContext from './contexts/TableContext';
import TableDataContext from './contexts/TableDataContext';
import TableLayoutContext from './contexts/TableLayoutContext';
import useSelection from './hooks/useSelection';
import useStickyOffsets from './hooks/useStickyOffsets';
import type {
  ColumnState,
  ColumnStatePatch,
  ColumnsStateChangeType,
  ColumnsWidthCommitDecision,
  ExpandColumnType,
  RowSortColumnType,
  SelectionColumnType,
  TableProps,
  TableRef,
} from './interface';
import type {
  DataSortContextProps,
  GetComponent,
  InternalColumnState,
  TableColumnStateContextProps,
  TableContextProps,
  TableDataContextProps,
  TableLayoutContextProps,
} from './internalInterface';
import ColumnSortableProvider from './providers/ColumnSortableProvider';
import InternalTable from './Table';
import { columnsWidthDistribute } from './utils/calc';
import {
  EXPAND_COLUMN,
  ROW_SORT_COLUMN,
  SELECTION_COLUMN,
} from './utils/const';
import {
  getColumnsWithInternalColumns,
  getDefaultExpandedRowKeys,
  getRecordKey,
} from './utils/expand';
import {
  columnsSort,
  filterHiddenColumns,
  getColumnsViewState,
  isColumnsOrderEqual,
  parseColumnsState,
  pickColumnsStatePatches,
} from './utils/handle';
import { mergeColumnsState } from './utils/mergedColumnsState';
import {
  filterLeafDataSortOrder,
  normalizeDataSortOrder,
  sortDataSource,
} from './utils/sort';
import { warningInvalidRecordKey } from './utils/warning';

export type {
  ColumnState,
  ColumnStatePatch,
  ColumnViewState,
  ColumnsStateChangeInfo,
  ColumnsStateChangeType,
  ColumnsWidthCommitDecision,
  ColumnsWidthCommitInfo,
  TableProps,
  TableRef,
} from './interface';

type TableComponent = (<T = any>(
  props: TableProps<T> & React.RefAttributes<TableRef>,
) => ReactElement) & {
  EXPAND_COLUMN: ExpandColumnType;
  SELECTION_COLUMN: SelectionColumnType;
  ROW_SORT_COLUMN: RowSortColumnType;
};

function GridTable<T = any>(props: TableProps<T>, ref: ForwardedRef<TableRef>) {
  const {
    ready = true,
    rowKey = 'key',
    prefixCls = 'rc-grid-table',
    columns = [],
    dataSource = [],
    dataSort,
    expandable,
    rowSelection,
    rowSortable,
    columnMinWidth = 100,
    leafColumnMinWidth = 80,
    resizableColumns,
    sortableColumns,
    fixableColumns,
    visibleColumns,
    columnsConfig,
    size = 'large',
    components,
    onScroll,
    onHeaderRow,
    onRow,
    className,
    rowClassName,
    bordered,
    stripe,
    scrollY,
    summary,
    sticky,
    virtual,
    loading,
    style,
    ...nativeProps
  } = props;

  /** bug ref https://github.com/helloworldzjx/rc-grid-table/issues/1 */
  const lockContainerWidth = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [initialized, setInitialized] = useState(false);
  /** 列 */
  const [cols, setCols] = useState<InternalColumnState<T>[]>([]);
  /** 列宽数组 */
  const [flattenColumnsWidths, setFlattenColumnsWidths] = useState<number[]>(
    [],
  );
  /** 展平后的列 */
  const [flattenCols, setFlattenCols] = useState<InternalColumnState<T>[]>([]);
  /** 列隐藏，列拖拽排序，列宽拖拽、固定列 */
  const [innerColumnsState, setInnerColumnsState] = useState<
    InternalColumnState<T>[]
  >([]);
  const [columnsState, setColumnsState] = useState<ColumnState<T>[]>([]);
  const [temporaryColumnsState, setTemporaryColumnsState] = useState<
    ColumnState<T>[]
  >([]);
  const [innerExpandedRowKeys, setInnerExpandedRowKeys] = useState<Key[]>(
    () => {
      if (expandable?.expandedRowKeys) return expandable.expandedRowKeys;
      if (expandable?.defaultExpandedRowKeys)
        return expandable.defaultExpandedRowKeys;
      if (expandable?.defaultExpandAllRows)
        return getDefaultExpandedRowKeys(dataSource, rowKey, expandable);
      return [];
    },
  );
  /** 初始化后不再允许通过原columns修改columnsState */
  const storageColumnsStateInitialized = useRef(false);
  const columnsStateReadyEmitted = useRef(false);
  const prevWidthScopeKey = useRef(columnsConfig?.widthScopeKey);
  const enableColumnsConfig = useMemo(() => {
    return (
      resizableColumns || sortableColumns || fixableColumns || visibleColumns
    );
  }, [resizableColumns, sortableColumns, fixableColumns, visibleColumns]);

  const mergedColumns = useMemo(() => {
    return getColumnsWithInternalColumns(
      columns,
      expandable,
      rowSelection,
      rowSortable,
      size,
    );
  }, [columns, expandable, rowSelection, rowSortable, size]);

  const fixedOffset = useStickyOffsets(flattenColumnsWidths, flattenCols);

  const columnsWidthTotal = useMemo(() => {
    return flattenColumnsWidths?.reduce(
      (sum, num) => sum + (isNum(num) ? num : 0),
      0,
    );
  }, [flattenColumnsWidths]);

  const normalizedDataSortOrders = useMemo(
    () => normalizeDataSortOrder(dataSort?.sortOrder),
    [dataSort?.sortOrder],
  );

  const mergedDataSortOrders = useMemo(
    () => filterLeafDataSortOrder(cols, normalizedDataSortOrders),
    [cols, normalizedDataSortOrders],
  );

  const sortedDataSource = useMemo(
    () => sortDataSource(dataSource, cols, mergedDataSortOrders),
    [cols, dataSource, mergedDataSortOrders],
  );

  const mergedExpandedRowKeys = useMemo(
    () => expandable?.expandedRowKeys ?? innerExpandedRowKeys,
    [expandable?.expandedRowKeys, innerExpandedRowKeys],
  );

  const onTriggerExpand = useCallback(
    (record: any) => {
      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row expansion', key);
        return;
      }
      const expanded = mergedExpandedRowKeys.includes(key);
      const nextExpandedRowKeys = expanded
        ? mergedExpandedRowKeys.filter((item) => item !== key)
        : [...mergedExpandedRowKeys, key];

      if (!expandable?.expandedRowKeys) {
        setInnerExpandedRowKeys(nextExpandedRowKeys);
      }

      expandable?.onExpand?.(!expanded, record);
      expandable?.onExpandedRowsChange?.(nextExpandedRowKeys);
    },
    [rowKey, expandable, mergedExpandedRowKeys],
  );

  const updateLockContainerWidth = useCallback(
    (dispatch: SetStateAction<boolean>) => {
      const value =
        typeof dispatch === 'function'
          ? dispatch(lockContainerWidth.current)
          : dispatch;
      lockContainerWidth.current = value;
    },
    [],
  );

  const selection = useSelection({
    rowKey,
    dataSource: sortedDataSource,
    rowSelection,
    childrenColumnName: expandable?.childrenColumnName,
  });

  const getComponent: GetComponent = useCallback(
    (path, defaultComponent = 'div') => {
      let component: any = components;

      for (let i = 0; i < path.length; i += 1) {
        component = component?.[path[i]];
        if (component === undefined) {
          return defaultComponent;
        }
      }

      return component || defaultComponent;
    },
    [components],
  );

  const { run: onResize } = useDebounceFn<OnResize>(
    ({ width, height }) => {
      if (!lockContainerWidth.current) {
        setContainerWidth(width);
      }
      setContainerHeight(height);
    },
    { wait: 5 },
  );

  // 统一处理
  const parseUpdateColumnsState = useCallback(
    (input: Array<ColumnState<T> | InternalColumnState<T>>) => {
      setColumnsState(parseColumnsState(input));
    },
    [],
  );

  // 统一处理
  const mergedColumnsConfig = columnsConfig;

  const getCurrentViewState = useCallback(() => {
    return getColumnsViewState(cols);
  }, [cols]);

  const commitColumnsStateChange = useCallback(
    (
      nextState: ColumnState<T>[],
      type: ColumnsStateChangeType,
      patches: ColumnStatePatch<T>[],
    ) => {
      const state = parseColumnsState(nextState);
      const previousState = columnsState;
      setColumnsState(state);
      columnsConfig?.onColumnsStateChange?.(state, {
        type,
        patches,
        previousState,
        nextState: state,
        viewState: getCurrentViewState(),
      });
    },
    [columnsConfig, columnsState, getCurrentViewState],
  );

  const commitWidthColumnsState = useCallback(
    async (
      nextState: ColumnState<T>[],
      type: 'resizeWidth' | 'autoFillWidth',
      patches: ColumnStatePatch<T>[],
    ): Promise<ColumnsWidthCommitDecision> => {
      const state = parseColumnsState(nextState);
      const previousState = columnsState;
      const viewState = getCurrentViewState();
      const changedKeys = patches.map((patch) => patch.key);
      const nextDecision =
        (await columnsConfig?.onBeforeWidthCommit?.({
          type,
          patches,
          previousState,
          nextState: state,
          viewState,
          changedKeys,
          containerWidth,
        })) ?? 'persist';
      const decision: ColumnsWidthCommitDecision = [
        'persist',
        'temporary',
        'cancel',
      ].includes(nextDecision)
        ? nextDecision
        : 'persist';

      if (decision === 'persist') {
        setColumnsState(state);
        columnsConfig?.onColumnsStateChange?.(state, {
          type,
          patches,
          previousState,
          nextState: state,
          viewState,
        });
      } else if (decision === 'temporary') {
        setTemporaryColumnsState(pickColumnsStatePatches(state, patches));
      }

      return decision;
    },
    [columnsConfig, columnsState, containerWidth, getCurrentViewState],
  );

  const getSortableBaseState = useCallback(() => {
    return innerColumnsState;
  }, [innerColumnsState]);

  const updateSortableColumnsState = useCallback(
    (nextColumnsState: InternalColumnState<T>[]) => {
      const state = parseColumnsState(nextColumnsState);
      const patches: ColumnStatePatch<T>[] = state.map((column) => ({
        key: column.key,
        partial: { order: column.order },
      }));
      commitColumnsStateChange(state, 'sort', patches);
    },
    [commitColumnsStateChange],
  );

  /** 使用了列配置的处理 start ***************************************************************************/

  useIsomorphicLayoutEffect(() => {
    if (prevWidthScopeKey.current !== mergedColumnsConfig?.widthScopeKey) {
      prevWidthScopeKey.current = mergedColumnsConfig?.widthScopeKey;
      setTemporaryColumnsState([]);
    }
  }, [mergedColumnsConfig?.widthScopeKey]);

  useIsomorphicLayoutEffect(() => {
    if (
      !storageColumnsStateInitialized.current &&
      containerWidth &&
      ready &&
      enableColumnsConfig
    ) {
      if (
        mergedColumnsConfig &&
        'storageColumnsState' in mergedColumnsConfig &&
        !mergedColumnsConfig.storageColumnsState
      ) {
        return;
      }

      const { treeColumns } = columnsWidthDistribute(
        containerWidth,
        mergedColumns,
        columnMinWidth,
        leafColumnMinWidth,
        size,
      );
      const initialColumnsState = mergedColumnsConfig?.storageColumnsState
        ?.length
        ? mergeColumnsState(
            treeColumns,
            mergedColumnsConfig.storageColumnsState,
          )
        : treeColumns;
      parseUpdateColumnsState(initialColumnsState);
      storageColumnsStateInitialized.current = true;
    }
  }, [
    containerWidth,
    ready,
    enableColumnsConfig,
    mergedColumnsConfig,
    mergedColumns,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    parseUpdateColumnsState,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (containerWidth && columnsState.length) {
      const realColumns = filterHiddenColumns(size, mergedColumns);
      let mergedColumnsState = mergeColumnsState(realColumns, columnsState);
      if (mergedColumnsConfig?.columnsState?.length) {
        mergedColumnsState = mergeColumnsState(
          mergedColumnsState,
          mergedColumnsConfig.columnsState,
        );
      }
      if (temporaryColumnsState.length) {
        mergedColumnsState = mergeColumnsState(
          mergedColumnsState,
          temporaryColumnsState,
        );
      }

      if (
        !mergedColumnsConfig?.columnsState?.length &&
        !isColumnsOrderEqual(mergedColumnsState, columnsState)
      ) {
        // 如果input columns对比columnsState有增删，则立刻更新columnsState
        parseUpdateColumnsState(mergedColumnsState);
      }
      setInnerColumnsState(columnsSort(mergedColumnsState));
    }
  }, [
    containerWidth,
    mergedColumns,
    columnsState,
    mergedColumnsConfig,
    temporaryColumnsState,
    size,
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
      );
      const nextFlattenColumnsWidths = flattenColumns.map(
        (column) => column.width as number,
      );

      setCols(treeColumns);
      setFlattenCols(flattenColumns);
      setFlattenColumnsWidths(nextFlattenColumnsWidths);
      setInitialized(true);

      if (!columnsStateReadyEmitted.current) {
        columnsStateReadyEmitted.current = true;
        mergedColumnsConfig?.onColumnsStateReady?.({
          columnsState: parseColumnsState(treeColumns),
          viewState: getColumnsViewState(treeColumns),
        });
      }
    }
  }, [
    containerWidth,
    innerColumnsState,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    mergedColumnsConfig,
  ]);

  /** 使用了列配置的处理 end */

  /** 未使用列配置的处理 start ***************************************************************************/

  useIsomorphicLayoutEffect(() => {
    if (containerWidth && ready && !enableColumnsConfig) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(
        containerWidth,
        mergedColumns,
        columnMinWidth,
        leafColumnMinWidth,
        size,
      );
      setCols(treeColumns);
      setFlattenCols(flattenColumns);
      setFlattenColumnsWidths(
        flattenColumns.map((column) => column.width as number),
      );
      setInitialized(true);
    }
  }, [
    containerWidth,
    ready,
    enableColumnsConfig,
    mergedColumns,
    columnMinWidth,
    leafColumnMinWidth,
    size,
  ]);

  /** 未使用列配置的处理 end */

  const baseProps: TableContextProps<T> = useMemo(() => {
    return {
      initialized,
      updateLockContainerWidth,
      containerWidth,
      containerHeight,
      rowKey,
      dataSource: sortedDataSource,
      columns: cols,
      flattenColumnsWidths: flattenColumnsWidths,
      columnsWidthTotal,
      updateFlattenColumnsWidths: setFlattenColumnsWidths,
      flattenColumns: flattenCols,
      columnMinWidth,
      leafColumnMinWidth,
      size,
      fixedOffset,
      hasFixedColumns: fixedOffset.hasFixColumns,
      fixColumnsGapped: fixedOffset.fixColumnsGapped,
      resizableColumns,
      fixableColumns,
      visibleColumns,
      columnsState,
      commitColumnsStateChange,
      commitWidthColumnsState,
      columnsConfig: mergedColumnsConfig,
      onScroll,
    };
  }, [
    initialized,
    updateLockContainerWidth,
    containerWidth,
    containerHeight,
    rowKey,
    sortedDataSource,
    cols,
    flattenColumnsWidths,
    columnsWidthTotal,
    flattenCols,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    fixedOffset,
    fixedOffset.hasFixColumns,
    fixedOffset.fixColumnsGapped,
    resizableColumns,
    fixableColumns,
    visibleColumns,
    columnsState,
    commitColumnsStateChange,
    commitWidthColumnsState,
    mergedColumnsConfig,
    onScroll,
  ]);

  const tableDataContextValue = useMemo<TableDataContextProps<T>>(
    () => ({
      rowKey,
      dataSource: sortedDataSource,
    }),
    [rowKey, sortedDataSource],
  );

  const dataSortContextValue = useMemo<DataSortContextProps>(
    () => ({
      dataSort,
      dataSortOrders: mergedDataSortOrders,
    }),
    [dataSort, mergedDataSortOrders],
  );

  const tableLayoutContextValue = useMemo<TableLayoutContextProps<T>>(
    () => ({
      containerWidth,
      containerHeight,
      columns: cols,
      flattenColumns: flattenCols,
      flattenColumnsWidths: flattenColumnsWidths,
      columnsWidthTotal,
      fixedOffset,
      hasFixedColumns: fixedOffset.hasFixColumns,
      fixColumnsGapped: fixedOffset.fixColumnsGapped,
    }),
    [
      containerWidth,
      containerHeight,
      cols,
      flattenCols,
      flattenColumnsWidths,
      columnsWidthTotal,
      fixedOffset,
      fixedOffset.hasFixColumns,
      fixedOffset.fixColumnsGapped,
    ],
  );

  const tableColumnStateContextValue = useMemo<TableColumnStateContextProps<T>>(
    () => ({
      resizableColumns,
      fixableColumns,
      visibleColumns,
      columnMinWidth,
      leafColumnMinWidth,
      columnsState,
      columnsConfig: mergedColumnsConfig,
      updateLockContainerWidth,
      updateFlattenColumnsWidths: setFlattenColumnsWidths,
      commitColumnsStateChange,
      commitWidthColumnsState,
    }),
    [
      resizableColumns,
      fixableColumns,
      visibleColumns,
      columnMinWidth,
      leafColumnMinWidth,
      columnsState,
      mergedColumnsConfig,
      updateLockContainerWidth,
      commitColumnsStateChange,
      commitWidthColumnsState,
    ],
  );

  const componentsContextValue = useMemo(
    () => ({
      components,
      getComponent,
    }),
    [components, getComponent],
  );

  const expandableContextValue = useMemo(
    () => ({
      expandable,
      mergedExpandedRowKeys,
      onTriggerExpand,
    }),
    [expandable, mergedExpandedRowKeys, onTriggerExpand],
  );

  const rowSelectionContextValue = useMemo(
    () => ({
      rowSelection,
      selection,
    }),
    [rowSelection, selection],
  );

  const rowSortableContextValue = useMemo(
    () => ({
      rowSortable,
    }),
    [rowSortable],
  );

  const sortablePreviewSource = useMemo(
    () => ({
      flattenColumns: flattenCols,
      flattenColumnsWidths: flattenColumnsWidths,
    }),
    [flattenCols, flattenColumnsWidths],
  );

  const tableContextValue = useMemo(
    () => ({
      ...baseProps,
      className,
      onHeaderRow,
      onRow,
      rowClassName,
      bordered,
      stripe,
      scrollY,
      summary,
      sticky,
      virtual,
      loading,
      style,
    }),
    [
      baseProps,
      className,
      onHeaderRow,
      onRow,
      rowClassName,
      bordered,
      stripe,
      scrollY,
      summary,
      sticky,
      virtual,
      loading,
      style,
    ],
  );

  return (
    <PrefixClsContext.Provider value={prefixCls}>
      <TableContext.Provider value={tableContextValue}>
        <DataSortContext.Provider value={dataSortContextValue}>
          <TableDataContext.Provider value={tableDataContextValue}>
            <TableLayoutContext.Provider value={tableLayoutContextValue}>
              <TableColumnStateContext.Provider
                value={tableColumnStateContextValue}
              >
                <ComponentsContext.Provider value={componentsContextValue}>
                  <ExpandableContext.Provider value={expandableContextValue}>
                    <RowSelectionContext.Provider
                      value={rowSelectionContextValue}
                    >
                      <RowSortableContext.Provider
                        value={rowSortableContextValue}
                      >
                        <ColumnSortableProvider
                          sortableColumns={sortableColumns}
                          baseColumnsState={getSortableBaseState()}
                          updateSortableColumnsState={
                            updateSortableColumnsState
                          }
                          previewSource={sortablePreviewSource}
                        >
                          <ResizeObserver onResize={onResize}>
                            <InternalTable
                              nativeProps={nativeProps}
                              tableRef={ref}
                            />
                          </ResizeObserver>
                        </ColumnSortableProvider>
                      </RowSortableContext.Provider>
                    </RowSelectionContext.Provider>
                  </ExpandableContext.Provider>
                </ComponentsContext.Provider>
              </TableColumnStateContext.Provider>
            </TableLayoutContext.Provider>
          </TableDataContext.Provider>
        </DataSortContext.Provider>
      </TableContext.Provider>
    </PrefixClsContext.Provider>
  );
}

const Table = forwardRef(GridTable) as unknown as TableComponent;

Table.EXPAND_COLUMN = EXPAND_COLUMN;
Table.SELECTION_COLUMN = SELECTION_COLUMN;
Table.ROW_SORT_COLUMN = ROW_SORT_COLUMN;

export default Table;
