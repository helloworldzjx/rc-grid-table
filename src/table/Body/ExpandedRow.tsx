import ResizeObserver from '@rc-component/resize-observer';
import classNames from 'classnames';
import React, { CSSProperties, FC, ReactNode, Ref, useMemo } from 'react';

import { useComponentsContext } from '../componentsContext';
import { useTableContext } from '../context';
import { useExpandableContext } from '../expandableContext';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';

interface ExpandedRowProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  rowRef?: Ref<HTMLDivElement>;
  onRowResize?: () => void;
  virtual?: boolean;
  indent?: number;
}

const ExpandedRow: FC<ExpandedRowProps> = ({
  children,
  className,
  style,
  rowRef,
  onRowResize,
  virtual = false,
  indent = 0,
}) => {
  const {
    columnsWidthTotal,
    containerWidth = 0,
    flattenColumns = [],
  } = useTableContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();
  const { expandable } = useExpandableContext();

  const {
    bodyRowCls,
    bodyGridRowCls,
    cellCls,
    expandedRowCls,
    expandedRowCellCls,
    expandedRowContentCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);
  const RowComponent = getComponent(['body', 'row'], 'div');
  const CellComponent = getComponent(['body', 'cell'], 'div');
  const expandedRowCellWidth = Math.min(
    columnsWidthTotal,
    containerWidth || columnsWidthTotal,
  );

  const rowNode = (
    <RowComponent
      className={classNames(
        bodyRowCls,
        expandedRowCls,
        { [bodyGridRowCls]: virtual },
        className,
      )}
      style={style}
      ref={rowRef}
    >
      <CellComponent
        className={classNames(cellCls, expandedRowCellCls)}
        style={{
          gridColumn: `span ${flattenColumns.length || 1}`,
          width: expandedRowCellWidth,
        }}
      >
        <div
          className={expandedRowContentCls}
          style={{
            paddingInlineStart: indent * (expandable?.indentSize ?? 15),
          }}
        >
          {children}
        </div>
      </CellComponent>
    </RowComponent>
  );

  if (virtual) {
    return <ResizeObserver onResize={onRowResize}>{rowNode}</ResizeObserver>;
  }

  return rowNode;
};

export default ExpandedRow;
