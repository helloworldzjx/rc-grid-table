import classNames from 'classnames';
import React, { CSSProperties, forwardRef, memo, useMemo } from 'react';

import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableDataContext } from '../contexts/TableDataContext';
import useRenderedColumnLayout from '../hooks/useRenderedColumnLayout';
import type { TableProps } from '../interface';
import { getComponentCls } from '../style/classNames';
import SummaryRow from './SummaryRow';

interface SummaryProps {
  className?: string;
  style?: CSSProperties;
  summary?: TableProps['summary'];
}

const Summary = forwardRef<HTMLDivElement, SummaryProps>(
  ({ className, style, summary }, ref) => {
    const { dataSource = [] } = useTableDataContext();
    const { flattenColumns = [] } = useRenderedColumnLayout();
    const prefixCls = usePrefixClsContext();

    const { summaryCls, summaryInnerCls } = useMemo(
      () => getComponentCls(prefixCls),
      [prefixCls],
    );

    const summaryRows = useMemo(
      () => summary?.(dataSource, flattenColumns) || [],
      [summary, dataSource, flattenColumns],
    );

    return (
      <div className={classNames(summaryCls, className)} style={style}>
        <div className={summaryInnerCls} ref={ref}>
          {summaryRows.map((row, rowIndex) => (
            <SummaryRow key={rowIndex} row={row} />
          ))}
        </div>
      </div>
    );
  },
);

export default memo(Summary);
