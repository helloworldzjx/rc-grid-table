import React, { forwardRef } from 'react';

import { useTableContext } from '../context';
import { useStyles } from '../style';
import SummaryRow from './SummaryRow';

const Summary = forwardRef<HTMLDivElement>((_, ref) => {
  const { dataSource = [], flattenColumns = [], summary } = useTableContext();

  const { summaryCls } = useStyles();

  return (
    <div className={summaryCls} ref={ref}>
      {summary?.(dataSource, flattenColumns)?.map((row, rowIndex) => (
        <SummaryRow key={rowIndex} row={row} />
      ))}
    </div>
  );
});

export default Summary;
