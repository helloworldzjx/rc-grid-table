import ResizeObserver from '@rc-component/resize-observer';
import classNames from 'classnames';
import React, { CSSProperties, FC, ReactNode, Ref, useMemo } from 'react';

import { isNum } from '../../_utils/validate';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableLayoutContext } from '../contexts/TableLayoutContext';
import { getComponentCls, getCssVar } from '../style/classNames';
import type { BodyRenderMode } from './interface';

interface ExpandedRowProps {
  children?: ReactNode;
  className?: string;
  expanded?: boolean;
  style?: CSSProperties;
  rowHeight?: number;
  rowRef?: Ref<HTMLDivElement>;
  onRowResize?: () => void;
  renderMode?: BodyRenderMode;
  indent?: number;
}

const ExpandedRow: FC<ExpandedRowProps> = ({
  children,
  className,
  expanded = true,
  style,
  rowHeight,
  rowRef,
  onRowResize,
  renderMode = 'normal',
}) => {
  const {
    columnsWidthTotal,
    containerWidth = 0,
    flattenColumns = [],
  } = useTableLayoutContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();

  const {
    bodyRowCls,
    bodyGridRowCls,
    bodyFixedHeightRowCls,
    cellCls,
    bodyExpandedRowCls,
    bodyExpandedRowCellCls,
    bodyExpandedRowContentCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);
  const { bodyFixedHeightRowCssVar } = useMemo(
    () => getCssVar(prefixCls),
    [prefixCls],
  );

  const virtual = renderMode !== 'normal';
  const hasFixedRowHeight = isNum(rowHeight) && rowHeight > 0;

  const mergedStyle = useMemo<CSSProperties | undefined>(() => {
    const displayStyle = expanded
      ? style
      : ({
          ...style,
          display: 'none',
        } as CSSProperties);

    if (!hasFixedRowHeight) {
      return displayStyle;
    }

    return {
      ...displayStyle,
      [bodyFixedHeightRowCssVar]: `${rowHeight}px`,
    } as CSSProperties;
  }, [bodyFixedHeightRowCssVar, expanded, hasFixedRowHeight, rowHeight, style]);

  const expandedRowCellWidth = Math.min(
    columnsWidthTotal,
    containerWidth || columnsWidthTotal,
  );

  const cellStyle = useMemo<CSSProperties>(
    () => ({
      gridColumn: `span ${flattenColumns.length || 1}`,
      width: expandedRowCellWidth,
    }),
    [expandedRowCellWidth, flattenColumns.length],
  );

  const RowComponent = useMemo(
    () => getComponent(['body', 'row'], 'div'),
    [getComponent],
  );

  const CellComponent = useMemo(
    () => getComponent(['body', 'cell'], 'div'),
    [getComponent],
  );

  const rowNode = (
    <RowComponent
      className={classNames(
        bodyRowCls,
        bodyExpandedRowCls,
        {
          [bodyGridRowCls]: virtual,
          [bodyFixedHeightRowCls]: hasFixedRowHeight,
        },
        className,
      )}
      style={mergedStyle}
      ref={rowRef}
    >
      <CellComponent
        className={classNames(cellCls, bodyExpandedRowCellCls)}
        style={cellStyle}
      >
        <div className={bodyExpandedRowContentCls}>{children}</div>
      </CellComponent>
    </RowComponent>
  );

  if (virtual) {
    return <ResizeObserver onResize={onRowResize}>{rowNode}</ResizeObserver>;
  }

  return rowNode;
};

export default ExpandedRow;
