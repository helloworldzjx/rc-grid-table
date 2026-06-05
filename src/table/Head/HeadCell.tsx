import { useDndMonitor } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import classNames from 'classnames';
import React, { CSSProperties, Key, useMemo, useRef } from 'react';

import CellContainer from '../CellContainer';
import { useColumnSortableContext } from '../columnSortableContext';
import { useComponentsContext } from '../componentsContext';
import { useTableContext } from '../context';
import { useFixedShadowActive } from '../fixedShadowContext';
import { CellType } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { useRowSelectionContext } from '../rowSelectionContext';
import { SelectionCheckbox } from '../Selection';
import { getComponentCls } from '../style/classNames';
import { getMergedSpanKeys } from '../utils/calc';
import { isSelectionColumn } from '../utils/const';
import { getCellFixedInfo } from '../utils/fixedColumns';
import {
  getNormalSpanStyle,
  getVirtualColumnPlacementStyle,
} from '../utils/gridPlacement';
import { filterSpan, getEllipsisTitle } from '../utils/handle';
import Resizable from './Resizable';

interface HeadCellProps<T = any> {
  column: CellType<T>;
  columnIndex: number;
  rowIndex: number;
  virtualColumn?: boolean;
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
  virtualColumn = false,
}: HeadCellProps) {
  const {
    flattenColumns = [],
    resizableColumns,
    fixedOffset,
  } = useTableContext();
  const { sortableColumns } = useColumnSortableContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();
  const { rowSelection, selection } = useRowSelectionContext();

  const {
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    selectionCellCls,
    headLastCellCls,
    headResizableCellDisabledCls,
    headSortableCellCls,
    headSortableCellDisabledCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedStartShadowActiveCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    cellFixedEndShadowActiveCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const resizableRef = useRef<HTMLDivElement | null>(null);
  const CellComponent = getComponent(['header', 'cell'], 'div');

  const fixedInfo = useMemo(() => {
    return getCellFixedInfo(
      col.colStart as number,
      col.colEnd as number,
      flattenColumns,
      fixedOffset,
    );
  }, [col.colStart, col.colEnd, flattenColumns, fixedOffset]);

  const fixedShadowActive = useFixedShadowActive(fixedInfo);

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
    [col.column?.onHeaderCell, colIndex],
  );

  const mergedStyle = useMemo(() => {
    const rowSpan = cellProps?.rowSpan ?? col.rowSpan;
    const colSpan = cellProps?.colSpan ?? col.colSpan;
    const style: CSSProperties = virtualColumn
      ? getVirtualColumnPlacementStyle({
          rowIndex,
          colStart: col.colStart,
          rowSpan,
          colSpan,
        })
      : getNormalSpanStyle({ rowSpan, colSpan });

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
    col.colStart,
    cellProps,
    fixedInfo.fixStart,
    fixedInfo.fixEnd,
    col.column?.align,
    col.column?.style,
    rowIndex,
    virtualColumn,
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
        fixed: col.column?.fixed,
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

  let childrenNode = col.children;
  if (isInternalSelectionColumn) {
    if (
      (rowSelection?.type ?? 'checkbox') === 'radio' ||
      rowSelection?.hideSelectAll
    ) {
      childrenNode = null;
    } else {
      const checkboxProps = rowSelection?.getTitleCheckboxProps?.() || {};
      const disabled = !!checkboxProps.disabled;
      const originNode = (
        <SelectionCheckbox
          {...checkboxProps}
          style={{
            ...checkboxProps.style,
            justifyContent: rowSelection?.align ?? 'center',
          }}
          checked={!!selection?.isAllSelected}
          indeterminate={!!selection?.isPartiallySelected}
          disabled={disabled}
          onChange={(event) => selection?.onSelectAll(event)}
        />
      );
      childrenNode =
        typeof rowSelection?.columnTitle === 'function'
          ? rowSelection.columnTitle(originNode)
          : rowSelection?.columnTitle ?? originNode;
    }
  }
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
      <div title={elTitle} className={cellEllipsisInnerCls}>
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
          [cellEllipsisCls]: ellipsis,
          [headLastCellCls]: hasHeadLastCellCls,
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedStartShadowActiveCls]: fixedShadowActive.start,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [cellFixedEndShadowActiveCls]: fixedShadowActive.end,
          [selectionCellCls]: isInternalSelectionColumn,
          [headResizableCellDisabledCls]:
            !!resizableColumns && !!col.column?.resizeDisabled,
          [headSortableCellCls]: dragEnabled,
          [headSortableCellDisabledCls]: sortDisabled,
        },
        col.column?.className,
        cellProps.className,
      )}
      style={mergedStyle}
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

export default HeadCell;
