import classNames from 'classnames';
import React, { CSSProperties, forwardRef } from 'react';

import { useTableContext } from '../context';
import { useStyles } from '../style';
import SummaryRow from './SummaryRow';

interface SummaryProps {
  className?: string;
  style?: CSSProperties;
}

const Summary = forwardRef<HTMLDivElement, SummaryProps>(
  ({ className, style }, ref) => {
    const { dataSource = [], flattenColumns = [], summary } = useTableContext();

    const { summaryCls, summaryInnerCls } = useStyles();

    return (
      <div className={classNames(summaryCls, className)} style={style}>
        <div className={summaryInnerCls} ref={ref}>
          {summary?.(dataSource, flattenColumns)?.map((row, rowIndex) => (
            <SummaryRow key={rowIndex} row={row} />
          ))}
        </div>
      </div>
    );
  },
);

export default Summary;
