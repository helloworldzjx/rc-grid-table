import React, { forwardRef } from "react";

import { useStyles } from "../style";
import HeadRow from "./HeadRow";
import { CellType } from "../interface";

interface HeadProps<T = any> {
  rows: CellType<T>[][]
}

const Head = forwardRef<HTMLDivElement, HeadProps>((
  {
    rows,
  },
  ref
) => {
  const { headCls } = useStyles();

  return (
    <div className={headCls} ref={ref}>
      {
        rows.map((row, rowIndex) => (
          <HeadRow 
            key={rowIndex}
            headRows={rows} 
            row={row} 
            headRowIndex={rowIndex}
          />
        ))
      }
    </div>
  )
})

export default Head