import classNames from 'classnames';
import React, {
  CSSProperties,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useColumnSortableContext } from '../columnSortableContext';
import { useComponentsContext } from '../componentsContext';
import { CellType } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
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
    const prefixCls = usePrefixClsContext();
    const { getComponent } = useComponentsContext();
    const { updateSortingColumns } = useColumnSortableContext();
    const innerRef = useRef<HTMLDivElement>(null);
    const WrapperComponent = getComponent(['header', 'wrapper'], 'div');
    const { headCls, headInnerCls } = useMemo(
      () => getComponentCls(prefixCls),
      [prefixCls],
    );

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
        <WrapperComponent className={headInnerCls} ref={innerRef}>
          {rows.map((row, rowIndex) => (
            <HeadRow
              key={rowIndex}
              headRows={rows}
              row={row}
              headRowIndex={rowIndex}
              getScrollElement={() => innerRef.current}
              onSortableStart={() => handleResizeDragStart(true)}
              onSortableEnd={() => handleResizeDragEnd(true)}
              onResizeStart={handleResizeDragStart}
              onResizeEnd={handleResizeDragEnd}
            />
          ))}
        </WrapperComponent>
      </div>
    );
  },
);

export default Head;
