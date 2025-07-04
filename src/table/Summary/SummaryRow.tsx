import React, { FC } from "react";

import { useStyles } from "../style";
import SummaryCell from "./SummaryCell";
import { TableSummaryRowCell } from "../interface";
import { filterSpan } from "../utils/handle";

interface SummaryRowProps {
  row: TableSummaryRowCell[]
}

const SummaryRow: FC<SummaryRowProps> = ({ row }) => {
  const { summaryRowCls } = useStyles();
  let ignoreCol = 0

  return (
    <div className={summaryRowCls}>
      {
        row?.map((column, columnIndex) => {
          if(!filterSpan(column.colSpan) || !filterSpan(column.rowSpan)) return

          if(column.colSpan && column.colSpan > 1) {
            ignoreCol += column.colSpan - 1
          }

          return (
            <SummaryCell 
              key={columnIndex} 
              column={column} 
              colEnd={columnIndex + ignoreCol}
            />
          )
        })
      }
    </div>
  )
}

export default SummaryRow