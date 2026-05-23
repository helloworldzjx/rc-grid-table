import classNames from 'classnames';
import React, {
  CSSProperties,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';

import { useTableContext } from '../context';
import { CellType } from '../interface';
import { useStyles } from '../style';
import HeadRow from './HeadRow';

export interface HeadRef {
  nativeElement: HTMLDivElement;
}

interface HeadProps<T = any> {
  rows: CellType<T>[][];
  className?: string;
  style?: CSSProperties;
}

const Head = forwardRef<HeadRef, HeadProps>(
  ({ rows, className, style }, ref) => {
    const { headCls, headInnerCls } = useStyles();
    const { updateSortingColumns } = useTableContext();
    const innerRef = useRef<HTMLDivElement>(null);

    const handleResizeDragStart = (sorting?: boolean) => {
      if (sorting) {
        updateSortingColumns(true);
      }
    };

    const handleResizeDragEnd = (sorting?: boolean) => {
      if (sorting) {
        updateSortingColumns(false);
      }
    };

    useImperativeHandle(ref, () => ({
      nativeElement: innerRef.current!,
    }));

    return (
      <div className={classNames(headCls, className)} style={style}>
        <div className={headInnerCls} ref={innerRef}>
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
      </div>
    );
  },
);

export default Head;
