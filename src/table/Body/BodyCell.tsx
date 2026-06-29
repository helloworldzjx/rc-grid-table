import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import classNames from 'classnames';
import React, { CSSProperties, Key, memo, ReactNode, useMemo } from 'react';

import { isValidKey } from '../../_utils/validate';
import CellContainer from '../CellContainer';
import {
  useBodyHoverCellHovered,
  useBodyHoverCellRef,
} from '../contexts/BodyHoverContext';
import { useColumnSortableContext } from '../contexts/ColumnSortableContext';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { useDataSortContext } from '../contexts/DataSortContext';
import { useExpandableContext } from '../contexts/ExpandableContext';
import { useFixedShadowActive } from '../contexts/FixedShadowContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableContext } from '../contexts/TableContext';
import { ExpandControl, TreeCellControl } from '../Expand';
import type { InternalColumnState } from '../internalInterface';
import { RowSortBodyCell } from '../RowSort';
import { BodySelectionCell } from '../Selection';
import { getComponentCls } from '../style/classNames';
import { mergeCellProps } from '../utils/cellProps';
import {
  isExpandColumn,
  isRowSortColumn,
  isSelectionColumn,
} from '../utils/const';
import { getEllipsisShowTitle, getEllipsisTitle } from '../utils/ellipsis';
import { FixedInfo } from '../utils/fixedColumns';
import { getDataSortColumnKey } from '../utils/sort';
import { getBodyCellSpanInfo } from './cellSpan';
import type { BodyRenderMode } from './interface';

interface BodyCellProps<T = any> {
  column: InternalColumnState<T>;
  rowData: T;
  rowIndex: number;
  fixedInfo: FixedInfo;
  flattenColumns: InternalColumnState<T>[];
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
  hoverable?: boolean;
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
  hoverable = true,
}: BodyCellProps) {
  const prefixCls = usePrefixClsContext();

  const {
    cellCls,
    ellipsisCellCls,
    ellipsisCellInnerCls,
    expandTreeCellCls,
    expandTreeCellInnerCls,
    expandTreeCellInnerSpacedCls,
    dataSortActiveCellCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
    fixedEndShadowActiveCellCls,
    columnSortableActiveCellCls,
    columnSortableHotCellCls,
    previewHiddenCellCls,
    previewRestoredCellCls,
    expandCellCls,
    selectionCellCls,
    bodyHoverCellCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { expandable: expandableConfig } = useExpandableContext();
  const { getComponent } = useComponentsContext();
  const { dataSortOrders = [] } = useDataSortContext();
  const { sortableActiveKeys, sortableHotKeys } = useColumnSortableContext();
  const { onCell } = useTableContext();

  const CellComponent = useMemo(
    () => getComponent(['body', 'cell'], 'div'),
    [getComponent],
  );
  const fixedShadowActive = useFixedShadowActive(fixedInfo);

  const cellProps = useMemo(
    () =>
      mergeCellProps(
        onCell?.(rowData, rowIndex, column, colIndex),
        column.onCell?.(rowData, rowIndex),
      ),
    [colIndex, column, onCell, rowData, rowIndex],
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

  const inSortableActiveScope = useMemo(
    () => motionKeys.some((key) => sortableActiveKeys.has(key)),
    [motionKeys, sortableActiveKeys],
  );

  const inSortableHotScope = useMemo(
    () => motionKeys.some((key) => sortableHotKeys.has(key)),
    [motionKeys, sortableHotKeys],
  );

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
  const hoverCellRef = useBodyHoverCellRef({
    rowIndex,
    colIndex,
    rowSpan: spanInfo.rowSpan,
    hoverable,
  });
  const hoveredCell = useBodyHoverCellHovered({
    rowIndex,
    colIndex,
    rowSpan: spanInfo.rowSpan,
    hoverable,
  });

  const restCellProps = useMemo(() => {
    const restProps = { ...cellProps };
    delete restProps.rowSpan;
    delete restProps.colSpan;
    delete restProps.style;
    delete restProps.align;
    delete restProps.className;
    return restProps;
  }, [cellProps]);

  const hasSortValue = useMemo(() => {
    const dataSortColumnKey = getDataSortColumnKey(column);
    return dataSortOrders.some((item) => item.columnKey === dataSortColumnKey);
  }, [column, dataSortOrders]);

  const isInternalExpandColumn = isExpandColumn(column);
  const isInternalSelectionColumn = isSelectionColumn(column);
  const isInternalRowSortColumn = isRowSortColumn(column);

  const cellValue = useMemo<ReactNode>(() => {
    if (
      spanInfo.hidden ||
      isInternalExpandColumn ||
      isInternalSelectionColumn ||
      isInternalRowSortColumn
    ) {
      return undefined;
    }

    let value: ReactNode = undefined;

    if (isValidKey(column.dataIndex) && typeof column.dataIndex === 'string') {
      value = rowData?.[column.dataIndex];
    }

    if (typeof column.render === 'function') {
      return column.render(value, rowData, rowIndex);
    }

    return value;
  }, [
    spanInfo.hidden,
    isInternalExpandColumn,
    isInternalSelectionColumn,
    isInternalRowSortColumn,
    column.dataIndex,
    column.render,
    rowData,
    rowIndex,
  ]);

  if (spanInfo.hidden) {
    return null;
  }

  let childrenNode = cellValue;
  if (isInternalExpandColumn) {
    childrenNode = (
      <ExpandControl
        rowData={rowData}
        rowIndex={rowIndex}
        indent={indent}
        expanded={expanded}
        expandable={rowSupportExpand}
      />
    );
  }
  if (isInternalSelectionColumn) {
    childrenNode = <BodySelectionCell rowData={rowData} rowIndex={rowIndex} />;
  }

  const isTreeCell =
    !isInternalExpandColumn &&
    !isInternalSelectionColumn &&
    !isInternalRowSortColumn &&
    isFirstDataColumn &&
    expandable &&
    !expandableConfig?.expandedRowRender;

  const hasEllipsis = !!column.ellipsis;
  const elTitle =
    hasEllipsis && getEllipsisShowTitle(column.ellipsis)
      ? getEllipsisTitle(childrenNode)
      : undefined;

  if (hasEllipsis || isTreeCell) {
    const indentStyle: CSSProperties = indent
      ? {
          paddingInlineStart: indent * (expandableConfig?.indentSize ?? 15),
        }
      : {};

    childrenNode = (
      <div
        title={elTitle}
        className={classNames({
          [ellipsisCellInnerCls]: hasEllipsis,
          [expandTreeCellInnerCls]: isTreeCell,
          [expandTreeCellInnerSpacedCls]: isTreeCell,
        })}
        style={indentStyle}
      >
        {isTreeCell ? (
          <TreeCellControl
            rowData={rowData}
            rowIndex={rowIndex}
            indent={indent}
            expanded={expanded}
            expandable={rowSupportExpand}
          >
            {childrenNode}
          </TreeCellControl>
        ) : (
          childrenNode
        )}
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
        sortableActive={inSortableActiveScope}
        sortableHot={inSortableHotScope}
        previewHidden={column.previewHidden}
        previewRestored={column.previewRestored}
        hovered={hoveredCell}
        hoverClassName={bodyHoverCellCls}
        rowSortAttributes={rowSortAttributes}
        rowSortListeners={rowSortListeners}
        setRowSortActivatorNodeRef={setRowSortActivatorNodeRef}
        setRowSortNodeRef={setRowSortNodeRef}
        hoverCellRef={hoverCellRef}
      />
    );
  }

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        {
          [ellipsisCellCls]: hasEllipsis,
          [dataSortActiveCellCls]: hasSortValue,
          [expandCellCls]: isInternalExpandColumn,
          [expandTreeCellCls]: isTreeCell,
          [selectionCellCls]: isInternalSelectionColumn,
          [fixedStartCellCls]: fixedInfo.fixStart !== null,
          [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
          [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
          [fixedEndCellCls]: fixedInfo.fixEnd !== null,
          [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
          [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
          [bodyHoverCellCls]: hoveredCell,
          [columnSortableActiveCellCls]: inSortableActiveScope,
          [columnSortableHotCellCls]: inSortableHotScope,
          [previewHiddenCellCls]: column.previewHidden,
          [previewRestoredCellCls]: column.previewRestored,
        },
        column.className,
        cellProps.className,
      )}
      style={mergedStyle}
      motionKeys={motionKeys}
      motionLayoutDependency={motionLayoutDependency}
      {...restCellProps}
      ref={hoverCellRef}
    >
      {childrenNode}
    </CellContainer>
  );
}

export default memo(BodyCell);
