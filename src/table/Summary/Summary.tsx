import classNames from 'classnames';
import React, { CSSProperties, forwardRef, useMemo } from 'react';

import { useTableContext } from '../context';
import type { VirtualColumnsState } from '../hooks/useVirtualColumns';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import SummaryRow from './SummaryRow';

interface SummaryProps {
  virtualColumns: VirtualColumnsState;
  className?: string;
  style?: CSSProperties;
}

const Summary = forwardRef<HTMLDivElement, SummaryProps>(
  ({ virtualColumns, className, style }, ref) => {
    const { dataSource = [], flattenColumns = [], summary } = useTableContext();
    const prefixCls = usePrefixClsContext();

    const { summaryCls, summaryInnerCls } = useMemo(
      () => getComponentCls(prefixCls),
      [prefixCls],
    );

    return (
      <div className={classNames(summaryCls, className)} style={style}>
        <div className={summaryInnerCls} ref={ref}>
          {summary?.(dataSource, flattenColumns)?.map((row, rowIndex) => (
            <SummaryRow
              key={rowIndex}
              row={row}
              virtualColumns={virtualColumns}
            />
          ))}
        </div>
      </div>
    );
  },
);

export default Summary;
