import ResizeObserver from '@rc-component/resize-observer';
import classNames from 'classnames';
import React, {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  Ref,
  memo,
  useCallback,
  useMemo,
} from 'react';

import { isNum } from '../../_utils/validate';
import { useBodyHoverRowHovered } from '../contexts/BodyHoverContext';
import { useColumnSortPreviewLayoutContext } from '../contexts/ColumnSortPreviewLayoutContext';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { useExpandableContext } from '../contexts/ExpandableContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableContext } from '../contexts/TableContext';
import useFixedInfo from '../hooks/useFixedInfo';
import type { InternalColumnState, StickyOffsets } from '../internalInterface';
import { useRowSort } from '../RowSort';
import { getComponentCls, getCssVar } from '../style/classNames';
import { isInternalColumn, isRowSortColumn } from '../utils/const';
import BodyCell from './BodyCell';
import type { BodyRenderMode } from './interface';

interface BodyRowProps<T = any> {
  rowData: T;
  rowIndex: number;
  rowKeyValue?: React.Key;
  flattenColumns: InternalColumnState<T>[];
  fixedOffset: StickyOffsets;
  className?: string;
  rowProps?: HTMLAttributes<any>;
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
  rowHoverable?: boolean;
  cellHoverable?: boolean;
}

function BodyRow({
  rowData,
  rowIndex,
  rowKeyValue,
  flattenColumns,
  fixedOffset,
  className,
  rowProps,
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
  rowHoverable = true,
  cellHoverable = true,
}: BodyRowProps) {
  const prefixCls = usePrefixClsContext();
  const { stripe } = useTableContext();

  const {
    bodyRowCls,
    bodyStripeRowCls,
    bodyHoverRowCls,
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
  const virtual = renderMode !== 'normal';
  const hasFixedRowHeight =
    renderMode !== 'rowSpanOverlay' && isNum(rowHeight) && rowHeight > 0;

  const mergedRowStyle = useMemo<CSSProperties | undefined>(() => {
    if (!hasFixedRowHeight) {
      return {
        ...rowProps?.style,
        ...style,
      };
    }

    return {
      ...rowProps?.style,
      ...style,
      [bodyFixedHeightRowCssVar]: `${rowHeight}px`,
    } as CSSProperties;
  }, [
    bodyFixedHeightRowCssVar,
    hasFixedRowHeight,
    rowHeight,
    rowProps?.style,
    style,
  ]);

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
  const hovered = useBodyHoverRowHovered({
    rowIndex,
    hoverable: rowHoverable,
  });

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      rowProps?.onClick?.(event);
      if (event.defaultPrevented) return;

      if (expandByClick) {
        onTriggerExpand?.(rowData);
      }
    },
    [expandByClick, onTriggerExpand, rowData, rowProps],
  );

  const restRowProps = useMemo(() => {
    const restProps = { ...rowProps };
    delete restProps.className;
    delete restProps.style;
    delete restProps.onClick;
    return restProps;
  }, [rowProps]);

  const handleInternalClick = useCallback(() => {
    if (expandByClick) {
      onTriggerExpand?.(rowData);
    }
  }, [expandByClick, onTriggerExpand, rowData]);

  const rowNode = (
    <RowComponent
      {...restRowProps}
      className={classNames(
        bodyRowCls,
        {
          [bodyGridRowCls]: virtual,
          [bodyStripeRowCls]: stripe && (rowIndex + 1) % 2 === 0,
          [bodyFixedHeightRowCls]: hasFixedRowHeight,
          [bodyExpandableRowCls]: expandByClick,
          [bodySortDraggingRowCls]: rowSort.active && !rowSortOverlay,
          [bodySortDraggingOverlayRowCls]: rowSort.active && rowSortOverlay,
          [bodySortFirstRowCls]: rowSort.first && !rowSortOverlay,
          [bodySortLastRowCls]: rowSort.last && !rowSortOverlay,
          [bodyHoverRowCls]: hovered,
        },
        className,
        rowProps?.className,
      )}
      style={rowSort.rowStyle}
      onClick={rowProps?.onClick ? handleClick : handleInternalClick}
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
            hoverable={cellHoverable}
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
