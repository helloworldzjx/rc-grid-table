import React, { forwardRef, useImperativeHandle, useRef } from "react";

import { useStyles } from "../style";
import HeadRow from "./HeadRow";
import { CellType } from "../interface";

export interface HeadRef {
  nativeElement: HTMLDivElement
}

interface HeadProps<T = any> {
  rows: CellType<T>[][]
}

const Head = forwardRef<HeadRef, HeadProps>((
  {
    rows,
  },
  ref
) => {
  const { headCls } = useStyles();
  const innerRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => ({
    nativeElement: innerRef.current!,
  }));

  return (
    <div className={headCls} ref={innerRef}>
      {
        rows.map((row, rowIndex) => (
          <HeadRow 
            key={rowIndex}
            headRows={rows} 
            row={row} 
            headRowIndex={rowIndex}
            onResizeStart={() => {
              innerRef.current!.style.overflow = 'hidden'
            }}
            onResizeEnd={() => {
              innerRef.current!.style.overflow = ''
            }}
          />
        ))
      }
    </div>
  )
})

export default Head