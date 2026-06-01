import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ResizeObserver from '@rc-component/resize-observer';
import classNames from 'classnames';
import React, { CSSProperties, Ref, memo, useMemo } from 'react';

import { isValidKey } from '../../_utils/validate';
import { useComponentsContext } from '../componentsContext';
import { useExpandableContext } from '../expandableContext';
import useFixedInfo from '../hooks/useFixedInfo';
import { ColumnState, StickyOffsets } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { useRowSortableContext } from '../rowSortableContext';
import { getComponentCls } from '../style/classNames';
import { isInternalColumn, isRowSortColumn } from '../utils/const';
import { getCellSpan } from '../utils/handle';
import BodyCell, { BodyCellVirtualRenderMode } from './BodyCell';

interface BodyRowProps<T = any> {
  rowData: T;
  rowIndex: number;
  rowKeyValue?: React.Key;
  flattenColumns: ColumnState<T>[];
  fixedOffset: StickyOffsets;
  className?: string;
  style?: CSSProperties;
  rowRef?: Ref<HTMLDivElement>;
  onRowResize?: () => void;
  virtual?: boolean;
  virtualRenderMode?: BodyCellVirtualRenderMode;
  getVirtualRowSpanHeight?: (rowSpan: number) => number;
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
  rowRef,
  onRowResize,
  virtual = false,
  virtualRenderMode = 'normal',
  getVirtualRowSpanHeight,
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
    bodyRowExpandableCls,
    bodyRowSortDraggingCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { expandable: expandableConfig, onTriggerExpand } =
    useExpandableContext();
  const { rowSortable } = useRowSortableContext();
  const { getComponent } = useComponentsContext();
  const fixedInfoList = useFixedInfo(flattenColumns, fixedOffset);

  const RowComponent = useMemo(
    () => getComponent(['body', 'row'], 'div'),
    [getComponent],
  );

  const expandByClick =
    !!expandableConfig?.expandRowByClick && rowSupportExpand;
  const firstDataColumnIndex = flattenColumns.findIndex(
    (column) => !isInternalColumn(column),
  );
  const sortableDisabled = !rowSortable || !isValidKey(rowKeyValue);
  const sortableId = (
    isValidKey(rowKeyValue) ? rowKeyValue : `row-sort-${rowIndex}`
  ) as UniqueIdentifier;

  const {
    attributes: rowSortAttributes,
    listeners: rowSortListeners,
    setActivatorNodeRef: setRowSortActivatorNodeRef,
    setNodeRef: setRowSortNodeRef,
    transform: rowSortTransform,
    transition: rowSortTransition,
    isDragging: isRowSortDragging,
    isSorting: isRowSortSorting,
    isOver: isRowSortOver,
  } = useSortable({
    id: sortableId,
    disabled: {
      draggable: sortableDisabled || rowSortDragDisabled,
      droppable: sortableDisabled || rowSortDropDisabled,
    },
    attributes: {
      role: 'button',
      roleDescription: 'sortable row',
      tabIndex: sortableDisabled || rowSortDragDisabled ? -1 : 0,
    },
    data: {
      type: 'rowSortable',
      key: rowKeyValue,
      record: rowData,
      index: rowIndex,
    },
  });

  const rowSortTransformStyle = CSS.Transform.toString(rowSortTransform);
  const rowSortActive = rowSortDragging || isRowSortDragging;
  const rowSortSorting = isRowSortSorting || rowSortDragging;
  const isRowSortDisabled = sortableDisabled || rowSortDragDisabled;

  const rowSortCellStyle = useMemo<CSSProperties | undefined>(() => {
    if (!rowSortSorting) {
      return undefined;
    }

    return {
      transform: 'inherit',
      transition: 'inherit',
      ...(rowSortActive ? { zIndex: 2 } : null),
    };
  }, [rowSortActive, rowSortSorting]);

  const mergedStyle = useMemo<CSSProperties | undefined>(() => {
    if (!rowSortTransformStyle && !rowSortTransition) {
      return style;
    }

    return {
      ...style,
      transform: rowSortTransformStyle,
      transition: rowSortTransition,
    };
  }, [rowSortTransformStyle, rowSortTransition, style]);

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
          [bodyRowExpandableCls]: expandByClick,
          [bodyRowSortDraggingCls]: rowSortActive,
        },
        className,
      )}
      style={mergedStyle}
      onClick={handleClick}
      ref={rowRef}
    >
      {flattenColumns?.map((column, colIndex) => {
        if (!virtual) {
          const cellProps = column.onCell?.(rowData, rowIndex);
          if (
            getCellSpan(cellProps?.rowSpan) === 0 ||
            getCellSpan(cellProps?.colSpan) === 0
          ) {
            return null;
          }
        }

        return (
          <BodyCell
            key={column.key}
            rowData={rowData}
            rowIndex={rowIndex}
            column={column}
            fixedInfo={fixedInfoList[colIndex]}
            virtual={virtual}
            colIndex={colIndex}
            virtualRenderMode={virtualRenderMode}
            getVirtualRowSpanHeight={getVirtualRowSpanHeight}
            indent={indent}
            expanded={expanded}
            expandable={expandable}
            rowSupportExpand={rowSupportExpand}
            isFirstDataColumn={colIndex === firstDataColumnIndex}
            rowSortKey={rowKeyValue}
            rowSortDragDisabled={rowSortDragDisabled}
            rowSortDragging={rowSortActive}
            rowSortIsOver={isRowSortOver}
            rowSortCellStyle={rowSortCellStyle}
            rowSortAttributes={rowSortAttributes}
            rowSortListeners={isRowSortDisabled ? undefined : rowSortListeners}
            setRowSortActivatorNodeRef={setRowSortActivatorNodeRef}
            setRowSortNodeRef={
              isRowSortColumn(column) ? setRowSortNodeRef : undefined
            }
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
