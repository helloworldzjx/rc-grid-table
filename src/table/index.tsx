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
import ColumnSortableContext from './columnSortableContext';
import ComponentsContext from './componentsContext';
import TableContext from './context';
import ExpandableContext from './expandableContext';
import useSelection from './hooks/useSelection';
import useStickyOffsets from './hooks/useStickyOffsets';
import {
  ColumnState,
  ExpandColumnType,
  GetComponent,
  RowSortColumnType,
  SelectionColumnType,
  TableContextProps,
  type TableProps,
  type TableRef,
} from './interface';
import PrefixClsContext from './prefixClsContext';
import RowSelectionContext from './rowSelectionContext';
import RowSortableContext from './rowSortableContext';
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
  filterColumns,
  getSortablePreviewColumns,
  isColumnsOrderEqual,
  parseMiddleState,
} from './utils/handle';
import { mergeColumnsState } from './utils/mergedColumnsState';
import { warningInvalidRecordKey } from './utils/warning';

export type { TableProps, TableRef } from './interface';

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
    ...rest
  } = props;

  /** bug ref https://github.com/helloworldzjx/rc-grid-table/issues/1 */
  const lockContainerWidth = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [initialized, setInitialized] = useState(false);
  /** 列 */
  const [cols, setCols] = useState<ColumnState<T>[]>([]);
  /** 列宽数组 */
  const [flattenColumnsWidths, setFlattenColumnsWidths] = useState<number[]>(
    [],
  );
  /** 展平后的列 */
  const [flattenCols, setFlattenCols] = useState<ColumnState<T>[]>([]);
  /** 列隐藏，列拖拽排序，列宽拖拽、固定列 */
  const [innerColumnsState, setInnerColumnsState] = useState<ColumnState<T>[]>(
    [],
  );
  const [middleState, setMiddleState] = useState<ColumnState<T>[]>([]);
  const [sortableDraftState, setSortableDraftState] = useState<
    ColumnState<T>[] | null
  >(null);
  const [sortingColumns, setSortingColumns] = useState(false);
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
  /** 是否进行了修改表格外观的操作，操作后不再允许通过原columns修改middleState */
  const middleStateUpdated = useRef(false);
  const sortablePreviewSourceRef = useRef<{
    flattenColumns: ColumnState<T>[];
    flattenColumnsWidths: number[];
  } | null>(null);
  const latestRenderedColumnsRef = useRef<{
    flattenColumns: ColumnState<T>[];
    flattenColumnsWidths: number[];
  }>({
    flattenColumns: [],
    flattenColumnsWidths: [],
  });
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

  const renderedColumnsState = useMemo(() => {
    return sortableDraftState
      ? columnsSort(sortableDraftState)
      : innerColumnsState;
  }, [sortableDraftState, innerColumnsState]);

  const sortablePreviewColumns = useMemo(() => {
    if (
      !containerWidth ||
      !sortableDraftState ||
      !renderedColumnsState.length
    ) {
      return null;
    }

    const previewSource =
      sortablePreviewSourceRef.current ?? latestRenderedColumnsRef.current;

    return getSortablePreviewColumns(
      renderedColumnsState,
      previewSource.flattenColumns,
      previewSource.flattenColumnsWidths,
    );
  }, [containerWidth, renderedColumnsState, sortableDraftState]);

  const renderedCols = useMemo(
    () => sortablePreviewColumns?.treeColumns ?? cols,
    [cols, sortablePreviewColumns],
  );
  const renderedFlattenCols = useMemo(
    () => sortablePreviewColumns?.flattenColumns ?? flattenCols,
    [flattenCols, sortablePreviewColumns],
  );
  const renderedFlattenColumnsWidths = useMemo(
    () => sortablePreviewColumns?.flattenColumnsWidths ?? flattenColumnsWidths,
    [flattenColumnsWidths, sortablePreviewColumns],
  );

  const fixedOffset = useStickyOffsets(
    renderedFlattenColumnsWidths,
    renderedFlattenCols,
  );

  const latestRenderedColumns = useMemo(
    () => ({
      flattenColumns: renderedFlattenCols,
      flattenColumnsWidths: renderedFlattenColumnsWidths,
    }),
    [renderedFlattenCols, renderedFlattenColumnsWidths],
  );

  latestRenderedColumnsRef.current = latestRenderedColumns;

  const columnsWidthTotal = useMemo(() => {
    return renderedFlattenColumnsWidths?.reduce(
      (sum, num) => sum + (isNum(num) ? num : 0),
      0,
    );
  }, [renderedFlattenColumnsWidths]);

  const mergedExpandedRowKeys = useMemo(
    () => expandable?.expandedRowKeys ?? innerExpandedRowKeys,
    [expandable?.expandedRowKeys, innerExpandedRowKeys],
  );
  const selection = useSelection({
    rowKey,
    dataSource,
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
  const parseUpdateMiddleState = useCallback((input: ColumnState[]) => {
    const state = parseMiddleState(input);
    setMiddleState(state);
  }, []);

  const updateMiddleState = useCallback(
    (dispatch: SetStateAction<ColumnState<T>[]>) => {
      middleStateUpdated.current = true;
      const state =
        typeof dispatch === 'function' ? dispatch(middleState) : dispatch;
      parseUpdateMiddleState(state);
    },
    [parseUpdateMiddleState],
  );

  const getSortableBaseState = useCallback(() => {
    return (
      sortableDraftState ||
      (innerColumnsState.length ? innerColumnsState : middleState)
    );
  }, [innerColumnsState, middleState, sortableDraftState]);

  // 统一处理
  const mergedColumnsConfig = useMemo(() => {
    return {
      ...columnsConfig,
      onChange: (columnsState: ColumnState<T>[]) => {
        const state = parseMiddleState(columnsState);
        columnsConfig?.onChange?.(state);
      },
    };
  }, [columnsConfig]);

  const updateSortableColumnsState = useCallback(
    (columnsState: ColumnState<T>[]) => {
      updateMiddleState(columnsState);
      mergedColumnsConfig?.onChange?.(columnsState);
    },
    [mergedColumnsConfig, updateMiddleState],
  );

  /** 使用了列配置的处理 start ***************************************************************************/

  useIsomorphicLayoutEffect(() => {
    if (
      ready &&
      enableColumnsConfig &&
      mergedColumnsConfig?.useStorage &&
      mergedColumnsConfig?.columnsState?.length
    ) {
      parseUpdateMiddleState(mergedColumnsConfig.columnsState);
      middleStateUpdated.current = true;
    }
  }, [ready, enableColumnsConfig, mergedColumnsConfig, parseUpdateMiddleState]);

  useIsomorphicLayoutEffect(() => {
    if (
      !middleStateUpdated.current &&
      containerWidth &&
      ready &&
      enableColumnsConfig &&
      (!mergedColumnsConfig?.useStorage ||
        (mergedColumnsConfig?.useStorage &&
          !mergedColumnsConfig?.columnsState?.length))
    ) {
      const { treeColumns } = columnsWidthDistribute(
        containerWidth,
        mergedColumns,
        columnMinWidth,
        leafColumnMinWidth,
        size,
      );
      parseUpdateMiddleState(treeColumns);
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
    parseUpdateMiddleState,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (containerWidth && middleState.length) {
      const realColumns = filterColumns(size, mergedColumns);
      const mergedColumnsState = mergeColumnsState(realColumns, middleState);

      if (!isColumnsOrderEqual(mergedColumnsState, middleState)) {
        parseUpdateMiddleState(mergedColumnsState);
      }
      setInnerColumnsState(columnsSort(mergedColumnsState));
      if (
        sortableDraftState &&
        isColumnsOrderEqual(mergedColumnsState, sortableDraftState)
      ) {
        setSortableDraftState(null);
      }
    }
  }, [
    containerWidth,
    mergedColumns,
    middleState,
    sortableDraftState,
    size,
    parseUpdateMiddleState,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (containerWidth && renderedColumnsState.length && !sortableDraftState) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(
        containerWidth,
        renderedColumnsState,
        columnMinWidth,
        leafColumnMinWidth,
        size,
      );
      const nextFlattenColumnsWidths = flattenColumns.map(
        (column) => column.width as number,
      );

      sortablePreviewSourceRef.current = {
        flattenColumns,
        flattenColumnsWidths: nextFlattenColumnsWidths,
      };

      setCols(treeColumns);
      setFlattenCols(flattenColumns);
      setFlattenColumnsWidths(nextFlattenColumnsWidths);
      setInitialized(true);
    }
  }, [
    containerWidth,
    renderedColumnsState,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    sortableDraftState,
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
      dataSource,
      columns: renderedCols,
      flattenColumnsWidths: renderedFlattenColumnsWidths,
      columnsWidthTotal,
      updateFlattenColumnsWidths: setFlattenColumnsWidths,
      flattenColumns: renderedFlattenCols,
      columnMinWidth,
      leafColumnMinWidth,
      size,
      fixedOffset,
      hasFixedColumns: fixedOffset.hasFixColumns,
      fixColumnsGapped: fixedOffset.fixColumnsGapped,
      resizableColumns,
      fixableColumns,
      visibleColumns,
      middleState,
      updateMiddleState,
      columnsConfig: mergedColumnsConfig,
      onScroll,
    };
  }, [
    initialized,
    updateLockContainerWidth,
    containerWidth,
    containerHeight,
    rowKey,
    dataSource,
    renderedCols,
    renderedFlattenColumnsWidths,
    columnsWidthTotal,
    renderedFlattenCols,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    fixedOffset,
    fixedOffset.hasFixColumns,
    fixedOffset.fixColumnsGapped,
    resizableColumns,
    fixableColumns,
    visibleColumns,
    middleState,
    updateMiddleState,
    mergedColumnsConfig,
    onScroll,
  ]);

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

  const columnSortableContextValue = useMemo(
    () => ({
      sortableColumns,
      sortableDraftState,
      updateSortableDraftState: setSortableDraftState,
      getSortableBaseState,
      updateSortableColumnsState,
      sortingColumns,
      updateSortingColumns: setSortingColumns,
    }),
    [
      sortableColumns,
      sortableDraftState,
      getSortableBaseState,
      updateSortableColumnsState,
      sortingColumns,
    ],
  );

  const tableContextValue = useMemo(
    () => ({ ...baseProps, ...rest }),
    [baseProps, rest],
  );

  return (
    <PrefixClsContext.Provider value={prefixCls}>
      <TableContext.Provider value={tableContextValue}>
        <ComponentsContext.Provider value={componentsContextValue}>
          <ExpandableContext.Provider value={expandableContextValue}>
            <RowSelectionContext.Provider value={rowSelectionContextValue}>
              <RowSortableContext.Provider value={rowSortableContextValue}>
                <ColumnSortableContext.Provider
                  value={columnSortableContextValue}
                >
                  <ResizeObserver onResize={onResize}>
                    <InternalTable tableRef={ref} />
                  </ResizeObserver>
                </ColumnSortableContext.Provider>
              </RowSortableContext.Provider>
            </RowSelectionContext.Provider>
          </ExpandableContext.Provider>
        </ComponentsContext.Provider>
      </TableContext.Provider>
    </PrefixClsContext.Provider>
  );
}

const Table = forwardRef(GridTable) as unknown as TableComponent;

Table.EXPAND_COLUMN = EXPAND_COLUMN;
Table.SELECTION_COLUMN = SELECTION_COLUMN;
Table.ROW_SORT_COLUMN = ROW_SORT_COLUMN;

export default Table;
