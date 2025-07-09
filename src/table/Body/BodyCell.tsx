import React, { CSSProperties, memo, ReactNode, useMemo } from "react";
import classNames from "classnames";

import { useTableContext } from "../context";
import { useStyles } from "../style";
import { ColumnState } from "../interface";
import { getEllipsisTitle } from "../utils/handle";
import { FixedInfo } from "../utils/fixedColumns";

interface BodyRowProps<T = any> {
  column: ColumnState<T>
  rowData: T
  rowIndex: number
  fixedInfo: FixedInfo
}

function BodyCell({
  rowData,
  column,
  rowIndex,
  fixedInfo,
}: BodyRowProps) {
  const {
    sortableScopeKeys,
    overableScopeKeys,
  } = useTableContext();

  const {
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    sortableColumnCellCls,
    overableColumnCellCls,
  } = useStyles();

  const mergedStyle = useMemo(() => {
    const { rowSpan, colSpan } = column.onCell?.(rowData, rowIndex) || {}
    const style: CSSProperties = {}
    if(rowSpan && rowSpan > 1) {
      style.gridRow = `span ${rowSpan}`
    }
    if(colSpan && colSpan > 1) {
      style.gridColumn = `span ${colSpan}`
    }

    if(fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number
    }
    if(fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number
    }

    return { ...style, ...column.style }
  }, [column.onCell, rowData, rowIndex, fixedInfo.fixStart, fixedInfo.fixEnd, column.style])

  let cellValue: ReactNode = undefined;
  if (column.dataIndex && typeof column.dataIndex === 'string') {
    cellValue = rowData?.[column.dataIndex];
  }
  if (column.render && typeof column.render === 'function') {
    cellValue = column.render?.(cellValue, rowData, rowIndex);
  }

  let childrenNode = cellValue
  const ellipsis = !!column.ellipsis
  if(ellipsis) {
    const showTitle = typeof column.ellipsis === "boolean" ? column.ellipsis : column.ellipsis?.showTitle
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
          [overableColumnCellCls]: overableScopeKeys?.includes(column.key),
          [sortableColumnCellCls]: sortableScopeKeys?.includes(column.key),
        },
        column.className,
      )} 
      style={mergedStyle}
    >
      {childrenNode}
    </div>
  );
}

export default memo(BodyCell)