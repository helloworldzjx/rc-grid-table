import ResizeObserver from '@rc-component/resize-observer';
import classNames from 'classnames';
import React, { CSSProperties, FC, ReactNode, Ref, useMemo } from 'react';

import { isNum } from '../../_utils/validate';
import { useComponentsContext } from '../componentsContext';
import { useExpandableContext } from '../expandableContext';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls, getCssVar } from '../style/classNames';
import { useTableLayoutContext } from '../tableLayoutContext';
import { isVirtualBodyRenderMode } from './cellSpan';
import type { BodyRenderMode } from './interface';

interface ExpandedRowProps {
  children?: ReactNode;
  className?: string;
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
  style,
  rowHeight,
  rowRef,
  onRowResize,
  renderMode = 'normal',
  indent = 0,
}) => {
  const {
    columnsWidthTotal,
    containerWidth = 0,
    flattenColumns = [],
  } = useTableLayoutContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();
  const { expandable } = useExpandableContext();

  const {
    bodyRowCls,
    bodyGridRowCls,
    bodyFixedHeightRowCls,
    cellCls,
    expandedRowCls,
    expandedRowCellCls,
    expandedRowContentCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);
  const { bodyFixedHeightRowCssVar } = useMemo(
    () => getCssVar(prefixCls),
    [prefixCls],
  );

  const virtual = isVirtualBodyRenderMode(renderMode);
  const hasFixedRowHeight = isNum(rowHeight) && rowHeight > 0;

  const mergedStyle = useMemo<CSSProperties | undefined>(() => {
    if (!hasFixedRowHeight) {
      return style;
    }

    return {
      ...style,
      [bodyFixedHeightRowCssVar]: `${rowHeight}px`,
    } as CSSProperties;
  }, [bodyFixedHeightRowCssVar, hasFixedRowHeight, rowHeight, style]);

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
        expandedRowCls,
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
        className={classNames(cellCls, expandedRowCellCls)}
        style={cellStyle}
      >
        <div
          className={expandedRowContentCls}
          style={{
            paddingInlineStart: indent * (expandable?.indentSize ?? 15),
          }}
        >
          {children}
        </div>
      </CellComponent>
    </RowComponent>
  );

  if (virtual) {
    return <ResizeObserver onResize={onRowResize}>{rowNode}</ResizeObserver>;
  }

  return rowNode;
};

export default ExpandedRow;
