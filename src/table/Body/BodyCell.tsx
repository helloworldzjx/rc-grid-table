import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import classNames from 'classnames';
import React, {
  CSSProperties,
  Key,
  memo,
  MouseEvent,
  ReactNode,
  useMemo,
} from 'react';

import { isNum, isValidKey } from '../../_utils/validate';
import CellContainer from '../CellContainer';
import { useTableContext } from '../context';
import { ColumnState } from '../interface';
import { SelectionCheckbox, SelectionRadio } from '../Selection';
import { useStyles } from '../style';
import {
  isExpandColumn,
  isRowSortColumn,
  isSelectionColumn,
} from '../utils/const';
import { FixedInfo } from '../utils/fixedColumns';
import { getCellSpan, getEllipsisTitle } from '../utils/handle';
import RowSortBodyCell from './RowSortBodyCell';

export type BodyCellVirtualRenderMode = 'normal' | 'rowSpan';

interface BodyRowProps<T = any> {
  column: ColumnState<T>;
  rowData: T;
  rowIndex: number;
  fixedInfo: FixedInfo;
  virtual?: boolean;
  colIndex?: number;
  virtualRenderMode?: BodyCellVirtualRenderMode;
  getVirtualRowSpanHeight?: (rowSpan: number) => number;
  indent?: number;
  expanded?: boolean;
  expandable?: boolean;
  rowSupportExpand?: boolean;
  isFirstDataColumn?: boolean;
  rowSortKey?: Key;
  rowSortDragDisabled?: boolean;
  rowSortDragging?: boolean;
  rowSortIsOver?: boolean;
  rowSortCellStyle?: CSSProperties;
  rowSortAttributes?: DraggableAttributes;
  rowSortListeners?: DraggableSyntheticListeners;
  setRowSortActivatorNodeRef?: (element: HTMLElement | null) => void;
  setRowSortNodeRef?: (element: HTMLElement | null) => void;
}

function BodyCell({
  rowData,
  column,
  rowIndex,
  fixedInfo,
  virtual = false,
  colIndex,
  virtualRenderMode = 'normal',
  getVirtualRowSpanHeight,
  indent = 0,
  expanded = false,
  expandable = false,
  rowSupportExpand = false,
  isFirstDataColumn = false,
  rowSortKey,
  rowSortDragDisabled = false,
  rowSortDragging = false,
  rowSortIsOver = false,
  rowSortCellStyle,
  rowSortAttributes,
  rowSortListeners,
  setRowSortActivatorNodeRef,
  setRowSortNodeRef,
}: BodyRowProps) {
  const {
    expandable: expandableConfig,
    rowSelection,
    selection,
    onTriggerExpand,
    getComponent,
  } = useTableContext();

  const {
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    expandControlCellCls,
    expandControlCls,
    selectionCellCls,
    expandTreeCellInnerCls,
    expandIconCls,
    expandIconExpandedCls,
    expandIconSpacedCls,
  } = useStyles();
  const CellComponent = getComponent(['body', 'cell'], 'div');

  const cellProps = useMemo(
    () => column.onCell?.(rowData, rowIndex) || {},
    [column.onCell, rowData, rowIndex],
  );
  const rowSpan = getCellSpan(cellProps.rowSpan);
  const colSpan = getCellSpan(cellProps.colSpan);
  const hiddenByVirtual =
    virtual &&
    (virtualRenderMode === 'rowSpan'
      ? rowSpan <= 1 || colSpan === 0
      : rowSpan === 0 || colSpan === 0 || rowSpan > 1);

  const mergedStyle = useMemo(() => {
    const style: CSSProperties = {};
    const virtualRowSpanStyle: CSSProperties = {};

    if (virtual && colIndex !== undefined) {
      style.gridColumn = `${colIndex + 1} / span ${colSpan || 1}`;
      if (virtualRenderMode === 'rowSpan') {
        virtualRowSpanStyle.height = getVirtualRowSpanHeight?.(rowSpan);
      }
    } else {
      if (isNum(rowSpan) && rowSpan > 1) {
        style.gridRow = `span ${rowSpan}`;
      }
      if (isNum(colSpan) && colSpan > 1) {
        style.gridColumn = `span ${colSpan}`;
      }
    }

    if (fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number;
    }
    if (fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number;
    }
    const align = cellProps.align ?? column.align;
    if (align) {
      style.textAlign = align;
    }

    return {
      ...style,
      ...column.style,
      ...cellProps.style,
      ...rowSortCellStyle,
      ...virtualRowSpanStyle,
    };
  }, [
    cellProps,
    fixedInfo.fixStart,
    fixedInfo.fixEnd,
    column.align,
    column.style,
    rowSortCellStyle,
    virtual,
    colIndex,
    virtualRenderMode,
    getVirtualRowSpanHeight,
    rowSpan,
    colSpan,
  ]);

  const restCellProps = useMemo(() => {
    const restProps = { ...column.onCell?.(rowData, rowIndex) };
    delete restProps.rowSpan;
    delete restProps.colSpan;
    delete restProps.style;
    delete restProps.align;
    delete restProps.className;
    return restProps;
  }, [column.onCell, rowData, rowIndex]);

  if (hiddenByVirtual) {
    return null;
  }

  const isInternalExpandColumn = isExpandColumn(column);
  const isInternalSelectionColumn = isSelectionColumn(column);
  const isInternalRowSortColumn = isRowSortColumn(column);

  const handleExpand = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (rowSupportExpand) {
      onTriggerExpand?.(rowData);
    }
  };

  const renderExpandIcon = (spaced = false) => {
    const iconProps = {
      expanded,
      expandable: rowSupportExpand,
      record: rowData,
      index: rowIndex,
      indent,
      onExpand: (_record: any, event: MouseEvent<HTMLElement>) =>
        handleExpand(event),
    };

    const iconNode = expandableConfig?.expandIcon ? (
      expandableConfig.expandIcon(iconProps)
    ) : (
      <button
        type="button"
        className={classNames(expandIconCls, {
          [expandIconExpandedCls]: expanded,
          [expandIconSpacedCls]: spaced || !rowSupportExpand,
        })}
        aria-label={expanded ? 'Collapse row' : 'Expand row'}
        aria-expanded={rowSupportExpand ? expanded : undefined}
        disabled={!rowSupportExpand}
        onClick={handleExpand}
      />
    );

    return (
      <div
        className={expandControlCls}
        style={{ justifyContent: expandableConfig?.align ?? 'center' }}
      >
        {iconNode}
      </div>
    );
  };

  const renderSelectionControl = () => {
    if (!selection || !rowSelection) return null;

    const type = rowSelection.type ?? 'checkbox';
    const checked = selection.isSelected(rowData);
    const controlProps =
      type === 'radio'
        ? rowSelection.getRadioProps?.(rowData) || {}
        : rowSelection.getCheckboxProps?.(rowData) || {};
    const disabled = !!controlProps.disabled;
    const originNode =
      type === 'radio' ? (
        <SelectionRadio
          {...controlProps}
          style={{
            ...controlProps.style,
            justifyContent: rowSelection.align ?? 'center',
          }}
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            selection.onSelectRecord(rowData, rowIndex, event)
          }
        />
      ) : (
        <SelectionCheckbox
          {...controlProps}
          style={{
            ...controlProps.style,
            justifyContent: rowSelection.align ?? 'center',
          }}
          checked={checked}
          indeterminate={selection.isHalfSelected(rowData)}
          disabled={disabled}
          onChange={(event) =>
            selection.onSelectRecord(rowData, rowIndex, event)
          }
        />
      );

    return (
      rowSelection.renderCell?.(checked, rowData, rowIndex, originNode) ??
      originNode
    );
  };

  let cellValue: ReactNode = undefined;
  if (
    !isInternalExpandColumn &&
    !isInternalSelectionColumn &&
    !isInternalRowSortColumn &&
    isValidKey(column.dataIndex) &&
    typeof column.dataIndex === 'string'
  ) {
    cellValue = rowData?.[column.dataIndex];
  }
  if (
    !isInternalExpandColumn &&
    !isInternalSelectionColumn &&
    !isInternalRowSortColumn &&
    column.render &&
    typeof column.render === 'function'
  ) {
    cellValue = column.render?.(cellValue, rowData, rowIndex);
  }

  let childrenNode = isInternalExpandColumn
    ? renderExpandIcon()
    : isInternalSelectionColumn
    ? renderSelectionControl()
    : cellValue;
  const ellipsis = !!column.ellipsis;
  if (ellipsis) {
    const showTitle =
      typeof column.ellipsis === 'boolean'
        ? column.ellipsis
        : column.ellipsis?.showTitle;
    const elTitle = showTitle
      ? (getEllipsisTitle(childrenNode) as string)
      : undefined;
    childrenNode = (
      <div title={elTitle} className={cellEllipsisInnerCls}>
        {childrenNode}
      </div>
    );
  }

  if (
    !isInternalExpandColumn &&
    !isInternalSelectionColumn &&
    !isInternalRowSortColumn &&
    isFirstDataColumn &&
    expandable &&
    !expandableConfig?.expandedRowRender
  ) {
    childrenNode = (
      <div
        className={expandTreeCellInnerCls}
        style={{
          paddingInlineStart: indent * (expandableConfig?.indentSize ?? 15),
        }}
      >
        {renderExpandIcon(true)}
        <span>{childrenNode}</span>
      </div>
    );
  }

  if (isInternalRowSortColumn) {
    return (
      <RowSortBodyCell
        cellClassName={cellProps.className}
        restCellProps={restCellProps}
        column={column}
        fixedInfo={fixedInfo}
        indent={indent}
        mergedStyle={mergedStyle}
        rowData={rowData}
        rowIndex={rowIndex}
        rowSortDragDisabled={rowSortDragDisabled}
        rowSortDragging={rowSortDragging}
        rowSortIsOver={rowSortIsOver}
        rowSortKey={rowSortKey}
        rowSortAttributes={rowSortAttributes}
        rowSortListeners={rowSortListeners}
        setRowSortActivatorNodeRef={setRowSortActivatorNodeRef}
        setRowSortNodeRef={setRowSortNodeRef}
      />
    );
  }

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        {
          [cellEllipsisCls]: ellipsis,
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [expandControlCellCls]: isInternalExpandColumn,
          [selectionCellCls]: isInternalSelectionColumn,
        },
        column.className,
        cellProps.className,
      )}
      style={mergedStyle}
      {...restCellProps}
    >
      {childrenNode}
    </CellContainer>
  );
}

export default memo(BodyCell);
