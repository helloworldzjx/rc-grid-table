import { useDndMonitor } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import classNames from 'classnames';
import React, { CSSProperties, Key, memo, useMemo, useRef } from 'react';

import CellContainer from '../CellContainer';
import { useColumnSortableContext } from '../contexts/ColumnSortableContext';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { useDataSortContext } from '../contexts/DataSortContext';
import { useFixedShadowActive } from '../contexts/FixedShadowContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useRowSelectionContext } from '../contexts/RowSelectionContext';
import { useTableColumnStateContext } from '../contexts/TableColumnStateContext';
import { useTableContext } from '../contexts/TableContext';
import useRenderedColumnLayout from '../hooks/useRenderedColumnLayout';
import type { CellType } from '../internalInterface';
import { SelectionCheckbox } from '../Selection';
import { getComponentCls } from '../style/classNames';
import { getMergedSpanKeys } from '../utils/calc';
import { mergeCellProps } from '../utils/cellProps';
import { isSelectionColumn } from '../utils/const';
import type { SortableColumnsData } from '../utils/dnd';
import { getEllipsisShowTitle, getEllipsisTitle } from '../utils/ellipsis';
import { getCellFixedInfo } from '../utils/fixedColumns';
import { getNormalSpanStyle } from '../utils/gridPlacement';
import { filterSpan } from '../utils/handle';
import { getDataSortTitleRender } from '../utils/sort';
import Resizable from './Resizable';

interface HeadCellProps<T = any> {
  column: CellType<T>;
  columnIndex: number;
  rowIndex: number;
  /** 最后一列的parentKey */
  prevRowLastCellKey?: Key;
  /** 当前行的最大index */
  currentRowLastIndex: number;
  /** 第一行最后一列的key */
  firstRowLastCellKey?: Key;
}

function HeadCell({
  rowIndex,
  column: col,
  columnIndex: colIndex,
  prevRowLastCellKey,
  currentRowLastIndex,
  firstRowLastCellKey,
}: HeadCellProps) {
  const { flattenColumns = [], fixedOffset } = useRenderedColumnLayout();
  const { resizableColumns, columnsStatePreviewMode } =
    useTableColumnStateContext();
  const { sortableActiveKeys, sortableColumns, sortableHotKeys } =
    useColumnSortableContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();
  const { dataSort, dataSortOrders = [] } = useDataSortContext();
  const { rowSelection, selection } = useRowSelectionContext();
  const { onHeaderCell } = useTableContext();

  const {
    cellCls,
    ellipsisCellCls,
    ellipsisCellInnerCls,
    dataSortCellCls,
    dataSortActiveCellCls,
    dataSortCellInnerCls,
    dataSortContentCls,
    dataSortControlCls,
    selectionCellCls,
    headLastCellCls,
    headResizableCellDisabledCls,
    headSortableCellCls,
    headSortableCellDisabledCls,
    columnSortableActiveCellCls,
    columnSortableHotCellCls,
    previewHiddenCellCls,
    previewRestoredCellCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
    fixedEndShadowActiveCellCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const resizableRef = useRef<HTMLDivElement | null>(null);
  const CellComponent = useMemo(
    () => getComponent(['header', 'cell'], 'div'),
    [getComponent],
  );

  const fixedInfo = useMemo(() => {
    return getCellFixedInfo(
      col.colStart as number,
      col.colEnd as number,
      flattenColumns,
      fixedOffset,
    );
  }, [col.colStart, col.colEnd, flattenColumns, fixedOffset]);

  const fixedShadowActive = useFixedShadowActive(fixedInfo);
  const fixedType =
    fixedInfo.fixStart !== null
      ? 'start'
      : fixedInfo.fixEnd !== null
      ? 'end'
      : undefined;

  // 最后一列不显示右侧border
  const hasHeadLastCellCls = useMemo(() => {
    if (rowIndex === 0) {
      return colIndex === currentRowLastIndex;
    }

    return (
      col.column?.parentKey === prevRowLastCellKey &&
      colIndex === currentRowLastIndex &&
      col.column?.ancestorKeys?.[0] === firstRowLastCellKey
    );
  }, [
    rowIndex,
    colIndex,
    currentRowLastIndex,
    col.column?.parentKey,
    prevRowLastCellKey,
    col.column?.ancestorKeys?.[0],
    firstRowLastCellKey,
  ]);

  const cellProps = useMemo(() => {
    if (!col.column) return {};

    return mergeCellProps(
      onHeaderCell?.(col.column, colIndex),
      col.column.onHeaderCell?.(col.column, colIndex),
    );
  }, [col.column, colIndex, onHeaderCell]);

  const mergedStyle = useMemo(() => {
    const rowSpan = cellProps?.rowSpan ?? col.rowSpan;
    const colSpan = cellProps?.colSpan ?? col.colSpan;
    const style: CSSProperties = getNormalSpanStyle({ rowSpan, colSpan });

    if (colSpan && colSpan > 1) {
      style.textAlign = 'center';
    }
    if (!filterSpan(colSpan)) {
      style.display = 'none';
    }
    if (fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number;
    }
    if (fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number;
    }
    const align = cellProps?.align ?? col.column?.align;
    if (align) {
      style.textAlign = align;
    }

    return { ...style, ...col.column?.style, ...cellProps.style };
  }, [
    col.rowSpan,
    col.colSpan,
    cellProps,
    fixedInfo.fixStart,
    fixedInfo.fixEnd,
    col.column?.align,
    col.column?.style,
  ]);

  const restCellProps = useMemo(() => {
    const restProps = { ...cellProps };
    delete restProps.rowSpan;
    delete restProps.colSpan;
    delete restProps.style;
    delete restProps.align;
    delete restProps.className;
    return restProps;
  }, [cellProps]);

  const mergedSpanKeys = useMemo(() => {
    return getMergedSpanKeys(
      {
        key: col.key as Key,
        hasChildren: col.column?.hasChildren,
        colSpan: col.column?.colSpan,
      },
      flattenColumns,
    );
  }, [col, flattenColumns]);

  const keys = useMemo(() => {
    if (!resizableColumns && !sortableColumns) return [];

    if (col.hasSubColumns) {
      return flattenColumns
        .filter((column) => column.ancestorKeys.includes(col.key as Key))
        .map((column) => column.key);
    }

    return mergedSpanKeys;
  }, [
    resizableColumns,
    sortableColumns,
    col.hasSubColumns,
    flattenColumns,
    col.key,
    mergedSpanKeys,
  ]);

  const motionKeys = useMemo(() => {
    // 分组 header 覆盖多个叶子列，motionKeys 用覆盖范围命中 active-over 区间。
    if (col.hasSubColumns) {
      return flattenColumns
        .filter((column) => column.ancestorKeys.includes(col.key as Key))
        .map((column) => column.key);
    }

    return mergedSpanKeys;
  }, [col.hasSubColumns, col.key, flattenColumns, mergedSpanKeys]);

  const inSortableActiveScope = useMemo(
    () => mergedSpanKeys.some((key) => sortableActiveKeys.has(key)),
    [mergedSpanKeys, sortableActiveKeys],
  );

  const inSortableHotScope = useMemo(
    () => mergedSpanKeys.some((key) => sortableHotKeys.has(key)),
    [mergedSpanKeys, sortableHotKeys],
  );

  const motionLayoutDependency = useMemo(
    () =>
      [
        // Header 的位置由覆盖列、span 和 fixed offset 决定，签名稳定才能减少 motion 测量面。
        motionKeys.join(','),
        col.colStart,
        col.colEnd,
        cellProps?.rowSpan ?? col.rowSpan,
        cellProps?.colSpan ?? col.colSpan,
        fixedInfo.fixStart ?? '',
        fixedInfo.fixEnd ?? '',
      ].join('|'),
    [
      motionKeys,
      col.colStart,
      col.colEnd,
      cellProps?.rowSpan,
      col.rowSpan,
      cellProps?.colSpan,
      col.colSpan,
      fixedInfo.fixStart,
      fixedInfo.fixEnd,
    ],
  );

  const resizeKeys = useMemo(() => {
    if (!resizableColumns || col.column?.resizeDisabled) return [];

    return keys.filter((key) => {
      const column = flattenColumns.find((item) => item.key === key);
      return column && !column.resizeDisabled;
    });
  }, [resizableColumns, col.column?.resizeDisabled, keys, flattenColumns]);

  /** 列拖拽排序 start ***************************************************************************/

  const dragSortDisabled = !!col.column?.dragSortDisabled;
  const sortEnabled =
    !!sortableColumns && columnsStatePreviewMode !== 'visibleHotOnly';
  const dragEnabled = sortEnabled && !dragSortDisabled;
  const dragDisabled = sortEnabled && dragSortDisabled;

  const { listeners, setNodeRef } = useSortable({
    id: `${col.key}`,
    disabled: {
      draggable: !dragEnabled,
      droppable: !sortEnabled,
    },
    data: {
      type: 'sortableColumns',
      column: {
        key: col.key as Key,
        parentKey: col.column?.parentKey as Key,
        colSpan: col.column?.colSpan,
        order: col.column?.order as number,
        hasChildren: !!col.column?.hasChildren,
        fixed: fixedType,
        dragSortDisabled,
      },
      sortKeys: sortEnabled ? mergedSpanKeys : [],
    } satisfies SortableColumnsData,
  });

  /** 列拖拽排序 end */

  /** bug ref https://github.com/helloworldzjx/rc-grid-table/issues/2 */
  useDndMonitor({
    onDragStart() {
      if (!resizableRef.current) return;

      resizableRef.current.style.height = '1px';
      resizableRef.current.style.insetBlockEnd = 'unset';
    },
    onDragEnd() {
      if (!resizableRef.current) return;

      resizableRef.current.style.height = '';
      resizableRef.current.style.insetBlockEnd = '';
    },
  });

  const isInternalSelectionColumn = isSelectionColumn(col.column);
  const titleCheckboxProps = useMemo(
    () => rowSelection?.getTitleCheckboxProps?.() || {},
    [rowSelection],
  );
  const titleCheckboxStyle = useMemo<CSSProperties>(
    () => ({
      ...titleCheckboxProps.style,
      justifyContent: rowSelection?.align ?? 'center',
    }),
    [rowSelection?.align, titleCheckboxProps.style],
  );

  const selectionTitleNode = useMemo(() => {
    const type = rowSelection?.type ?? 'checkbox';
    const showSelectAll = type === 'checkbox' && !rowSelection?.hideSelectAll;
    const disabled = !!titleCheckboxProps.disabled;
    const originNode = showSelectAll ? (
      <SelectionCheckbox
        {...titleCheckboxProps}
        style={titleCheckboxStyle}
        checked={!!selection?.isAllSelected}
        indeterminate={!!selection?.isPartiallySelected}
        disabled={disabled}
        onChange={(event) => selection?.onSelectAll(event)}
      />
    ) : null;

    return typeof rowSelection?.columnTitle === 'function'
      ? rowSelection.columnTitle(originNode)
      : rowSelection?.columnTitle ?? originNode;
  }, [
    isInternalSelectionColumn,
    rowSelection,
    selection,
    titleCheckboxProps,
    titleCheckboxStyle,
  ]);

  const { hasSortRender, hasSortValue, sortRenderNode } =
    getDataSortTitleRender({
      column: col.column,
      columnIndex: colIndex,
      dataSort,
      dataSortOrders,
      hasSubColumns: col.hasSubColumns,
    });

  let childrenNode = col.children;
  if (isInternalSelectionColumn) {
    childrenNode = selectionTitleNode;
  }

  const hasEllipsis = !!col.column?.ellipsis;
  const elTitle =
    hasEllipsis && getEllipsisShowTitle(col.column?.ellipsis)
      ? getEllipsisTitle(childrenNode)
      : undefined;

  if (hasEllipsis || hasSortRender) {
    childrenNode = (
      <div
        title={elTitle}
        className={classNames({
          [ellipsisCellInnerCls]: hasEllipsis,
          [dataSortCellInnerCls]: hasSortRender,
        })}
      >
        {hasSortRender ? (
          <>
            <div className={dataSortContentCls}>{childrenNode}</div>
            <div className={dataSortControlCls}>{sortRenderNode}</div>
          </>
        ) : (
          childrenNode
        )}
      </div>
    );
  }

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        {
          [ellipsisCellCls]: hasEllipsis,
          [dataSortCellCls]: hasSortRender,
          [dataSortActiveCellCls]: hasSortValue,
          [headLastCellCls]: hasHeadLastCellCls,
          [fixedStartCellCls]: fixedInfo.fixStart !== null,
          [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
          [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
          [fixedEndCellCls]: fixedInfo.fixEnd !== null,
          [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
          [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
          [selectionCellCls]: isInternalSelectionColumn,
          [headResizableCellDisabledCls]:
            !!resizableColumns && !!col.column?.resizeDisabled,
          [headSortableCellCls]: dragEnabled,
          [headSortableCellDisabledCls]: dragDisabled,
          [columnSortableActiveCellCls]: inSortableActiveScope,
          [columnSortableHotCellCls]: inSortableHotScope,
          [previewHiddenCellCls]: col.column?.previewHidden,
          [previewRestoredCellCls]: col.column?.previewRestored,
        },
        col.column?.className,
        cellProps.className,
      )}
      style={mergedStyle}
      motionKeys={motionKeys}
      motionLayoutDependency={motionLayoutDependency}
      {...restCellProps}
      {...listeners}
      ref={setNodeRef}
    >
      {childrenNode}
      {!!resizeKeys.length && (
        <Resizable
          ref={resizableRef}
          id={`${col.key}-resizable`}
          keys={resizeKeys}
        />
      )}
    </CellContainer>
  );
}

export default memo(HeadCell);
