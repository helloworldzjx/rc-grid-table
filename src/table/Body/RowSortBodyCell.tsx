import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import classNames from 'classnames';
import React, { CSSProperties, Key, memo, useMemo } from 'react';

import { isValidKey } from '../../_utils/validate';
import CellContainer from '../CellContainer';
import { useComponentsContext } from '../componentsContext';
import { useFixedShadowActive } from '../fixedShadowContext';
import { ColumnState } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { useRowSortableContext } from '../rowSortableContext';
import { getComponentCls } from '../style/classNames';
import { FixedInfo } from '../utils/fixedColumns';

type BodyCellBaseProps<T = any> = {
  cellClassName?: string;
  restCellProps: React.HTMLAttributes<any>;
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
  restCellProps,
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
  const prefixCls = usePrefixClsContext();

  const {
    cellCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedStartShadowActiveCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    cellFixedEndShadowActiveCls,
    rowSortCellCls,
    rowSortCellOverCls,
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
      component={CellComponent}
      className={classNames(
        cellCls,
        {
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedStartShadowActiveCls]: fixedShadowActive.start,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [cellFixedEndShadowActiveCls]: fixedShadowActive.end,
          [rowSortCellCls]: true,
          [rowSortCellOverCls]: rowSortIsOver,
        },
        column.className,
        cellClassName,
      )}
      style={mergedStyle}
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
