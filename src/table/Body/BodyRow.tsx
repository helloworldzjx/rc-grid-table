import ResizeObserver from '@rc-component/resize-observer';
import classNames from 'classnames';
import React, { CSSProperties, Ref, memo, useMemo } from 'react';

import { isNum } from '../../_utils/validate';
import { useColumnSortPreviewLayoutContext } from '../columnSortPreviewLayoutContext';
import { useComponentsContext } from '../componentsContext';
import { useExpandableContext } from '../expandableContext';
import useFixedInfo from '../hooks/useFixedInfo';
import { ColumnState, StickyOffsets } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls, getCssVar } from '../style/classNames';
import { isInternalColumn, isRowSortColumn } from '../utils/const';
import BodyCell from './BodyCell';
import { isVirtualBodyRenderMode } from './cellSpan';
import type { BodyRenderMode } from './interface';
import useRowSort from './useRowSort';

interface BodyRowProps<T = any> {
  rowData: T;
  rowIndex: number;
  rowKeyValue?: React.Key;
  flattenColumns: ColumnState<T>[];
  fixedOffset: StickyOffsets;
  className?: string;
  style?: CSSProperties;
  rowHeight?: number;
  rowRef?: Ref<HTMLDivElement>;
  onRowResize?: () => void;
  rowSortOverlay?: boolean;
  renderMode?: BodyRenderMode;
  getRowSpanHeight?: (rowSpan: number) => number;
  indent?: number;
  expanded?: boolean;
  expandable?: boolean;
  rowSupportExpand?: boolean;
  rowSortDragDisabled?: boolean;
  rowSortDropDisabled?: boolean;
  rowSortDragging?: boolean;
}

function BodyRow({
  rowData,
  rowIndex,
  rowKeyValue,
  flattenColumns,
  fixedOffset,
  className,
  style,
  rowHeight,
  rowRef,
  onRowResize,
  rowSortOverlay = false,
  renderMode = 'normal',
  getRowSpanHeight,
  indent = 0,
  expanded = false,
  expandable = false,
  rowSupportExpand = false,
  rowSortDragDisabled = false,
  rowSortDropDisabled = false,
  rowSortDragging = false,
}: BodyRowProps) {
  const prefixCls = usePrefixClsContext();

  const {
    bodyRowCls,
    bodyGridRowCls,
    bodyFixedHeightRowCls,
    bodyExpandableRowCls,
    bodySortDraggingRowCls,
    bodySortDraggingOverlayRowCls,
    bodySortFirstRowCls,
    bodySortLastRowCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);
  const { bodyFixedHeightRowCssVar } = useMemo(
    () => getCssVar(prefixCls),
    [prefixCls],
  );

  const { expandable: expandableConfig, onTriggerExpand } =
    useExpandableContext();
  const { getComponent } = useComponentsContext();
  const previewLayout = useColumnSortPreviewLayoutContext();
  // body 渲染读取预览列顺序，但虚拟滚动高度、滚动容器等仍由 Table 的真实布局维护。
  const renderedFlattenColumns = previewLayout.flattenColumns ?? flattenColumns;
  const renderedFixedOffset = previewLayout.fixedOffset ?? fixedOffset;
  const fixedInfoList = useFixedInfo(
    renderedFlattenColumns,
    renderedFixedOffset,
  );

  const RowComponent = useMemo(
    () => getComponent(['body', 'row'], 'div'),
    [getComponent],
  );

  const expandByClick =
    !!expandableConfig?.expandRowByClick && rowSupportExpand;
  const virtual = isVirtualBodyRenderMode(renderMode);
  const hasFixedRowHeight =
    renderMode !== 'rowSpanOverlay' && isNum(rowHeight) && rowHeight > 0;
  const mergedRowStyle = useMemo<CSSProperties | undefined>(() => {
    if (!hasFixedRowHeight) {
      return style;
    }

    return {
      ...style,
      [bodyFixedHeightRowCssVar]: `${rowHeight}px`,
    } as CSSProperties;
  }, [bodyFixedHeightRowCssVar, hasFixedRowHeight, rowHeight, style]);
  const firstDataColumnIndex = renderedFlattenColumns.findIndex(
    (column) => !isInternalColumn(column),
  );

  const rowSort = useRowSort({
    rowData,
    rowIndex,
    rowKeyValue,
    rowRef,
    style: mergedRowStyle,
    virtual,
    rowSortDragDisabled,
    rowSortDropDisabled,
    rowSortOverlay,
    rowSortDragging,
  });

  const handleClick = () => {
    if (expandByClick) {
      onTriggerExpand?.(rowData);
    }
  };

  const rowNode = (
    <RowComponent
      className={classNames(
        bodyRowCls,
        {
          [bodyGridRowCls]: virtual,
          [bodyFixedHeightRowCls]: hasFixedRowHeight,
          [bodyExpandableRowCls]: expandByClick,
          [bodySortDraggingRowCls]: rowSort.active && !rowSortOverlay,
          [bodySortDraggingOverlayRowCls]: rowSort.active && rowSortOverlay,
          [bodySortFirstRowCls]: rowSort.first && !rowSortOverlay,
          [bodySortLastRowCls]: rowSort.last && !rowSortOverlay,
        },
        className,
      )}
      style={rowSort.rowStyle}
      onClick={handleClick}
      ref={rowSort.rowRef}
    >
      {renderedFlattenColumns.map((column, colIndex) => {
        const rowSortControlColumn = isRowSortColumn(column);

        return (
          <BodyCell
            key={column.key}
            rowData={rowData}
            rowIndex={rowIndex}
            column={column}
            fixedInfo={fixedInfoList[colIndex]}
            flattenColumns={renderedFlattenColumns}
            renderMode={renderMode}
            colIndex={colIndex}
            getRowSpanHeight={getRowSpanHeight}
            indent={indent}
            expanded={expanded}
            expandable={expandable}
            rowSupportExpand={rowSupportExpand}
            isFirstDataColumn={colIndex === firstDataColumnIndex}
            rowSortKey={rowKeyValue}
            rowSortDragDisabled={rowSortDragDisabled}
            rowSortDragging={rowSort.active}
            rowSortIsOver={rowSort.isOver}
            rowSortCellStyle={rowSort.cellStyle}
            {...(rowSortControlColumn && {
              rowSortAttributes: rowSort.attributes,
              rowSortListeners: rowSort.listeners,
              setRowSortActivatorNodeRef: rowSort.setActivatorNodeRef,
            })}
            setRowSortNodeRef={rowSort.getNodeRef(column)}
          />
        );
      })}
    </RowComponent>
  );

  if (virtual) {
    return <ResizeObserver onResize={onRowResize}>{rowNode}</ResizeObserver>;
  }

  return rowNode;
}

export default memo(BodyRow);
