import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import classNames from 'classnames';
import React, { CSSProperties, Key, memo } from 'react';

import CellContainer from '../CellContainer';
import { useTableContext } from '../context';
import { ColumnState } from '../interface';
import { useStyles } from '../style';
import { FixedInfo } from '../utils/fixedColumns';

type BodyCellBaseProps<T = any> = {
  cellClassName?: string;
  cellProps: React.HTMLAttributes<any>;
  column: ColumnState<T>;
  fixedInfo: FixedInfo;
  mergedStyle: CSSProperties;
};

type RowSortBodyCellProps<T = any> = BodyCellBaseProps<T> & {
  indent: number;
  rowData: T;
  rowIndex: number;
  rowSortDragDisabled: boolean;
  rowSortDragging: boolean;
  rowSortKey?: Key;
  rowSortIsOver?: boolean;
  rowSortAttributes?: DraggableAttributes;
  rowSortListeners?: DraggableSyntheticListeners;
  setRowSortActivatorNodeRef?: (element: HTMLElement | null) => void;
  setRowSortNodeRef?: (element: HTMLElement | null) => void;
};

function RowSortBodyCell<T = any>({
  cellClassName,
  cellProps,
  column,
  fixedInfo,
  indent,
  mergedStyle,
  rowData,
  rowIndex,
  rowSortDragDisabled,
  rowSortDragging,
  rowSortKey,
  rowSortIsOver = false,
  rowSortAttributes,
  rowSortListeners,
  setRowSortActivatorNodeRef,
  setRowSortNodeRef,
}: RowSortBodyCellProps<T>) {
  const { rowSortable } = useTableContext();
  const {
    cellCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    rowSortCellCls,
    rowSortCellOverCls,
    rowSortControlCls,
    rowSortHandleCls,
    rowSortHandleDisabledCls,
    rowSortHandleDraggingCls,
  } = useStyles();

  const rowSortDisabled =
    rowSortDragDisabled || !rowSortable || rowSortKey === undefined;
  const disabled = rowSortDisabled;
  const dragging = rowSortDragging;
  const activatorProps = disabled
    ? {}
    : {
        ...rowSortAttributes,
        ...rowSortListeners,
      };
  const iconProps = {
    disabled,
    dragging,
    record: rowData,
    index: rowIndex,
    indent,
  };

  const iconNode = rowSortable?.sortIcon ? (
    rowSortable.sortIcon(iconProps)
  ) : (
    <>
      <span />
      <span />
      <span />
    </>
  );

  return (
    <CellContainer
      className={classNames(
        cellCls,
        {
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [rowSortCellCls]: true,
          [rowSortCellOverCls]: rowSortIsOver,
        },
        column.className,
        cellClassName,
      )}
      style={mergedStyle}
      {...cellProps}
      ref={setRowSortNodeRef}
    >
      <div
        className={rowSortControlCls}
        style={{ justifyContent: rowSortable?.align ?? 'center' }}
      >
        <button
          {...activatorProps}
          type="button"
          className={classNames(rowSortHandleCls, {
            [rowSortHandleDisabledCls]: disabled,
            [rowSortHandleDraggingCls]: dragging,
          })}
          aria-label="Drag row"
          disabled={disabled}
          ref={setRowSortActivatorNodeRef}
          onClick={(event) => event.stopPropagation()}
        >
          {iconNode}
        </button>
      </div>
    </CellContainer>
  );
}

export default memo(RowSortBodyCell);
