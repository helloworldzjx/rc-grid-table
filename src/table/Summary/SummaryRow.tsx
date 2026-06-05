import classNames from 'classnames';
import React, { FC, useMemo } from 'react';

import type { VirtualColumnsState } from '../hooks/useVirtualColumns';
import { TableSummaryRowCell } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import { filterSpan } from '../utils/handle';
import SummaryCell from './SummaryCell';

interface SummaryRowProps {
  row: TableSummaryRowCell[];
  virtualColumns: VirtualColumnsState;
}

const SummaryRow: FC<SummaryRowProps> = ({ row, virtualColumns }) => {
  const prefixCls = usePrefixClsContext();
  const { summaryGridRowCls, summaryRowCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );
  let ignoreCol = 0;

  return (
    <div
      className={classNames(summaryRowCls, {
        [summaryGridRowCls]: virtualColumns.inVirtual,
      })}
    >
      {row?.map((column, columnIndex) => {
        if (!filterSpan(column.colSpan) || !filterSpan(column.rowSpan))
          return null;

        if (column.colSpan && column.colSpan > 1) {
          ignoreCol += column.colSpan - 1;
        }

        const colEnd = columnIndex + ignoreCol;
        const colStart = column.colSpan ? colEnd - column.colSpan + 1 : colEnd;
        if (
          virtualColumns.inVirtual &&
          !virtualColumns.shouldRenderColumnRange(colStart, colEnd)
        ) {
          return null;
        }

        return (
          <SummaryCell
            key={column.key ?? columnIndex}
            column={column}
            colEnd={colEnd}
            virtualColumn={virtualColumns.inVirtual}
          />
        );
      })}
    </div>
  );
};

export default SummaryRow;
