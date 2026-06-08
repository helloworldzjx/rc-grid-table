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
  useCallback,
  useMemo,
} from 'react';

import { isValidKey } from '../../_utils/validate';
import CellContainer from '../CellContainer';
import { useComponentsContext } from '../componentsContext';
import { useExpandableContext } from '../expandableContext';
import { useFixedShadowActive } from '../fixedShadowContext';
import { ColumnState } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { useRowSelectionContext } from '../rowSelectionContext';
import { SelectionCheckbox, SelectionRadio } from '../Selection';
import { getComponentCls } from '../style/classNames';
import {
  isExpandColumn,
  isRowSortColumn,
  isSelectionColumn,
} from '../utils/const';
import { FixedInfo } from '../utils/fixedColumns';
import { getEllipsisTitle } from '../utils/handle';
import { getBodyCellSpanInfo } from './cellSpan';
import type { BodyRenderMode } from './interface';
import RowSortBodyCell from './RowSortBodyCell';

interface BodyRowProps<T = any> {
  column: ColumnState<T>;
  rowData: T;
  rowIndex: number;
  fixedInfo: FixedInfo;
  flattenColumns: ColumnState<T>[];
  renderMode?: BodyRenderMode;
  colIndex?: number;
  getRowSpanHeight?: (rowSpan: number) => number;
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
  flattenColumns,
  renderMode = 'normal',
  colIndex,
  getRowSpanHeight,
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
    expandControlCellCls,
    expandControlCls,
    selectionCellCls,
    expandTreeCellInnerCls,
    expandIconCls,
    expandIconExpandedCls,
    expandIconSpacedCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { expandable: expandableConfig, onTriggerExpand } =
    useExpandableContext();
  const { rowSelection, selection } = useRowSelectionContext();
  const { getComponent } = useComponentsContext();

  const CellComponent = useMemo(
    () => getComponent(['body', 'cell'], 'div'),
    [getComponent],
  );
  const fixedShadowActive = useFixedShadowActive(fixedInfo);

  const cellProps = useMemo(
    () => column.onCell?.(rowData, rowIndex) || {},
    [column.onCell, rowData, rowIndex],
  );
  const spanInfo = useMemo(
    () =>
      getBodyCellSpanInfo({
        renderMode,
        rowSpan: cellProps.rowSpan,
        colSpan: cellProps.colSpan,
        colIndex,
        getRowSpanHeight,
      }),
    [
      cellProps.colSpan,
      cellProps.rowSpan,
      colIndex,
      getRowSpanHeight,
      renderMode,
    ],
  );
  const motionKeys = useMemo(() => {
    // colSpan cell 需要按覆盖的叶子列参与 motion 区间判断；
    // 普通 renderMode 也传 colIndex，是为了让列顺序变化时 body cell 的位置签名同步变化。
    const startIndex =
      colIndex ?? flattenColumns.findIndex((item) => item.key === column.key);
    const colSpan = spanInfo.colSpan || 1;

    if (startIndex < 0 || colSpan <= 1) {
      return [column.key];
    }

    return flattenColumns
      .slice(startIndex, startIndex + colSpan)
      .map((item) => item.key);
  }, [colIndex, column.key, flattenColumns, spanInfo.colSpan]);

  const mergedStyle = useMemo(() => {
    const style: CSSProperties = { ...spanInfo.style };

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
    };
  }, [
    cellProps,
    fixedInfo.fixStart,
    fixedInfo.fixEnd,
    column.align,
    column.style,
    rowSortCellStyle,
    spanInfo.style,
  ]);
  const motionLayoutDependency = useMemo(
    () =>
      [
        // 签名只描述影响列位置的因素，避免内容/hover 等状态导致 motion 额外测量。
        motionKeys.join(','),
        renderMode,
        colIndex ?? '',
        spanInfo.rowSpan,
        spanInfo.colSpan,
        spanInfo.style.gridColumn ?? '',
        spanInfo.style.gridRow ?? '',
        spanInfo.style.height ?? '',
        fixedInfo.fixStart ?? '',
        fixedInfo.fixEnd ?? '',
      ].join('|'),
    [
      motionKeys,
      renderMode,
      colIndex,
      spanInfo.rowSpan,
      spanInfo.colSpan,
      spanInfo.style.gridColumn,
      spanInfo.style.gridRow,
      spanInfo.style.height,
      fixedInfo.fixStart,
      fixedInfo.fixEnd,
    ],
  );

  const restCellProps = useMemo(() => {
    const restProps = { ...column.onCell?.(rowData, rowIndex) };
    delete restProps.rowSpan;
    delete restProps.colSpan;
    delete restProps.style;
    delete restProps.align;
    delete restProps.className;
    return restProps;
  }, [column.onCell, rowData, rowIndex]);

  const isInternalExpandColumn = isExpandColumn(column);
  const isInternalSelectionColumn = isSelectionColumn(column);
  const isInternalRowSortColumn = isRowSortColumn(column);

  const selectionType = rowSelection?.type ?? 'checkbox';
  const selectionChecked = selection?.isSelected(rowData) ?? false;
  const selectionControlProps = useMemo(
    () =>
      selectionType === 'radio'
        ? rowSelection?.getRadioProps?.(rowData) || {}
        : rowSelection?.getCheckboxProps?.(rowData) || {},
    [rowData, rowSelection, selectionType],
  );
  const mergedSelectionControlStyle = useMemo<CSSProperties>(
    () => ({
      ...selectionControlProps.style,
      justifyContent: rowSelection?.align ?? 'center',
    }),
    [selectionControlProps.style, rowSelection?.align],
  );

  const handleExpand = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (rowSupportExpand) {
        onTriggerExpand?.(rowData);
      }
    },
    [onTriggerExpand, rowData, rowSupportExpand],
  );

  const expandIconProps = useMemo(
    () => ({
      expanded,
      expandable: rowSupportExpand,
      record: rowData,
      index: rowIndex,
      indent,
      onExpand: (_record: any, event: MouseEvent<HTMLElement>) =>
        handleExpand(event),
    }),
    [expanded, handleExpand, indent, rowData, rowIndex, rowSupportExpand],
  );

  if (spanInfo.hidden) {
    return null;
  }

  const renderExpandIcon = (spaced = false) => {
    const iconNode = expandableConfig?.expandIcon ? (
      expandableConfig.expandIcon(expandIconProps)
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

    const disabled = !!selectionControlProps.disabled;
    const originNode =
      selectionType === 'radio' ? (
        <SelectionRadio
          {...selectionControlProps}
          style={mergedSelectionControlStyle}
          checked={selectionChecked}
          disabled={disabled}
          onChange={(event) =>
            selection.onSelectRecord(rowData, rowIndex, event)
          }
        />
      ) : (
        <SelectionCheckbox
          {...selectionControlProps}
          style={mergedSelectionControlStyle}
          checked={selectionChecked}
          indeterminate={selection.isHalfSelected(rowData)}
          disabled={disabled}
          onChange={(event) =>
            selection.onSelectRecord(rowData, rowIndex, event)
          }
        />
      );

    return (
      rowSelection.renderCell?.(
        selectionChecked,
        rowData,
        rowIndex,
        originNode,
      ) ?? originNode
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
      <div title={elTitle} className={ellipsisCellInnerCls}>
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
        motionKeys={motionKeys}
        motionLayoutDependency={motionLayoutDependency}
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
          [ellipsisCellCls]: ellipsis,
          [fixedStartCellCls]: fixedInfo.fixStart !== null,
          [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
          [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
          [fixedEndCellCls]: fixedInfo.fixEnd !== null,
          [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
          [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
          [expandControlCellCls]: isInternalExpandColumn,
          [selectionCellCls]: isInternalSelectionColumn,
        },
        column.className,
        cellProps.className,
      )}
      style={mergedStyle}
      motionKeys={motionKeys}
      motionLayoutDependency={motionLayoutDependency}
      {...restCellProps}
    >
      {childrenNode}
    </CellContainer>
  );
}

export default memo(BodyCell);
