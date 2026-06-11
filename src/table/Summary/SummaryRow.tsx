import React, { FC, memo, useMemo } from 'react';

import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { TableSummaryRowCell } from '../interface';
import { getComponentCls } from '../style/classNames';
import { filterSpan } from '../utils/handle';
import SummaryCell from './SummaryCell';

interface SummaryRowProps {
  row: TableSummaryRowCell[];
}

const SummaryRow: FC<SummaryRowProps> = ({ row }) => {
  const prefixCls = usePrefixClsContext();
  const { summaryRowCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );
  let ignoreCol = 0;

  return (
    <div className={summaryRowCls}>
      {row?.map((column, columnIndex) => {
        if (!filterSpan(column.colSpan) || !filterSpan(column.rowSpan))
          return null;

        if (column.colSpan && column.colSpan > 1) {
          ignoreCol += column.colSpan - 1;
        }

        const colEnd = columnIndex + ignoreCol;

        return (
          <SummaryCell
            key={column.key ?? columnIndex}
            column={column}
            colEnd={colEnd}
          />
        );
      })}
    </div>
  );
};

export default memo(SummaryRow);
