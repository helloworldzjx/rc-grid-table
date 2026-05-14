import React, { CSSProperties, MouseEvent, memo, ReactNode, useMemo } from "react";
import classNames from "classnames";

import { useTableContext } from "../context";
import { useStyles } from "../style";
import { ColumnState } from "../interface";
import { getEllipsisTitle } from "../utils/handle";
import { FixedInfo } from "../utils/fixedColumns";
import { isExpandColumn } from "../utils/const";

interface BodyRowProps<T = any> {
  column: ColumnState<T>
  rowData: T
  rowIndex: number
  fixedInfo: FixedInfo
  indent?: number
  expanded?: boolean
  expandable?: boolean
  rowSupportExpand?: boolean
  isFirstColumn?: boolean
}

function BodyCell({
  rowData,
  column,
  rowIndex,
  fixedInfo,
  indent = 0,
  expanded = false,
  expandable = false,
  rowSupportExpand = false,
  isFirstColumn = false,
}: BodyRowProps) {
  const {
    sortableScopeKeys,
    overableScopeKeys,
    expandable: expandableConfig,
    onTriggerExpand,
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
    expandIconCellCls,
    expandTreeCellInnerCls,
    expandIconCls,
    expandIconExpandedCls,
    expandIconSpacedCls,
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

  const isInternalExpandColumn = isExpandColumn(column)

  const handleExpand = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    if(rowSupportExpand) {
      onTriggerExpand?.(rowData)
    }
  }

  const renderExpandIcon = (spaced = false) => {
    const iconProps = {
      expanded,
      expandable: rowSupportExpand,
      record: rowData,
      index: rowIndex,
      indent,
      onExpand: (_record: any, event: MouseEvent<HTMLElement>) => handleExpand(event),
    }

    if(expandableConfig?.expandIcon) {
      return expandableConfig.expandIcon(iconProps)
    }

    return (
      <button
        type="button"
        className={classNames(
          expandIconCls,
          {
            [expandIconExpandedCls]: expanded,
            [expandIconSpacedCls]: spaced || !rowSupportExpand,
          }
        )}
        aria-label={expanded ? 'Collapse row' : 'Expand row'}
        aria-expanded={rowSupportExpand ? expanded : undefined}
        disabled={!rowSupportExpand}
        onClick={handleExpand}
      />
    )
  }

  let cellValue: ReactNode = undefined;
  if (!isInternalExpandColumn && column.dataIndex && typeof column.dataIndex === 'string') {
    cellValue = rowData?.[column.dataIndex];
  }
  if (!isInternalExpandColumn && column.render && typeof column.render === 'function') {
    cellValue = column.render?.(cellValue, rowData, rowIndex);
  }

  let childrenNode = isInternalExpandColumn ? renderExpandIcon() : cellValue
  const ellipsis = !!column.ellipsis
  if(ellipsis) {
    const showTitle = typeof column.ellipsis === "boolean" ? column.ellipsis : column.ellipsis?.showTitle
    const elTitle = showTitle ? getEllipsisTitle(childrenNode) as string : undefined
    childrenNode = <div title={elTitle} className={cellEllipsisInnerCls}>{childrenNode}</div>
  }

  if(!isInternalExpandColumn && isFirstColumn && expandable && !expandableConfig?.expandedRowRender) {
    childrenNode = (
      <div
        className={expandTreeCellInnerCls}
        style={{paddingInlineStart: indent * (expandableConfig?.indentSize ?? 15)}}
      >
        {renderExpandIcon(true)}
        <span>{childrenNode}</span>
      </div>
    )
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
          [expandIconCellCls]: isInternalExpandColumn,
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
