import ResizeObserver, {
  OnResize as onResizeFn,
} from '@rc-component/resize-observer';
import { useIsomorphicLayoutEffect, useSafeState } from 'ahooks';
import { ConfigProvider as AntdConfigProvider } from 'antd';
import classNames from 'classnames';
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
import { useConfig } from '../configProvider/context';
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
import useColumnsStateController from './hooks/useColumnsStateController';
import useSelection from './hooks/useSelection';
import useStickyOffsets from './hooks/useStickyOffsets';
import type {
  ExpandColumnType,
  RowSortColumnType,
  SelectionColumnType,
  TableProps,
  TableRef,
} from './interface';
import type {
  DataSortContextProps,
  GetComponent,
  TableColumnStateContextProps,
  TableContextProps,
  TableDataContextProps,
  TableLayoutContextProps,
} from './internalInterface';
import ColumnSortableProvider from './providers/ColumnSortableProvider';
import InternalTable from './Table';
import {
  EXPAND_COLUMN,
  ROW_SORT_COLUMN,
  SELECTION_COLUMN,
} from './utils/const';
import {
  filterLeafDataSortOrder,
  normalizeDataSortOrder,
  sortDataSource,
} from './utils/dataSort';
import {
  getColumnsWithInternalColumns,
  getDefaultExpandedRowKeys,
  getRecordKey,
} from './utils/expand';
import { getTablePrefixCls } from './utils/prefixCls';
import { warningInvalidRecordKey } from './utils/warning';

export type { TableProps, TableRef } from './interface';
export { defaultTablePrefixCls } from './utils/prefixCls';

type TableComponent = (<T = any>(
  props: TableProps<T> & React.RefAttributes<TableRef>,
) => ReactElement) & {
  EXPAND_COLUMN: ExpandColumnType;
  SELECTION_COLUMN: SelectionColumnType;
  ROW_SORT_COLUMN: RowSortColumnType;
};

function GridTable<T = any>(props: TableProps<T>, ref: ForwardedRef<TableRef>) {
  const config = useConfig();
  const { componentSize } = AntdConfigProvider.useConfig();
  const {
    ready = true,
    rowKey = 'key',
    prefixCls: customizePrefixCls,
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
    size: customizeSize,
    components,
    onScroll,
    onHeaderRow,
    onHeaderCell,
    onFilterCell,
    onCell,
    onRow,
    className,
    rowClassName,
    bordered,
    stripe,
    rowHoverable = true,
    scrollY,
    getScrollContainer,
    summary,
    sticky,
    virtual = true,
    loading,
    empty,
    style,
    ...nativeProps
  } = props;
  const prefixCls = useMemo(() => {
    return getTablePrefixCls(config.rootPrefixCls, customizePrefixCls);
  }, [config.rootPrefixCls, customizePrefixCls]);
  const mergedSize = customizeSize ?? componentSize ?? 'large';
  const mergedLoading = loading ?? config.gridTable?.loading ?? false;
  const mergedExpandable = useMemo<TableProps<T>['expandable']>(
    () =>
      config.gridTable?.expandable || expandable
        ? {
            ...config.gridTable?.expandable,
            ...expandable,
          }
        : undefined,
    [config.gridTable?.expandable, expandable],
  );
  const mergedClassName = useMemo(
    () => classNames(config.gridTable?.className, className),
    [className, config.gridTable?.className],
  );
  const mergedStyle = useMemo(
    () =>
      config.gridTable?.style || style
        ? {
            ...config.gridTable?.style,
            ...style,
          }
        : undefined,
    [config.gridTable?.style, style],
  );

  /** bug ref https://github.com/helloworldzjx/rc-grid-table/issues/1 */
  const lockContainerWidth = useRef(false);
  const internalTableRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useSafeState(0);
  const [containerHeight, setContainerHeight] = useSafeState(0);
  const [innerExpandedRowKeys, setInnerExpandedRowKeys] = useState<Key[]>(
    () => {
      if (mergedExpandable?.expandedRowKeys)
        return mergedExpandable.expandedRowKeys;
      if (mergedExpandable?.defaultExpandedRowKeys)
        return mergedExpandable.defaultExpandedRowKeys;
      if (mergedExpandable?.defaultExpandAllRows)
        return getDefaultExpandedRowKeys(dataSource, rowKey, mergedExpandable);
      return [];
    },
  );
  const mergedColumns = useMemo(() => {
    return getColumnsWithInternalColumns(
      columns,
      mergedExpandable,
      rowSelection,
      rowSortable,
      mergedSize,
    );
  }, [columns, mergedExpandable, rowSelection, rowSortable, mergedSize]);

  const {
    initialized,
    columns: cols,
    flattenColumns: flattenCols,
    flattenColumnsWidths,
    updateFlattenColumnsWidths,
    clearFlattenColumnsWidthPreview,
    columnsState,
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
  } = useColumnsStateController({
    ready,
    containerWidth,
    mergedColumns,
    columnsConfig,
    columnMinWidth,
    leafColumnMinWidth,
    size: mergedSize,
    resizableColumns,
    sortableColumns,
    fixableColumns,
    visibleColumns,
  });

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
    () => mergedExpandable?.expandedRowKeys ?? innerExpandedRowKeys,
    [mergedExpandable?.expandedRowKeys, innerExpandedRowKeys],
  );

  const onTriggerExpand = useCallback(
    (record: T) => {
      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row expansion', key);
        return;
      }
      const expanded = mergedExpandedRowKeys.includes(key);
      const nextExpandedRowKeys = expanded
        ? mergedExpandedRowKeys.filter((item) => item !== key)
        : [...mergedExpandedRowKeys, key];

      if (!mergedExpandable?.expandedRowKeys) {
        setInnerExpandedRowKeys(nextExpandedRowKeys);
      }

      mergedExpandable?.onExpand?.(!expanded, record);
      mergedExpandable?.onExpandedRowsChange?.(nextExpandedRowKeys);
    },
    [rowKey, mergedExpandable, mergedExpandedRowKeys],
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
    childrenColumnName: mergedExpandable?.childrenColumnName,
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

  const onResize: onResizeFn = useCallback(({ width, height }) => {
    if (!lockContainerWidth.current) {
      setContainerWidth(width);
    }
    setContainerHeight(height);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const element = internalTableRef.current;
    if (!element) {
      return;
    }

    const { width, height } = element.getBoundingClientRect();
    onResize(
      {
        width: Math.floor(width),
        height: Math.floor(height),
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      },
      element,
    );
  }, [onResize]);

  const baseProps: TableContextProps<T> = useMemo(() => {
    return {
      initialized,
      prefixCls,
      virtual,
      loading: mergedLoading,
      rowHoverable,
      getScrollContainer,
      containerWidth,
      containerHeight,
      rowKey,
      dataSource: sortedDataSource,
      columns: cols,
      flattenColumnsWidths: flattenColumnsWidths,
      columnsWidthTotal,
      flattenColumns: flattenCols,
      columnMinWidth,
      leafColumnMinWidth,
      size: mergedSize,
      fixedOffset,
      hasFixedColumns: fixedOffset.hasFixColumns,
      fixColumnsGapped: fixedOffset.fixColumnsGapped,
      resizableColumns,
      fixableColumns,
      visibleColumns,
      columnsConfig,
      onScroll,
    };
  }, [
    initialized,
    prefixCls,
    virtual,
    mergedLoading,
    rowHoverable,
    getScrollContainer,
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
    mergedSize,
    fixedOffset,
    fixedOffset.hasFixColumns,
    fixedOffset.fixColumnsGapped,
    resizableColumns,
    fixableColumns,
    visibleColumns,
    columnsConfig,
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
      columnsStatePreviewing,
      columnsStatePreviewMode,
      columnsConfig,
      updateLockContainerWidth,
      updateFlattenColumnsWidths,
      clearFlattenColumnsWidthPreview,
      commitColumnsStateChange,
      commitColumnWidthChange,
      startColumnsStatePreview,
      saveColumnsStatePreview,
      cancelColumnsStatePreview,
    }),
    [
      resizableColumns,
      fixableColumns,
      visibleColumns,
      columnMinWidth,
      leafColumnMinWidth,
      columnsState,
      columnsStatePreviewing,
      columnsStatePreviewMode,
      columnsConfig,
      updateLockContainerWidth,
      updateFlattenColumnsWidths,
      clearFlattenColumnsWidthPreview,
      commitColumnsStateChange,
      commitColumnWidthChange,
      startColumnsStatePreview,
      saveColumnsStatePreview,
      cancelColumnsStatePreview,
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
      expandable: mergedExpandable,
      mergedExpandedRowKeys,
      onTriggerExpand,
    }),
    [mergedExpandable, mergedExpandedRowKeys, onTriggerExpand],
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
      className: mergedClassName,
      onHeaderRow,
      onHeaderCell,
      onFilterCell,
      onCell,
      onRow,
      rowClassName,
      bordered,
      stripe,
      scrollY,
      summary,
      sticky,
      empty: empty ?? config.gridTable?.empty,
      style: mergedStyle,
    }),
    [
      baseProps,
      mergedClassName,
      onHeaderRow,
      onHeaderCell,
      onFilterCell,
      onCell,
      onRow,
      rowClassName,
      bordered,
      stripe,
      scrollY,
      summary,
      sticky,
      empty,
      config.gridTable?.empty,
      mergedStyle,
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
                              ref={internalTableRef}
                              nativeProps={nativeProps}
                              imperativeRef={ref}
                              startColumnsStatePreview={
                                startColumnsStatePreview
                              }
                              saveColumnsStatePreview={saveColumnsStatePreview}
                              cancelColumnsStatePreview={
                                cancelColumnsStatePreview
                              }
                              setColumnVisible={setColumnVisible}
                              setColumnFixed={setColumnFixed}
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
