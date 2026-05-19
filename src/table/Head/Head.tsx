import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import { useTableContext } from '../context';
import { CellType } from '../interface';
import { useStyles } from '../style';
import HeadRow from './HeadRow';

export interface HeadRef {
  nativeElement: HTMLDivElement;
}

interface HeadProps<T = any> {
  rows: CellType<T>[][];
}

const Head = forwardRef<HeadRef, HeadProps>(({ rows }, ref) => {
  const { headCls } = useStyles();
  const { updateSortingColumns } = useTableContext();
  const innerRef = useRef<HTMLDivElement>(null);

  const handleResizeDragStart = (sorting?: boolean) => {
    innerRef.current!.style.overflow = 'hidden';
    if (sorting) {
      updateSortingColumns(true);
    }
  };

  const handleResizeDragEnd = (sorting?: boolean) => {
    innerRef.current!.style.overflow = '';
    if (sorting) {
      updateSortingColumns(false);
    }
  };

  useImperativeHandle(ref, () => ({
    nativeElement: innerRef.current!,
  }));

  return (
    <div className={headCls} ref={innerRef}>
      {rows.map((row, rowIndex) => (
        <HeadRow
          key={rowIndex}
          headRows={rows}
          row={row}
          headRowIndex={rowIndex}
          onSortableStart={() => handleResizeDragStart(true)}
          onSortableEnd={() => handleResizeDragEnd(true)}
          onResizeStart={handleResizeDragStart}
          onResizeEnd={handleResizeDragEnd}
        />
      ))}
    </div>
  );
});

export default Head;
