import React, { FC, Key, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ResizeObserver, { OnResize } from "@rc-component/resize-observer"

import TableContext from './context';
import GridTable from './Table';
import { ColumnState, TableContextProps, type TableProps } from './interface';
import { columnsWidthDistribute } from './utils/calc';
import { columnsSort, filterColumns } from './utils/handle';
import { mergeColumnsState } from './utils/mergedColumnsState';
import useStickyOffsets from './hooks/useStickyOffsets';
import ScrollProvider from './scrollContext';
import { useDebounceFn } from 'ahooks';
import { EXPAND_COLUMN, SELECTION_COLUMN } from './utils/const';
import { getColumnsWithInternalColumns, getDefaultExpandedRowKeys, getRecordKey } from './utils/expand';
import { ExpandColumnType, SelectionColumnType } from './interface';
import useSelection from './hooks/useSelection';

type TableComponent = FC<TableProps> & {
  EXPAND_COLUMN: ExpandColumnType;
  SELECTION_COLUMN: SelectionColumnType;
}

const isColumnsOrderEqual = (a: ColumnState[] = [], b: ColumnState[] = []): boolean => {
  if(a.length !== b.length) return false

  return a.every((column, index) => {
    const target = b[index]
    return !!target
      && column.key === target.key
      && column.order === target.order
      && isColumnsOrderEqual(column.children || [], target.children || [])
  })
}

const Table: TableComponent = ((props) => {
  const {
    ready = true,
    rowKey = 'key',
    prefixCls = 'rc-grid-table',
    columns = [],
    dataSource = [],
    expandable,
    rowSelection,
    columnMinWidth = 100,
    leafColumnMinWidth = 80,
    resizableColumns,
    sortableColumns,
    fixableColumns,
    visibleColumns,
    columnsConfig,
    size = 'large',
    onScroll,
    ...rest
  } = props;

  const lockContainerWidth = useRef(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [sortableScopeKeys, setSortableScopeKeys] = useState<Key[]>([])
  const [overableScopeKeys, setOverableScopeKeys] = useState<Key[]>([])
  const [sortableInsertIndicator, setSortableInsertIndicator] = useState<{ key: Key, placement: 'start' | 'end' } | null>(null)
  /** 列 */
  const [cols, setCols] = useState<ColumnState[]>([])
  /** 列宽数组 */
  const [flattenColumnsWidths, setFlattenColumnsWidths] = useState<number[]>([])
  /** 展平后的列 */
  const [flattenCols, setFlattenCols] = useState<ColumnState[]>([])
  /** 列隐藏，列拖拽排序，列宽拖拽 */
  const [innerColumnsState, setInnerColumnsState] = useState<ColumnState[]>([])
  const [middleState, setMiddleState] = useState<ColumnState[]>([])
  const [innerExpandedRowKeys, setInnerExpandedRowKeys] = useState<Key[]>(() => {
    if(expandable?.expandedRowKeys) return expandable.expandedRowKeys;
    if(expandable?.defaultExpandedRowKeys) return expandable.defaultExpandedRowKeys;
    if(expandable?.defaultExpandAllRows) return getDefaultExpandedRowKeys(dataSource, rowKey, expandable);
    return [];
  })
  /** 是否进行了修改表格外观的操作，操作后不再允许通过原columns修改middleState */
  const middleStateUpdated = useRef(false)
  const fixedOffset = useStickyOffsets(flattenColumnsWidths, flattenCols)

  const enableColumnsConfig = useMemo(() => {
    return resizableColumns || sortableColumns || fixableColumns || visibleColumns
  }, [resizableColumns, sortableColumns, fixableColumns, visibleColumns])

  const mergedColumns = useMemo(() => {
    return getColumnsWithInternalColumns(columns, expandable, rowSelection, size)
  }, [columns, expandable, rowSelection, size])

  const mergedExpandedRowKeys = expandable?.expandedRowKeys ?? innerExpandedRowKeys
  const selection = useSelection({
    rowKey,
    dataSource,
    rowSelection,
    childrenColumnName: expandable?.childrenColumnName,
  })

  const onTriggerExpand = useCallback((record: any) => {
    const key = getRecordKey(record, rowKey)
    const expanded = mergedExpandedRowKeys.includes(key)
    const nextExpandedRowKeys = expanded
      ? mergedExpandedRowKeys.filter((item) => item !== key)
      : [...mergedExpandedRowKeys, key]

    if(!expandable?.expandedRowKeys) {
      setInnerExpandedRowKeys(nextExpandedRowKeys)
    }

    expandable?.onExpand?.(!expanded, record)
    expandable?.onExpandedRowsChange?.(nextExpandedRowKeys)
  }, [rowKey, expandable, mergedExpandedRowKeys])

  const updateLockContainerWidth = (dispatch: SetStateAction<boolean>) => {
    const value = typeof dispatch === 'function' ? dispatch(lockContainerWidth.current) : dispatch
    lockContainerWidth.current = value
  };

  const { run: onResize } = useDebounceFn<OnResize>(({width, height}) => {
    setContainerWidth(width)
    setContainerHeight(height)
  }, { wait: 5 })

  /** 使用了列配置的处理 start ***************************************************************************/

  useEffect(() => {
    if(ready && enableColumnsConfig && columnsConfig?.useStorage && columnsConfig?.columnsState?.length) {
      setMiddleState(columnsConfig.columnsState)
      middleStateUpdated.current = true
    }
  }, [ready, enableColumnsConfig, columnsConfig])

  useEffect(() => {
    if(!middleStateUpdated.current && !lockContainerWidth.current && containerWidth && ready && enableColumnsConfig && (!columnsConfig?.useStorage || (columnsConfig?.useStorage && !columnsConfig?.columnsState?.length))) {
      const { treeColumns } = columnsWidthDistribute(containerWidth, mergedColumns, columnMinWidth, leafColumnMinWidth, size)
      setMiddleState(treeColumns)
    }
  }, [containerWidth, ready, enableColumnsConfig, columnsConfig, mergedColumns, columnMinWidth, leafColumnMinWidth, size])

  useEffect(() => {
    if(!lockContainerWidth.current && containerWidth && middleState.length) {
      const realColumns = filterColumns(size, mergedColumns)
      const mergedColumnsState = mergeColumnsState(realColumns, middleState)
      
      if(!isColumnsOrderEqual(mergedColumnsState, middleState)) {
        setMiddleState(mergedColumnsState)
      }
      setInnerColumnsState(columnsSort(mergedColumnsState))
    }
  }, [containerWidth, mergedColumns, middleState, size])

  useEffect(() => {
    if(!lockContainerWidth.current && containerWidth && innerColumnsState.length) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(containerWidth, innerColumnsState, columnMinWidth, leafColumnMinWidth, size)
      setCols(treeColumns)
      setFlattenCols(flattenColumns)
      setFlattenColumnsWidths(flattenColumns.map((column) => column.width as number))
      setInitialized(true)
    }
  }, [containerWidth, innerColumnsState, columnMinWidth, leafColumnMinWidth, size])

  /** 使用了列配置的处理 end */

  /** 未使用列配置的处理 start ***************************************************************************/

  useEffect(() => {
    if(containerWidth && ready && !enableColumnsConfig) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(containerWidth, mergedColumns, columnMinWidth, leafColumnMinWidth, size)
      setCols(treeColumns)
      setFlattenCols(flattenColumns)
      setFlattenColumnsWidths(flattenColumns.map((column) => column.width as number))
      setInitialized(true)
    }
  }, [containerWidth, ready, enableColumnsConfig, mergedColumns, columnMinWidth, leafColumnMinWidth, size])

  /** 未使用列配置的处理 end */

  const baseProps: TableContextProps = {
    prefixCls,
    initialized,
    lockContainerWidth: lockContainerWidth.current,
    updateLockContainerWidth,
    containerWidth,
    containerHeight,
    rowKey,
    dataSource,
    expandable,
    rowSelection,
    mergedExpandedRowKeys,
    onTriggerExpand,
    columns: cols,
    flattenColumnsWidths,
    columnsWidthTotal: flattenColumnsWidths?.reduce((sum, num) => sum + num, 0),
    updateFlattenColumnsWidths: setFlattenColumnsWidths,
    flattenColumns: flattenCols,
    columnMinWidth,
    leafColumnMinWidth,
    size,
    fixedOffset,
    hasFixedColumns: fixedOffset.hasFixColumns,
    fixColumnsGapped: fixedOffset.fixColumnsGapped,
    resizableColumns,
    sortableColumns,
    fixableColumns,
    visibleColumns,
    sortableScopeKeys,
    updateSortableScopeKeys: setSortableScopeKeys,
    overableScopeKeys,
    updateOverableScopeKeys: setOverableScopeKeys,
    sortableInsertIndicator,
    updateSortableInsertIndicator: setSortableInsertIndicator,
    middleState,
    updateMiddleState: (state) => {
      middleStateUpdated.current = true
      setMiddleState(state)
    },
    innerColumnsState,
    columnsConfig,
    selection,
  };

  return (
    <TableContext.Provider value={{ ...baseProps, ...rest }}>
      <ScrollProvider onScroll={onScroll}>
        <ResizeObserver onResize={onResize}>
          <GridTable />
        </ResizeObserver>
      </ScrollProvider>
    </TableContext.Provider>
  );
}) as TableComponent;

Table.EXPAND_COLUMN = EXPAND_COLUMN;
Table.SELECTION_COLUMN = SELECTION_COLUMN;

export default Table;
