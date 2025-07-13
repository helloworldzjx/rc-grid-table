import React, { FC, Key, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
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

const Table: FC<TableProps> = (props) => {
  const {
    ready = true,
    rowKey = 'key',
    prefixCls = 'rc-grid-table',
    columns = [],
    columnMinWidth = 100,
    leafColumnMinWidth = 80,
    resizableColumns,
    sortableColumns,
    fixableColumns,
    visibleColumns,
    columnsConfig,
    onScroll,
    ...rest
  } = props;

  const lockContainerWidth = useRef(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [sortableScopeKeys, setSortableScopeKeys] = useState<Key[]>([])
  const [overableScopeKeys, setOverableScopeKeys] = useState<Key[]>([])
  /** 列 */
  const [cols, setCols] = useState<ColumnState[]>([])
  /** 列宽数组 */
  const [flattenColumnsWidths, setFlattenColumnsWidths] = useState<number[]>([])
  /** 展平后的列 */
  const [flattenCols, setFlattenCols] = useState<ColumnState[]>([])
  /** 列隐藏，列拖拽排序，列宽拖拽 */
  const [innerColumnsState, setInnerColumnsState] = useState<ColumnState[]>([])
  const [middleState, setMiddleState] = useState<ColumnState[]>([])
  /** 是否进行了修改表格外观的操作，操作后不再允许通过原columns修改middleState */
  const middleStateUpdated = useRef(false)
  const fixedOffset = useStickyOffsets(flattenColumnsWidths, flattenCols)

  const enableColumnsConfig = useMemo(() => {
    return resizableColumns || sortableColumns || fixableColumns || visibleColumns
  }, [resizableColumns, sortableColumns, fixableColumns, visibleColumns])

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
    if(enableColumnsConfig && columnsConfig?.useStorage && columnsConfig?.columnsState?.length) {
      setMiddleState(columnsConfig.columnsState)
      middleStateUpdated.current = true
    }
  }, [enableColumnsConfig, columnsConfig])

  useEffect(() => {
    if(!middleStateUpdated.current && !lockContainerWidth.current && containerWidth && ready && enableColumnsConfig && (!columnsConfig?.useStorage || !columnsConfig?.columnsState?.length)) {
      const { treeColumns } = columnsWidthDistribute(containerWidth, columns, columnMinWidth, leafColumnMinWidth)
      setMiddleState(treeColumns)
    }
  }, [containerWidth, ready, enableColumnsConfig, columnsConfig, columns, columnMinWidth, leafColumnMinWidth])

  useEffect(() => {
    if(!lockContainerWidth.current && containerWidth && ready && enableColumnsConfig) {
      const realColumns = filterColumns(columns)
      const mergedColumnsState = mergeColumnsState(realColumns, middleState)
      setInnerColumnsState(columnsSort(mergedColumnsState))
    }
  }, [containerWidth, ready, enableColumnsConfig, columns, middleState])

  useEffect(() => {
    if(!lockContainerWidth.current && containerWidth && ready && enableColumnsConfig && innerColumnsState.length) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(containerWidth, innerColumnsState, columnMinWidth, leafColumnMinWidth)
      setCols(treeColumns)
      setFlattenCols(flattenColumns)
      setFlattenColumnsWidths(flattenColumns.map((column) => column.width as number))
      setInitialized(true)
    }
  }, [containerWidth, ready, enableColumnsConfig, innerColumnsState, columnMinWidth, leafColumnMinWidth])

  /** 使用了列配置的处理 end */

  /** 未使用列配置的处理 start ***************************************************************************/

  useEffect(() => {
    if(containerWidth && ready && !enableColumnsConfig) {
      const { flattenColumns, treeColumns } = columnsWidthDistribute(containerWidth, columns, columnMinWidth, leafColumnMinWidth)
      setCols(treeColumns)
      setFlattenCols(flattenColumns)
      setFlattenColumnsWidths(flattenColumns.map((column) => column.width as number))
      setInitialized(true)
    }
  }, [containerWidth, ready, enableColumnsConfig, columns, columnMinWidth, leafColumnMinWidth])

  /** 未使用列配置的处理 end */

  const baseProps: TableContextProps = {
    prefixCls,
    initialized,
    lockContainerWidth: lockContainerWidth.current,
    updateLockContainerWidth,
    containerWidth,
    containerHeight,
    rowKey,
    columns: cols,
    flattenColumnsWidths,
    columnsWidthTotal: flattenColumnsWidths?.reduce((sum, num) => sum + num, 0),
    updateFlattenColumnsWidths: setFlattenColumnsWidths,
    flattenColumns: flattenCols,
    columnMinWidth,
    leafColumnMinWidth,
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
    middleState,
    updateMiddleState: (state) => {
      middleStateUpdated.current = true
      setMiddleState(state)
    },
    innerColumnsState,
    columnsConfig,
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
};

export default Table;
