import { useDndMonitor } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import classNames from 'classnames';
import React, { CSSProperties, Key, memo, useMemo, useRef } from 'react';

import CellContainer from '../CellContainer';
import { useColumnSortableContext } from '../columnSortableContext';
import { useComponentsContext } from '../componentsContext';
import { useFixedShadowActive } from '../fixedShadowContext';
import useRenderedColumnLayout from '../hooks/useRenderedColumnLayout';
import { CellType } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { useRowSelectionContext } from '../rowSelectionContext';
import { SelectionCheckbox } from '../Selection';
import { getComponentCls } from '../style/classNames';
import { useTableColumnStateContext } from '../tableColumnStateContext';
import { getMergedSpanKeys } from '../utils/calc';
import { isSelectionColumn } from '../utils/const';
import { getCellFixedInfo } from '../utils/fixedColumns';
import { getNormalSpanStyle } from '../utils/gridPlacement';
import { filterSpan, getEllipsisTitle } from '../utils/handle';
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
  const { resizableColumns } = useTableColumnStateContext();
  const { sortableActiveKeys, sortableColumns, sortableHotKeys } =
    useColumnSortableContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();
  const { rowSelection, selection } = useRowSelectionContext();

  const {
    cellCls,
    ellipsisCellCls,
    ellipsisCellInnerCls,
    selectionCellCls,
    headLastCellCls,
    headResizableCellDisabledCls,
    headSortableCellCls,
    headSortableCellDisabledCls,
    columnSortableActiveCellCls,
    columnSortableHotCellCls,
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

  const cellProps = useMemo(
    () => col.column?.onHeaderCell?.(col.column, colIndex) || {},
    [col.column, colIndex],
  );

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
  const sortEnabled = !!sortableColumns;
  const dragEnabled = sortEnabled && !dragSortDisabled;
  const sortDisabled = sortEnabled && dragSortDisabled;

  const { listeners, setNodeRef } = useSortable({
    id: `${col.key}`,
    disabled: {
      draggable: !dragEnabled,
      droppable: !sortEnabled,
    },
    data: {
      type: 'sortableColumns',
      column: {
        key: col.key,
        parentKey: col.column?.parentKey,
        colSpan: col.column?.colSpan,
        order: col.column?.order,
        hasChildren: col.column?.hasChildren,
        fixed: fixedType,
        dragSortDisabled,
      },
      sortKeys: sortEnabled ? mergedSpanKeys : [],
    },
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
    if (!isInternalSelectionColumn) {
      return col.children;
    }

    if (
      (rowSelection?.type ?? 'checkbox') === 'radio' ||
      rowSelection?.hideSelectAll
    ) {
      return null;
    }

    const disabled = !!titleCheckboxProps.disabled;
    const originNode = (
      <SelectionCheckbox
        {...titleCheckboxProps}
        style={titleCheckboxStyle}
        checked={!!selection?.isAllSelected}
        indeterminate={!!selection?.isPartiallySelected}
        disabled={disabled}
        onChange={(event) => selection?.onSelectAll(event)}
      />
    );

    return typeof rowSelection?.columnTitle === 'function'
      ? rowSelection.columnTitle(originNode)
      : rowSelection?.columnTitle ?? originNode;
  }, [
    col.children,
    isInternalSelectionColumn,
    rowSelection,
    selection,
    titleCheckboxProps,
    titleCheckboxStyle,
  ]);

  let childrenNode = selectionTitleNode;
  const ellipsis = !!col.column?.ellipsis;
  if (ellipsis) {
    const showTitle =
      typeof col.column?.ellipsis === 'boolean'
        ? col.column?.ellipsis
        : col.column?.ellipsis?.showTitle;
    const elTitle = showTitle
      ? (getEllipsisTitle(childrenNode) as string)
      : undefined;
    childrenNode = (
      <div title={elTitle} className={ellipsisCellInnerCls}>
        {childrenNode}
      </div>
    );
  }

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        {
          [ellipsisCellCls]: ellipsis,
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
          [headSortableCellDisabledCls]: sortDisabled,
          [columnSortableActiveCellCls]: inSortableActiveScope,
          [columnSortableHotCellCls]: inSortableHotScope,
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
