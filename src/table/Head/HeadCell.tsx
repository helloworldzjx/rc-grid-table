import { useSortable } from '@dnd-kit/sortable';
import classNames from 'classnames';
import React, { CSSProperties, Key, useMemo } from 'react';

import CellContainer from '../CellContainer';
import { useTableContext } from '../context';
import { CellType } from '../interface';
import { SelectionCheckbox } from '../Selection';
import { useStyles } from '../style';
import { getMergedSpanKeys } from '../utils/calc';
import { isSelectionColumn } from '../utils/const';
import { getCellFixedInfo } from '../utils/fixedColumns';
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
  const {
    flattenColumns = [],
    resizableColumns,
    sortableColumns,
    fixedOffset,
    rowSelection,
    selection,
  } = useTableContext();

  const {
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    selectionCellCls,
    headLastCellCls,
    headSortableCellCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
  } = useStyles();

  const fixedInfo = useMemo(() => {
    return getCellFixedInfo(
      col.colStart as number,
      col.colEnd as number,
      flattenColumns,
      fixedOffset,
    );
  }, [col.colStart, col.colEnd, flattenColumns, fixedOffset]);

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

  const mergedStyle = useMemo(() => {
    const style: CSSProperties = {};
    if (col.rowSpan && col.rowSpan > 1) {
      style.gridRow = `span ${col.rowSpan}`;
    }
    if (col.colSpan && col.colSpan > 1) {
      style.gridColumn = `span ${col.colSpan}`;
      style.textAlign = 'center';
    }
    if (!filterSpan(col.colSpan)) {
      style.display = 'none';
    }
    if (fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number;
    }
    if (fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number;
    }
    if (col.column?.align) {
      style.textAlign = col.column.align;
    }

    return { ...style, ...col.column?.style };
  }, [
    col.rowSpan,
    col.colSpan,
    fixedInfo.fixStart,
    fixedInfo.fixEnd,
    col.column?.align,
    col.column?.style,
  ]);

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
        dragSortDisabled,
      },
      sortKeys: sortEnabled ? mergedSpanKeys : [],
    },
  });

  /** 列拖拽排序 end */

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
      className={classNames(
        cellCls,
        {
          [cellEllipsisCls]: ellipsis,
          [headLastCellCls]: hasHeadLastCellCls,
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [selectionCellCls]: isInternalSelectionColumn,
          [headSortableCellCls]: dragEnabled,
        },
        col.column?.className,
      )}
      style={mergedStyle}
      {...listeners}
      ref={setNodeRef}
    >
      {childrenNode}
      {!!resizeKeys.length && (
        <Resizable id={`${col.key}-resizable`} keys={resizeKeys} />
      )}
    </CellContainer>
  );
}

export default HeadCell;
