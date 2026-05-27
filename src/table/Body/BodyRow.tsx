import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import React, { CSSProperties, memo, useMemo } from 'react';

import { useTableContext } from '../context';
import useFixedInfo from '../hooks/useFixedInfo';
import { ColumnState, StickyOffsets } from '../interface';
import { useStyles } from '../style';
import { isInternalColumn, isRowSortColumn } from '../utils/const';
import { filterCellSpan } from '../utils/handle';
import BodyCell from './BodyCell';

interface BodyRowProps<T = any> {
  rowData: T;
  rowIndex: number;
  rowKeyValue: React.Key;
  flattenColumns: ColumnState<T>[];
  fixedOffset: StickyOffsets;
  className?: string;
  style?: CSSProperties;
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
  indent = 0,
  expanded = false,
  expandable = false,
  rowSupportExpand = false,
  rowSortDragDisabled = false,
  rowSortDropDisabled = false,
  rowSortDragging = false,
}: BodyRowProps) {
  const {
    expandable: expandableConfig,
    getComponent,
    onTriggerExpand,
    rowSortable,
  } = useTableContext();
  const { bodyRowCls, bodyRowExpandableCls, bodyRowSortDraggingCls } =
    useStyles();

  const fixedInfoList = useFixedInfo(flattenColumns, fixedOffset);
  const RowComponent = getComponent(['body', 'row'], 'div');

  const expandByClick =
    !!expandableConfig?.expandRowByClick && rowSupportExpand;
  const firstDataColumnIndex = flattenColumns.findIndex(
    (column) => !isInternalColumn(column),
  );
  const sortableDisabled = !rowSortable || rowKeyValue === undefined;
  const sortableId = (
    typeof rowKeyValue === 'string' || typeof rowKeyValue === 'number'
      ? rowKeyValue
      : `row-sort-${rowIndex}`
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

  return (
    <RowComponent
      className={classNames(
        bodyRowCls,
        {
          [bodyRowExpandableCls]: expandByClick,
          [bodyRowSortDraggingCls]: rowSortActive,
        },
        className,
      )}
      style={mergedStyle}
      onClick={handleClick}
    >
      {flattenColumns?.map((column, colIndex) => {
        if (!filterCellSpan(column.onCell?.(rowData, rowIndex))) return null;

        return (
          <BodyCell
            key={column.key}
            rowData={rowData}
            rowIndex={rowIndex}
            column={column}
            fixedInfo={fixedInfoList[colIndex]}
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
}

export default memo(BodyRow);
