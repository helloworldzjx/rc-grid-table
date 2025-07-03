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
import { useScrollContext } from "../scrollContext";

interface HeadCellProps<T = any> {
  column: CellType<T>
  columnIndex: number
  rowIndex: number
  /** 最后一列的parentKey */
  prevRowLastCellKey?: Key
  /** 当前行的最大index */
  headRowLastIndex: number
}

function HeadCell({
  rowIndex,
  column: col,
  columnIndex: colIndex,
  prevRowLastCellKey,
  headRowLastIndex,
}: HeadCellProps) {
  const {
    flattenColumns = [], 
    resizableColumns,
    sortableColumns,
    sortableScopeKeys,
    overableScopeKeys,
    fixedOffset,
    middleState,
    updateMiddleState,
    columnsConfig,
  } = useTableContext();
  const { isStart, isEnd } = useScrollContext()
  const fixedInfo = getCellFixedInfo(col.colStart as number, col.colEnd as number, flattenColumns, fixedOffset)

  const {
    cellCls, 
    cellEllipsisCls, 
    cellEllipsisInnerCls, 
    cellEllipsisInnerShowTitleCls, 
    headLastCellCls,
    headSortableCellCls,
    sortableColumnCellCls,
    overableColumnCellCls,
    cellFixedStartCls, 
    cellFixedStartLastCls, 
    cellFixedEndCls, 
    cellFixedEndFirstCls,
  } = useStyles();

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

    return { ...style, ...col.column?.style }
  }, [col.rowSpan, col.colSpan, fixedInfo.fixStart, fixedInfo.fixEnd, col.column?.style])
  
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

  /** 列拖拽排序 start ***************************************************************************/

  const { listeners, setNodeRef } = useSortable({ 
    id: `${col.key}`, 
    // 对固定列的拖拽排序做了限制，如果不限制，over元素有可能是磁吸元素层级之下的元素，导致看不到over元素的高亮，出现视觉上的误判
    disabled: !sortableColumns || (!isStart && fixedInfo.fixStart !== null) || (!isEnd && fixedInfo.fixEnd !== null), 
    data: { 
      type: 'sortableColumns', 
      column: { 
        key: col.key, 
        parentKey: col.column?.parentKey, 
        colSpan: col.column?.colSpan, 
        order: col.column?.order, 
        hasChildren: col.column?.hasChildren, 
      }, 
      scopeKeys: nestedKeys 
    }
  });

  const updateState = (nextForntKeys: Key[], nextRearKeys: Key[]) => {
    const diffCount = nextForntKeys.length - nextRearKeys.length
    let parent = { children: middleState }
    if(rowIndex !== 0) {
      // @ts-ignore
      parent = findNodeByKey(middleState, col.column?.parentKey as Key)
    }

    const prevFrontKeysStartIndex = parent?.children?.find((column) => column.key === nextRearKeys[0])?.order as number
    const addStartIndex = prevFrontKeysStartIndex + nextRearKeys.length + diffCount
    const prevRearKeysStartIndex = parent?.children?.find((column) => column.key === nextForntKeys[0])?.order as number
    const maxAddIndex = prevRearKeysStartIndex - prevFrontKeysStartIndex

    let frontKeysOrderCount = 0
    let rearKeysOrderCount = 0
    const updatedChildren = parent?.children?.map((column, index) => {
      let order = column.order
      if(nextForntKeys.includes(column.key) && frontKeysOrderCount <= nextForntKeys.length) {
        order = prevFrontKeysStartIndex + frontKeysOrderCount
        frontKeysOrderCount++
      } else if(nextRearKeys.includes(column.key) && rearKeysOrderCount <= nextRearKeys.length) {
        order = prevRearKeysStartIndex + rearKeysOrderCount
        rearKeysOrderCount++
      } else if(index >= addStartIndex && index <= maxAddIndex) {
        order = column.order + diffCount
      }

      return { ...column, order }
    })

    const updatedMiddleState = replaceTreeNode(middleState, parent?.children?.map((column) => column.key) || [], updatedChildren || [])
    updateMiddleState(updatedMiddleState)
    columnsConfig?.onChange?.(updatedMiddleState)
  }

  useDndMonitor({
    onDragEnd(event) {
      if(event.active.id !== col.key || event.over?.id === col.key || event.active.data.current?.column?.parentKey !== event.over?.data.current?.column?.parentKey || event.active.data.current?.type !== 'sortableColumns') return
      const overColumn = event.over?.data.current?.column as ColumnState
      const overSpanKeys = getMergedSpanKeys(overColumn, flattenColumns)
      // 当前排序靠后的列在拖拽后，下次重新排序会在前面
      const isNextFront = col.column?.order as number > overColumn.order
      updateState(isNextFront ? mergedSpanKeys : overSpanKeys, isNextFront ? overSpanKeys : mergedSpanKeys)
    },
  })

  /** 列拖拽排序 end */

  let childrenNode = col.children
  const ellipsis = !!col.column?.ellipsis
  if(ellipsis) {
    const showTitle = typeof col.column?.ellipsis === "boolean" ? col.column?.ellipsis : col.column?.ellipsis?.showTitle
    const elTitle = showTitle ? getEllipsisTitle(childrenNode) as string : undefined
    childrenNode = <div title={elTitle} className={classNames(cellEllipsisInnerCls, {[cellEllipsisInnerShowTitleCls]: showTitle})}>{childrenNode}</div>
  }

  return (
    <div 
      className={classNames(
        cellCls, 
        {
          [cellEllipsisCls]: ellipsis,
          // 最后一列不显示右侧border，判断逻辑：当前列是否为第一行的最后一列 || 当前列的parentKey是否为上一行最后一列的key
          [headLastCellCls]: (rowIndex === 0 && colIndex === headRowLastIndex) || col.column?.parentKey === prevRowLastCellKey,
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [headSortableCellCls]: sortableColumns,
          [overableColumnCellCls]: overableScopeKeys?.includes(col.key as Key),
          [sortableColumnCellCls]: sortableScopeKeys?.includes(col.key as Key),
        },
        col.column?.className,
      )} 
      style={mergedStyle}
      {...listeners}
      ref={setNodeRef}
    >
      {childrenNode}
      {
        resizableColumns && (
          <Resizable 
            id={`${col.key}-resizable`} 
            keys={keys} 
          />
        )
      }
    </div>
  );
}

export default HeadCell