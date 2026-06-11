import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import classNames from 'classnames';
import React, { CSSProperties, Key, memo, useMemo } from 'react';

import { isValidKey } from '../../_utils/validate';
import CellContainer from '../CellContainer';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { useFixedShadowActive } from '../contexts/FixedShadowContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useRowSortableContext } from '../contexts/RowSortableContext';
import { ColumnState } from '../interface';
import { getComponentCls } from '../style/classNames';
import { FixedInfo } from '../utils/fixedColumns';

type BodyCellBaseProps<T = any> = {
  cellClassName?: string;
  restCellProps: React.HTMLAttributes<any>;
  column: ColumnState<T>;
  fixedInfo: FixedInfo;
  motionKeys?: Key[];
  motionLayoutDependency?: string | number | false;
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
  sortableActive?: boolean;
  sortableHot?: boolean;
  rowSortAttributes?: DraggableAttributes;
  rowSortListeners?: DraggableSyntheticListeners;
  setRowSortActivatorNodeRef?: (element: HTMLElement | null) => void;
  setRowSortNodeRef?: (element: HTMLElement | null) => void;
};

function RowSortBodyCell<T = any>({
  cellClassName,
  restCellProps,
  column,
  fixedInfo,
  motionKeys,
  motionLayoutDependency,
  indent,
  mergedStyle,
  rowData,
  rowIndex,
  rowSortDragDisabled,
  rowSortDragging,
  rowSortKey,
  rowSortIsOver = false,
  sortableActive = false,
  sortableHot = false,
  rowSortAttributes,
  rowSortListeners,
  setRowSortActivatorNodeRef,
  setRowSortNodeRef,
}: RowSortBodyCellProps<T>) {
  const prefixCls = usePrefixClsContext();

  const {
    cellCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
    fixedEndShadowActiveCellCls,
    columnSortableActiveCellCls,
    columnSortableHotCellCls,
    rowSortCellCls,
    rowSortOverCellCls,
    rowSortControlCls,
    rowSortHandleCls,
    rowSortHandleDisabledCls,
    rowSortHandleDraggingCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { getComponent } = useComponentsContext();
  const { rowSortable } = useRowSortableContext();
  const fixedShadowActive = useFixedShadowActive(fixedInfo);

  const CellComponent = useMemo(
    () => getComponent(['body', 'cell'], 'div'),
    [getComponent],
  );

  const rowSortDisabled =
    rowSortDragDisabled || !rowSortable || !isValidKey(rowSortKey);
  const disabled = rowSortDisabled;
  const dragging = rowSortDragging;
  const activatorProps = useMemo(
    () =>
      disabled
        ? {}
        : {
            ...rowSortAttributes,
            ...rowSortListeners,
          },
    [disabled, rowSortAttributes, rowSortListeners],
  );
  const iconProps = useMemo(
    () => ({
      disabled,
      dragging,
      record: rowData,
      index: rowIndex,
      indent,
    }),
    [disabled, dragging, indent, rowData, rowIndex],
  );

  const iconNode = useMemo(
    () =>
      rowSortable?.sortIcon ? (
        rowSortable.sortIcon(iconProps)
      ) : (
        <>
          <span />
          <span />
          <span />
        </>
      ),
    [iconProps, rowSortable],
  );

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        {
          [fixedStartCellCls]: fixedInfo.fixStart !== null,
          [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
          [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
          [fixedEndCellCls]: fixedInfo.fixEnd !== null,
          [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
          [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
          [columnSortableActiveCellCls]: sortableActive,
          [columnSortableHotCellCls]: sortableHot,
          [rowSortCellCls]: true,
          [rowSortOverCellCls]: rowSortIsOver,
        },
        column.className,
        cellClassName,
      )}
      style={mergedStyle}
      motionKeys={motionKeys}
      motionLayoutDependency={motionLayoutDependency}
      {...restCellProps}
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
