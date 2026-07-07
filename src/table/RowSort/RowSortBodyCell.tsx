import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { composeRef } from '@rc-component/util/lib/ref';
import classNames from 'classnames';
import React, { CSSProperties, Key, Ref, memo, useMemo } from 'react';

import { isValidKey } from '../../_utils/validate';
import CellContainer from '../CellContainer';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { useFixedShadowActive } from '../contexts/FixedShadowContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useRowSortableContext } from '../contexts/RowSortableContext';
import type { InternalColumnState } from '../internalInterface';
import { getComponentCls } from '../style/classNames';
import { FixedInfo } from '../utils/fixedColumns';

type BodyCellBaseProps<T = any> = {
  cellClassName?: string;
  restCellProps: React.HTMLAttributes<any>;
  hoverCellRef?: Ref<HTMLDivElement>;
  hovered?: boolean;
  hoverClassName?: string;
  column: InternalColumnState<T>;
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
  previewHidden?: boolean;
  previewRestored?: boolean;
  placeholder?: boolean;
  last?: boolean;
  rowSortAttributes?: DraggableAttributes;
  rowSortListeners?: DraggableSyntheticListeners;
  setRowSortActivatorNodeRef?: (element: HTMLElement | null) => void;
  setRowSortNodeRef?: (element: HTMLElement | null) => void;
};

function RowSortBodyCell<T = any>({
  cellClassName,
  restCellProps,
  hoverCellRef,
  hovered = false,
  hoverClassName,
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
  previewHidden = false,
  previewRestored = false,
  placeholder = false,
  last = false,
  rowSortAttributes,
  rowSortListeners,
  setRowSortActivatorNodeRef,
  setRowSortNodeRef,
}: RowSortBodyCellProps<T>) {
  const prefixCls = usePrefixClsContext();

  const {
    cellCls,
    bodyVirtualRowSpanPlaceholderCellCls,
    bodyLastCellCls,
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
    rowSortCellCls,
    rowSortOverCellCls,
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
        <svg
          viewBox="0 0 1024 1024"
          focusable="false"
          aria-hidden="true"
          fill="currentColor"
          width="1em"
          height="1em"
        >
          <circle cx="110" cy="308" r="80" />
          <circle cx="512" cy="308" r="80" />
          <circle cx="914" cy="308" r="80" />
          <circle cx="110" cy="716" r="80" />
          <circle cx="512" cy="716" r="80" />
          <circle cx="914" cy="716" r="80" />
        </svg>
      ),
    [iconProps, rowSortable],
  );
  const mergedCellRef = useMemo(
    () =>
      composeRef<HTMLDivElement>(
        setRowSortNodeRef ?? null,
        hoverCellRef ?? null,
      ),
    [hoverCellRef, setRowSortNodeRef],
  );

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        {
          [rowSortCellCls]: true,
          [rowSortOverCellCls]: rowSortIsOver,
          [bodyVirtualRowSpanPlaceholderCellCls]: placeholder,
          [bodyLastCellCls]: last,
          [fixedStartCellCls]: fixedInfo.fixStart !== null,
          [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
          [fixedEndCellCls]: fixedInfo.fixEnd !== null,
          [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
          [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
          [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
          [columnSortableActiveCellCls]: sortableActive,
          [columnSortableHotCellCls]: sortableHot,
          [previewHiddenCellCls]: previewHidden,
          [previewRestoredCellCls]: previewRestored,
        },
        hoverClassName && hovered ? hoverClassName : undefined,
        column.className,
        cellClassName,
      )}
      style={mergedStyle}
      motionKeys={motionKeys}
      motionLayoutDependency={motionLayoutDependency}
      {...restCellProps}
      ref={mergedCellRef}
    >
      {!placeholder && (
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
        >
          {iconNode}
        </button>
      )}
    </CellContainer>
  );
}

export default memo(RowSortBodyCell);
