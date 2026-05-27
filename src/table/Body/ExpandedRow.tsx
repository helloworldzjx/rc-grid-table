import classNames from 'classnames';
import React, { FC, ReactNode } from 'react';

import { useTableContext } from '../context';
import { useStyles } from '../style';

interface ExpandedRowProps {
  children?: ReactNode;
  className?: string;
  indent?: number;
}

const ExpandedRow: FC<ExpandedRowProps> = ({
  children,
  className,
  indent = 0,
}) => {
  const {
    columnsWidthTotal,
    containerWidth = 0,
    flattenColumns = [],
    expandable,
    getComponent,
  } = useTableContext();
  const {
    bodyRowCls,
    expandedRowCls,
    cellCls,
    expandedRowCellCls,
    expandedRowContentCls,
  } = useStyles();
  const RowComponent = getComponent(['body', 'row'], 'div');
  const CellComponent = getComponent(['body', 'cell'], 'div');
  const expandedRowCellWidth = Math.min(
    columnsWidthTotal,
    containerWidth || columnsWidthTotal,
  );

  return (
    <RowComponent className={classNames(bodyRowCls, expandedRowCls, className)}>
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
};

export default ExpandedRow;
