import React, { CSSProperties, FC, useMemo } from "react"
import classNames from "classnames"

import { getEllipsisTitle } from "../utils/handle"
import { useStyles } from "../style"
import { getCellFixedInfo } from "../utils/fixedColumns"
import { useTableContext } from "../context"
import { TableSummaryRowCell } from "../interface"

interface SummaryCellProps {
  column: TableSummaryRowCell
  colEnd: number
}

const SummaryCell: FC<SummaryCellProps> = ({ column, colEnd }) => {
  const {
    flattenColumns = [], 
    fixedOffset,
  } = useTableContext();

  const { 
    cellCls,
    cellEllipsisCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    cellEllipsisInnerCls, 
  } = useStyles();

  const { colStart, spanStyle } = useMemo(() => {
    const style: CSSProperties = {}
    if(column.rowSpan && column.rowSpan > 1) {
      style.gridRow = `span ${column.rowSpan}`
    }
    let colStart = colEnd;
    if(column.colSpan && column.colSpan > 1) {
      style.gridColumn = `span ${column.colSpan}`
      colStart = colStart - column.colSpan + 1;
    }

    return {
      colStart,
      spanStyle: style
    }
  }, [column.rowSpan, column.colSpan, colEnd])

  const { fixedInfo, mergedStyle } = useMemo(() => {
    const style: CSSProperties = {}
    const fixedInfo = getCellFixedInfo(colStart, colEnd, flattenColumns, fixedOffset)
    if(fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number
    }
    if(fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number
    }

    return {
      fixedInfo,
      mergedStyle: {...spanStyle, ...style},
    }
  }, [colStart, colEnd, spanStyle, flattenColumns, fixedOffset])

  let childrenNode = column.children
  const ellipsis = !!column?.ellipsis
  if(ellipsis) {
    const showTitle = typeof column?.ellipsis === "boolean" ? column?.ellipsis : column?.ellipsis?.showTitle
    const elTitle = showTitle ? getEllipsisTitle(childrenNode) as string : undefined
    childrenNode = <div title={elTitle} className={cellEllipsisInnerCls}>{childrenNode}</div>
  }
  
  return (
    <div 
      className={classNames(
        cellCls, 
        {
          [cellEllipsisCls]: ellipsis, 
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
        }
      )} 
      style={mergedStyle}
    >
      {column.children}
    </div>
  );
}

export default SummaryCell