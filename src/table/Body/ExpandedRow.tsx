import React, { FC, ReactNode } from "react";
import classNames from "classnames";

import { useTableContext } from "../context";
import { useStyles } from "../style";

interface ExpandedRowProps {
  children?: ReactNode;
  className?: string;
  indent?: number;
}

const ExpandedRow: FC<ExpandedRowProps> = ({ children, className, indent = 0 }) => {
  const {
    columnsWidthTotal,
    containerWidth = 0,
    flattenColumns = [],
    expandable,
  } = useTableContext();
  const {
    bodyRowCls,
    expandedRowCls,
    cellCls,
    expandedRowCellCls,
    expandedRowContentCls,
  } = useStyles();
  const expandedRowCellWidth = Math.min(columnsWidthTotal, containerWidth || columnsWidthTotal);

  return (
    <div className={classNames(bodyRowCls, expandedRowCls, className)}>
      <div
        className={classNames(cellCls, expandedRowCellCls)}
        style={{
          gridColumn: `span ${flattenColumns.length || 1}`,
          width: expandedRowCellWidth,
        }}
      >
        <div
          className={expandedRowContentCls}
          style={{paddingInlineStart: indent * (expandable?.indentSize ?? 15)}}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default ExpandedRow;
