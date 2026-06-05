import classNames from 'classnames';
import React, { CSSProperties, FC, useMemo } from 'react';

import CellContainer from '../CellContainer';
import { useTableContext } from '../context';
import { TableSummaryRowCell } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import { getCellFixedInfo } from '../utils/fixedColumns';
import {
  getNormalSpanStyle,
  getVirtualColumnPlacementStyle,
} from '../utils/gridPlacement';
import { getEllipsisTitle } from '../utils/handle';

interface SummaryCellProps {
  column: TableSummaryRowCell;
  colEnd: number;
  virtualColumn?: boolean;
}

const SummaryCell: FC<SummaryCellProps> = ({
  column,
  colEnd,
  virtualColumn = false,
}) => {
  const { flattenColumns = [], fixedOffset } = useTableContext();
  const prefixCls = usePrefixClsContext();

  const {
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { colStart, spanStyle } = useMemo(() => {
    let colStart = colEnd;
    if (column.colSpan && column.colSpan > 1) {
      colStart = colStart - column.colSpan + 1;
    }
    const style = virtualColumn
      ? getVirtualColumnPlacementStyle({
          colStart,
          rowSpan: column.rowSpan,
          colSpan: column.colSpan,
        })
      : getNormalSpanStyle({
          rowSpan: column.rowSpan,
          colSpan: column.colSpan,
        });

    return {
      colStart,
      spanStyle: style,
    };
  }, [column.rowSpan, column.colSpan, colEnd, virtualColumn]);

  const { fixedInfo, mergedStyle } = useMemo(() => {
    const style: CSSProperties = {};
    const fixedInfo = getCellFixedInfo(
      colStart,
      colEnd,
      flattenColumns,
      fixedOffset,
    );
    if (fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number;
    }
    if (fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number;
    }

    return {
      fixedInfo,
      mergedStyle: { ...spanStyle, ...style },
    };
  }, [colStart, colEnd, spanStyle, flattenColumns, fixedOffset]);

  let childrenNode = column.children;
  const ellipsis = !!column?.ellipsis;
  if (ellipsis) {
    const showTitle =
      typeof column?.ellipsis === 'boolean'
        ? column?.ellipsis
        : column?.ellipsis?.showTitle;
    const elTitle = showTitle
      ? (getEllipsisTitle(childrenNode) as string)
      : undefined;
    childrenNode = (
      <div title={elTitle} className={cellEllipsisInnerCls}>
        {childrenNode}
      </div>
    );
  }

  return (
    <CellContainer
      className={classNames(cellCls, {
        [cellEllipsisCls]: ellipsis,
        [cellFixedStartCls]: fixedInfo.fixStart !== null,
        [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
        [cellFixedEndCls]: fixedInfo.fixEnd !== null,
        [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
      })}
      style={mergedStyle}
    >
      {childrenNode}
    </CellContainer>
  );
};

export default SummaryCell;
