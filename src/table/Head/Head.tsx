import classNames from 'classnames';
import React, {
  CSSProperties,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useColumnSortPreviewLayoutContext } from '../columnSortPreviewLayoutContext';
import { useColumnSortableContext } from '../columnSortableContext';
import { useComponentsContext } from '../componentsContext';
import { CellType } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import { parseHeaderRows } from '../utils/handle';
import HeadFilterRow from './HeadFilterRow';
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
    const { columns: previewColumns } = useColumnSortPreviewLayoutContext();
    const innerRef = useRef<HTMLDivElement>(null);
    const WrapperComponent = getComponent(['header', 'wrapper'], 'div');
    const { headCls, headInnerCls } = useMemo(
      () => getComponentCls(prefixCls),
      [prefixCls],
    );

    const getScrollElement = useCallback(() => innerRef.current, []);
    const renderedRows = useMemo(
      () => (previewColumns ? parseHeaderRows(previewColumns) : rows),
      [previewColumns, rows],
    );

    const handleDragSortResizeStart = useCallback(
      (sorting?: boolean) => {
        if (sorting) {
          updateSortingColumns(true);
        }
      },
      [updateSortingColumns],
    );

    const handleDragSortResizeEnd = useCallback(
      (sorting?: boolean) => {
        if (sorting) {
          updateSortingColumns(false);
        }
      },
      [updateSortingColumns],
    );

    const handleSortableStart = useCallback(() => {
      handleDragSortResizeStart(true);
    }, [handleDragSortResizeStart]);

    const handleSortableEnd = useCallback(() => {
      handleDragSortResizeEnd(true);
    }, [handleDragSortResizeEnd]);

    const handleResizeStart = useCallback(() => {
      handleDragSortResizeStart();
    }, [handleDragSortResizeStart]);

    const handleResizeEnd = useCallback(() => {
      handleDragSortResizeEnd();
    }, [handleDragSortResizeEnd]);

    useImperativeHandle(ref, () => ({
      nativeElement: innerRef.current!,
    }));

    return (
      <div className={classNames(headCls, className)} style={style}>
        <WrapperComponent className={headInnerCls} ref={innerRef}>
          {renderedRows.map((row, rowIndex) => (
            <HeadRow
              key={rowIndex}
              headRows={renderedRows}
              row={row}
              headRowIndex={rowIndex}
              getScrollElement={getScrollElement}
              onSortableStart={handleSortableStart}
              onSortableEnd={handleSortableEnd}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            />
          ))}
          <HeadFilterRow />
        </WrapperComponent>
      </div>
    );
  },
);

export default memo(Head);
