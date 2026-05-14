import React, { CSSProperties, memo } from "react";
import classNames from "classnames";

import { useStyles } from "../style";
import BodyCell from "./BodyCell";
import { filterCellSpan } from "../utils/handle";
import { ColumnState, StickyOffsets } from "../interface";
import useFixedInfo from "../hooks/useFixedInfo";
import { useTableContext } from "../context";

interface BodyRowProps<T = any> {
  rowData: T
  rowIndex: number
  flattenColumns: ColumnState<T>[]
  fixedOffset: StickyOffsets
  className?: string
  style?: CSSProperties
  indent?: number
  expanded?: boolean
  expandable?: boolean
  rowSupportExpand?: boolean
}

function BodyRow({
  rowData,
  rowIndex,
  flattenColumns,
  fixedOffset,
  className,
  style,
  indent = 0,
  expanded = false,
  expandable = false,
  rowSupportExpand = false,
}: BodyRowProps) {
  const { expandable: expandableConfig, onTriggerExpand } = useTableContext();
  const { bodyRowCls, bodyRowExpandableCls } = useStyles();
  const fixedInfoList = useFixedInfo(flattenColumns, fixedOffset)
  const expandByClick = !!expandableConfig?.expandRowByClick && rowSupportExpand

  const handleClick = () => {
    if(expandByClick) {
      onTriggerExpand?.(rowData)
    }
  }

  return (
    <div
      className={classNames(bodyRowCls, {[bodyRowExpandableCls]: expandByClick}, className)}
      style={style}
      onClick={handleClick}
    >
      {flattenColumns?.map((column, colIndex) => {
        if(!filterCellSpan(column.onCell?.(rowData, rowIndex))) return null

        return (
          <BodyCell
            key={column.key}
            rowData={rowData}
            rowIndex={rowIndex}
            column={column}
            fixedInfo={fixedInfoList[colIndex]}
            indent={indent}
            expanded={expanded}
            expandable={expandable}
            rowSupportExpand={rowSupportExpand}
            isFirstColumn={colIndex === 0}
          />
        )
      })}
    </div>
  )
}

export default memo(BodyRow)
