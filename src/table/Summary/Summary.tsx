import React, { forwardRef } from "react";

import { useStyles } from "../style";
import SummaryRow from "./SummaryRow";
import { useTableContext } from "../context"

interface SummaryProps {
  
}

const Summary = forwardRef<HTMLDivElement, SummaryProps>(({}, ref) => {
  const { dataSource = [], flattenColumns = [], summary } = useTableContext();

  const { summaryCls } = useStyles();

  return (
    <div
      className={summaryCls}
      ref={ref}
    >
      {
        summary?.(dataSource, flattenColumns.length)?.map((row, rowIndex) => (
          <SummaryRow key={rowIndex} row={row} />
        ))
      }
    </div>
  )
})

export default Summary