import React, { CSSProperties, memo } from "react";
import classNames from "classnames";

import { useStyles } from "../style";
import BodyCell from "./BodyCell";
import { filterCellSpan } from "../utils/handle";
import { ColumnState, StickyOffsets } from "../interface";
import useFixedInfo from "../hooks/useFixedInfo";

interface BodyRowProps<T = any> {
  rowData: T
  rowIndex: number
  flattenColumns: ColumnState<T>[]
  fixedOffset: StickyOffsets
  className?: string
  style?: CSSProperties
}

function BodyRow({
  rowData,
  rowIndex,
  flattenColumns,
  fixedOffset,
  className,
  style,
}: BodyRowProps) {
  const { bodyRowCls } = useStyles();
  const fixedInfoList = useFixedInfo(flattenColumns, fixedOffset)

  return (
    <div className={classNames(bodyRowCls, className)} style={style}>
      {flattenColumns?.map((column, colIndex) => {
        if(!filterCellSpan(column.onCell?.(rowData, rowIndex))) return

        return (
          <BodyCell key={column.key} rowData={rowData} rowIndex={rowIndex} column={column} fixedInfo={fixedInfoList[colIndex]} />
        )
      })}
    </div>
  )
}

export default memo(BodyRow)