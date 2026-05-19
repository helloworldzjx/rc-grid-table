import React, { FC } from 'react';

import { TableSummaryRowCell } from '../interface';
import { useStyles } from '../style';
import { filterSpan } from '../utils/handle';
import SummaryCell from './SummaryCell';

interface SummaryRowProps {
  row: TableSummaryRowCell[];
}

const SummaryRow: FC<SummaryRowProps> = ({ row }) => {
  const { summaryRowCls } = useStyles();
  let ignoreCol = 0;

  return (
    <div className={summaryRowCls}>
      {row?.map((column, columnIndex) => {
        if (!filterSpan(column.colSpan) || !filterSpan(column.rowSpan))
          return null;

        if (column.colSpan && column.colSpan > 1) {
          ignoreCol += column.colSpan - 1;
        }

        return (
          <SummaryCell
            key={column.key ?? columnIndex}
            column={column}
            colEnd={columnIndex + ignoreCol}
          />
        );
      })}
    </div>
  );
};

export default SummaryRow;
