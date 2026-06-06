import classNames from 'classnames';
import React, { CSSProperties, FC, useMemo } from 'react';

import CellContainer from '../CellContainer';
import { useTableContext } from '../context';
import { useFixedShadowActive } from '../fixedShadowContext';
import { TableSummaryRowCell } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import { getCellFixedInfo } from '../utils/fixedColumns';
import { getNormalSpanStyle } from '../utils/gridPlacement';
import { getEllipsisTitle } from '../utils/handle';

interface SummaryCellProps {
  column: TableSummaryRowCell;
  colEnd: number;
}

const SummaryCell: FC<SummaryCellProps> = ({ column, colEnd }) => {
  const { flattenColumns = [], fixedOffset } = useTableContext();
  const prefixCls = usePrefixClsContext();

  const {
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedStartShadowActiveCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    cellFixedEndShadowActiveCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { colStart, spanStyle } = useMemo(() => {
    let colStart = colEnd;
    if (column.colSpan && column.colSpan > 1) {
      colStart = colStart - column.colSpan + 1;
    }
    const style = getNormalSpanStyle({
      rowSpan: column.rowSpan,
      colSpan: column.colSpan,
    });

    return {
      colStart,
      spanStyle: style,
    };
  }, [column.rowSpan, column.colSpan, colEnd]);

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

  const fixedShadowActive = useFixedShadowActive(fixedInfo);

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
        [cellFixedStartShadowActiveCls]: fixedShadowActive.start,
        [cellFixedEndCls]: fixedInfo.fixEnd !== null,
        [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
        [cellFixedEndShadowActiveCls]: fixedShadowActive.end,
      })}
      style={mergedStyle}
    >
      {childrenNode}
    </CellContainer>
  );
};

export default SummaryCell;
