import ResizeObserver from '@rc-component/resize-observer';
import classNames from 'classnames';
import React, { CSSProperties, FC, ReactNode, Ref, useMemo } from 'react';

import { isNum } from '../../_utils/validate';
import { useComponentsContext } from '../componentsContext';
import { useTableContext } from '../context';
import { useExpandableContext } from '../expandableContext';
import type { VirtualColumnsState } from '../hooks/useVirtualColumns';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls, getCssVar } from '../style/classNames';
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
  virtualColumns: VirtualColumnsState;
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
  virtualColumns,
  indent = 0,
}) => {
  const {
    columnsWidthTotal,
    containerWidth = 0,
    flattenColumns = [],
  } = useTableContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();
  const { expandable } = useExpandableContext();

  const {
    bodyRowCls,
    bodyGridRowCls,
    bodyRowFixedHeightCls,
    cellCls,
    expandedRowCls,
    expandedRowCellCls,
    expandedRowContentCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);
  const { bodyRowFixedHeightCssVar } = useMemo(
    () => getCssVar(prefixCls),
    [prefixCls],
  );

  const RowComponent = getComponent(['body', 'row'], 'div');
  const CellComponent = getComponent(['body', 'cell'], 'div');
  const virtual = isVirtualBodyRenderMode(renderMode);
  const virtualColumn = virtualColumns.inVirtual;
  const hasFixedRowHeight = isNum(rowHeight) && rowHeight > 0;
  const mergedStyle = useMemo<CSSProperties | undefined>(() => {
    if (!hasFixedRowHeight) {
      return style;
    }

    return {
      ...style,
      [bodyRowFixedHeightCssVar]: `${rowHeight}px`,
    } as CSSProperties;
  }, [bodyRowFixedHeightCssVar, hasFixedRowHeight, rowHeight, style]);
  const expandedRowCellWidth = Math.min(
    columnsWidthTotal,
    containerWidth || columnsWidthTotal,
  );

  const rowNode = (
    <RowComponent
      className={classNames(
        bodyRowCls,
        expandedRowCls,
        {
          [bodyGridRowCls]: virtual || virtualColumn,
          [bodyRowFixedHeightCls]: hasFixedRowHeight,
        },
        className,
      )}
      style={mergedStyle}
      ref={rowRef}
    >
      <CellComponent
        className={classNames(cellCls, expandedRowCellCls)}
        style={{
          gridColumn: virtualColumn
            ? `1 / span ${flattenColumns.length || 1}`
            : `span ${flattenColumns.length || 1}`,
          width: expandedRowCellWidth,
        }}
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
