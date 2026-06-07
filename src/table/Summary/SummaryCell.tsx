import classNames from 'classnames';
import React, { CSSProperties, FC, memo, useMemo } from 'react';

import CellContainer from '../CellContainer';
import { useFixedShadowActive } from '../fixedShadowContext';
import { TableSummaryRowCell } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import { useTableLayoutContext } from '../tableLayoutContext';
import { getCellFixedInfo } from '../utils/fixedColumns';
import { getNormalSpanStyle } from '../utils/gridPlacement';
import { getEllipsisTitle } from '../utils/handle';

interface SummaryCellProps {
  column: TableSummaryRowCell;
  colEnd: number;
}

const SummaryCell: FC<SummaryCellProps> = ({ column, colEnd }) => {
  const { flattenColumns = [], fixedOffset } = useTableLayoutContext();
  const prefixCls = usePrefixClsContext();

  const {
    cellCls,
    ellipsisCellCls,
    ellipsisCellInnerCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
    fixedEndShadowActiveCellCls,
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
      <div title={elTitle} className={ellipsisCellInnerCls}>
        {childrenNode}
      </div>
    );
  }

  return (
    <CellContainer
      className={classNames(cellCls, {
        [ellipsisCellCls]: ellipsis,
        [fixedStartCellCls]: fixedInfo.fixStart !== null,
        [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
        [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
        [fixedEndCellCls]: fixedInfo.fixEnd !== null,
        [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
        [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
      })}
      style={mergedStyle}
    >
      {childrenNode}
    </CellContainer>
  );
};

export default memo(SummaryCell);
