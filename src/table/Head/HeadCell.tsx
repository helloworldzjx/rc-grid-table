import React, { CSSProperties, Key, useMemo } from "react";
import classNames from "classnames";
import { useSortable } from "@dnd-kit/sortable";
import { useDndMonitor } from "@dnd-kit/core";

import Resizable from "./Resizable";
import { getCellFixedInfo } from "../utils/fixedColumns"
import { filterSpan, getKeysByClassify, getEllipsisTitle, findNodeByKey, replaceTreeNode } from "../utils/handle"
import { useTableContext } from "../context"
import { useStyles } from "../style"
import { CellType, ColumnState } from "../interface";
import { getMergedSpanKeys } from "../utils/calc";
import { isSelectionColumn } from "../utils/const";
import { SelectionCheckbox } from "../Selection";

interface HeadCellProps<T = any> {
  column: CellType<T>
  columnIndex: number
  rowIndex: number
  /** 最后一列的parentKey */
  prevRowLastCellKey?: Key
  /** 当前行的最大index */
  currentRowLastIndex: number
  /** rows最大index */
  rowsLastIndex: number
}

function HeadCell({
  rowIndex,
  column: col,
  columnIndex: colIndex,
  prevRowLastCellKey,
  currentRowLastIndex,
  rowsLastIndex,
}: HeadCellProps) {
  const {
    flattenColumns = [], 
    resizableColumns,
    sortableColumns,
    sortableScopeKeys,
    overableScopeKeys,
    sortableInsertIndicator,
    fixedOffset,
    middleState,
    updateMiddleState,
    columnsConfig,
    rowSelection,
    selection,
  } = useTableContext();

  const {
    cellCls, 
    cellEllipsisCls, 
    cellEllipsisInnerCls, 
    selectionCellCls,
    headLastCellCls,
    headSortableCellCls,
    sortableColumnCellCls,
    overableColumnCellCls,
    headCellInsertStartCls,
    headCellInsertEndCls,
    headCellInsertLineCls,
    cellFixedStartCls, 
    cellFixedStartLastCls, 
    cellFixedEndCls, 
    cellFixedEndFirstCls,
  } = useStyles();

  const fixedInfo = useMemo(() => {
    return getCellFixedInfo(col.colStart as number, col.colEnd as number, flattenColumns, fixedOffset)
  }, [col.colStart, col.colEnd, flattenColumns, fixedOffset])

  /** 
   * 最后一列不显示右侧border
   * 判断当前列是否为最后一列：
   * 当前列是否为第一行的最后一列；
   * 当前列是否是最后一行的列，且当前列的parentKey是否为上一行最后一列的key；
   * 当前列非第一行和最后一行的列，则判断当前列的parentKey是否为上一行最后一列的key 
   */
  const hasHeadLastCellCls = useMemo(() => {
    if(rowIndex === 0) {
      return colIndex === currentRowLastIndex
    } else if (rowIndex === rowsLastIndex) {
      return (col.column?.parentKey === prevRowLastCellKey && col.column?.key === flattenColumns[flattenColumns.length - 1].key)
    }

    return col.column?.parentKey === prevRowLastCellKey
  }, [rowIndex, colIndex, currentRowLastIndex, rowsLastIndex, col.column?.parentKey, prevRowLastCellKey, col.column?.key, flattenColumns])

  const mergedStyle = useMemo(() => {
    const style: CSSProperties = {}
    if(col.rowSpan && col.rowSpan > 1) {
      style.gridRow = `span ${col.rowSpan}`
    }
    if(col.colSpan && col.colSpan > 1) {
      style.gridColumn = `span ${col.colSpan}`
      style.textAlign = 'center'
    }
    if(!filterSpan(col.colSpan)) {
      style.display = 'none'
    }
    if(fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number
    }
    if(fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number
    }
    if(col.column?.align) {
      style.textAlign = col.column.align
    }

    return { ...style, ...col.column?.style }
  }, [col.rowSpan, col.colSpan, fixedInfo.fixStart, fixedInfo.fixEnd, col.column?.align, col.column?.style])
  
  const mergedSpanKeys = useMemo(() => {
    return getMergedSpanKeys(
      {
        key: col.key as Key, 
        hasChildren: col.column?.hasChildren,
        colSpan: col.column?.colSpan
      }, 
      flattenColumns
    )
  }, [col, flattenColumns])

  const childrenKeys = useMemo(() => {
    return getKeysByClassify(col.column?.children)
  }, [col])

  const nestedKeys = useMemo(() => {
    return mergedSpanKeys.concat(childrenKeys.map((column) => column.key))
  }, [mergedSpanKeys, childrenKeys])

  const keys = useMemo(() => {
    if(!resizableColumns && !sortableColumns) return []

    if(col.hasSubColumns) {
      return childrenKeys.reduce((result: Key[], column) => {
        if(!column.hasChildren) {
           result.push(column.key)
        }
        return result
      }, [])
    }

    return mergedSpanKeys
  }, [resizableColumns, sortableColumns, mergedSpanKeys, childrenKeys])

  const resizeKeys = useMemo(() => {
    if(!resizableColumns || col.column?.resizeDisabled) return []

    return keys.filter((key) => {
      const column = flattenColumns.find((item) => item.key === key)
      return column && !column.resizeDisabled
    })
  }, [resizableColumns, col.column?.resizeDisabled, keys, flattenColumns])

  /** 列拖拽排序 start ***************************************************************************/

  const dragSortDisabled = !!col.column?.dragSortDisabled
  const sortEnabled = !!sortableColumns && !dragSortDisabled

  const { listeners, setNodeRef } = useSortable({ 
    id: `${col.key}`, 
    disabled: !sortEnabled,
    data: { 
      type: 'sortableColumns', 
      column: { 
        key: col.key, 
        parentKey: col.column?.parentKey, 
        colSpan: col.column?.colSpan, 
        order: col.column?.order, 
        hasChildren: col.column?.hasChildren, 
        dragSortDisabled,
      }, 
      scopeKeys: sortEnabled ? nestedKeys : []
    }
  });

  const updateState = (activeKeys: Key[], overKeys: Key[]) => {
    let parent = { children: middleState }
    if(rowIndex !== 0) {
      // @ts-ignore
      parent = findNodeByKey(middleState, col.column?.parentKey as Key)
    }

    const children = parent?.children || []
    const activeKeySet = new Set(activeKeys)
    const overKeySet = new Set(overKeys)
    if(activeKeys.some((key) => overKeySet.has(key))) return

    const activeColumns = children.filter((column) => activeKeySet.has(column.key))
    const overColumns = children.filter((column) => overKeySet.has(column.key))
    if(activeColumns.length !== activeKeys.length || overColumns.length !== overKeys.length) return

    const activeOrders = activeColumns.map((column) => column.order)
    const overOrders = overColumns.map((column) => column.order)
    const activeStart = Math.min(...activeOrders)
    const activeEnd = Math.max(...activeOrders)
    const overStart = Math.min(...overOrders)
    const overEnd = Math.max(...overOrders)
    const activeCount = activeColumns.length
    if(overStart === activeStart) return

    const updatedChildren = children.map((column) => {
      let order = column.order

      if(activeKeySet.has(column.key)) {
        order = overStart < activeStart
          ? overStart + column.order - activeStart
          : overEnd - activeCount + 1 + column.order - activeStart
      } else if(overStart < activeStart && column.order >= overStart && column.order < activeStart) {
        order = column.order + activeCount
      } else if(overStart > activeStart && column.order > activeEnd && column.order <= overEnd) {
        order = column.order - activeCount
      }

      return order === column.order ? column : { ...column, order }
    })

    const updatedMiddleState = replaceTreeNode(middleState, parent?.children?.map((column) => column.key) || [], updatedChildren || [])
    updateMiddleState(updatedMiddleState)
    columnsConfig?.onChange?.(updatedMiddleState)
  }

  useDndMonitor({
    onDragEnd(event) {
      const activeColumn = event.active.data.current?.column as ColumnState | undefined
      const overColumn = event.over?.data.current?.column as ColumnState | undefined
      if(
        event.active.id !== col.key
        || event.over?.id === col.key
        || !overColumn
        || activeColumn?.parentKey !== overColumn.parentKey
        || event.active.data.current?.type !== 'sortableColumns'
        || activeColumn?.dragSortDisabled
        || overColumn.dragSortDisabled
      ) return
      const overSpanKeys = getMergedSpanKeys(overColumn, flattenColumns)
      updateState(mergedSpanKeys, overSpanKeys)
    },
  })

  /** 列拖拽排序 end */

  const insertBoundary = useMemo(() => {
    if(!sortableInsertIndicator || !overableScopeKeys?.length) return null

    const indexes = flattenColumns.reduce((result: number[], column, index) => {
      if(overableScopeKeys.includes(column.key)) {
        result.push(index)
      }

      return result
    }, [])
    if(!indexes.length) return null

    return {
      start: Math.min(...indexes),
      end: Math.max(...indexes),
    }
  }, [sortableInsertIndicator, overableScopeKeys, flattenColumns])
  
  const isOverableColumn = !!overableScopeKeys?.includes(col.key as Key)
  const showInsertStart = isOverableColumn
    && sortableInsertIndicator?.placement === 'start'
    && col.colStart === insertBoundary?.start
  const showInsertEnd = isOverableColumn
    && sortableInsertIndicator?.placement === 'end'
    && col.colEnd === insertBoundary?.end

  const isInternalSelectionColumn = isSelectionColumn(col.column)
  let childrenNode = col.children
  if(isInternalSelectionColumn) {
    if((rowSelection?.type ?? 'checkbox') === 'radio' || rowSelection?.hideSelectAll) {
      childrenNode = null
    } else {
      const checkboxProps = rowSelection?.getTitleCheckboxProps?.() || {}
      const disabled = !!checkboxProps.disabled
      const originNode = (
        <SelectionCheckbox
          {...checkboxProps}
          style={{ ...checkboxProps.style, justifyContent: rowSelection?.align ?? 'center' }}
          checked={!!selection?.isAllSelected}
          indeterminate={!!selection?.isPartiallySelected}
          disabled={disabled}
          onChange={(event) => selection?.onSelectAll(event)}
        />
      )
      childrenNode = typeof rowSelection?.columnTitle === 'function'
        ? rowSelection.columnTitle(originNode)
        : rowSelection?.columnTitle ?? originNode
    }
  }
  const ellipsis = !!col.column?.ellipsis
  if(ellipsis) {
    const showTitle = typeof col.column?.ellipsis === "boolean" ? col.column?.ellipsis : col.column?.ellipsis?.showTitle
    const elTitle = showTitle ? getEllipsisTitle(childrenNode) as string : undefined
    childrenNode = <div title={elTitle} className={cellEllipsisInnerCls}>{childrenNode}</div>
  }

  return (
    <div 
      className={classNames(
        cellCls, 
        {
          [cellEllipsisCls]: ellipsis,
          [headLastCellCls]: hasHeadLastCellCls,
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [selectionCellCls]: isInternalSelectionColumn,
          [headSortableCellCls]: sortEnabled,
          [overableColumnCellCls]: sortEnabled && isOverableColumn,
          [sortableColumnCellCls]: sortEnabled && sortableScopeKeys?.includes(col.key as Key),
          [headCellInsertStartCls]: showInsertStart,
          [headCellInsertEndCls]: showInsertEnd,
        },
        col.column?.className,
      )} 
      style={mergedStyle}
      {...listeners}
      ref={setNodeRef}
    >
      {childrenNode}
      {
        (showInsertStart || showInsertEnd) && (
          <div className={headCellInsertLineCls} />
        )
      }
      {
        !!resizeKeys.length && (
          <Resizable 
            id={`${col.key}-resizable`} 
            keys={resizeKeys} 
          />
        )
      }
    </div>
  );
}

export default HeadCell
