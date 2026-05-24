import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import React, { Key, useMemo, useRef, useState } from 'react';

import { useTableContext } from '../context';
import { CellType, ColumnState } from '../interface';
import { useStyles } from '../style';
import { findNodeByKey } from '../utils/handle';
import { reorderColumnsState, SortablePlacement } from '../utils/sortable';
import HeadCell from './HeadCell';

interface HeadRowProps<T = any> {
  headRows: CellType<T>[][];
  row: CellType<T>[];
  headRowIndex: number;
  onSortableStart?: () => void;
  onSortableEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

function HeadRow({
  headRows,
  row: columns,
  headRowIndex,
  onSortableStart,
  onSortableEnd,
  onResizeStart,
  onResizeEnd,
}: HeadRowProps) {
  const {
    sortableColumns,
    middleState,
    innerColumnsState,
    sortableDraftState,
    updateMiddleState,
    updateSortableDraftState,
    columnsConfig,
  } = useTableContext();

  const { headRowCls, headDraggingOverlayCellCls } = useStyles();

  const firstRow = headRows[0] || [];
  const previousRow = headRows[headRowIndex - 1] || [];
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const [dragOverlaySize] = useState({ width: 100, height: 40 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const draftStateRef = useRef<ColumnState[] | null>(null);
  const draftChangedRef = useRef(false);

  const activeColumn = useMemo(() => {
    return columns.find((column) => column.key === activeKey);
  }, [activeKey]);

  const getSortableBaseState = () => {
    return (
      sortableDraftState ||
      (innerColumnsState.length ? innerColumnsState : middleState)
    );
  };

  const getColumnStartIndex = (
    state: ColumnState[],
    parentKey: Key,
    keys: Key[],
  ) => {
    const parent =
      parentKey === '' ? { children: state } : findNodeByKey(state, parentKey);
    const keySet = new Set(keys);
    const sortedChildren = [...(parent?.children || [])].sort(
      (a, b) => a.order - b.order,
    );
    const index = sortedChildren.findIndex((column) => keySet.has(column.key));

    return index === -1 ? null : index;
  };

  const getPlacement = (
    state: ColumnState[],
    activeColumn: ColumnState,
    overColumn: ColumnState,
    activeKeys: Key[],
    overKeys: Key[],
  ): SortablePlacement => {
    const activeIndex = getColumnStartIndex(
      state,
      activeColumn.parentKey,
      activeKeys,
    );
    const overIndex = getColumnStartIndex(
      state,
      overColumn.parentKey,
      overKeys,
    );

    if (activeIndex !== null && overIndex !== null) {
      return activeIndex > overIndex ? 'start' : 'end';
    }

    return activeColumn.order > overColumn.order ? 'start' : 'end';
  };

  const updateSortablePreview = (event: DragOverEvent) => {
    const activeData = event.active.data.current;
    const overData = event.over?.data.current;
    const activeColumn = activeData?.column as ColumnState | undefined;
    const overColumn = overData?.column as ColumnState | undefined;
    const activeKeys = (activeData?.sortKeys || []) as Key[];
    const overKeys = (overData?.sortKeys || []) as Key[];

    if (
      activeData?.type !== 'sortableColumns' ||
      event.over?.id === event.active.id ||
      !activeColumn ||
      !overColumn ||
      activeColumn.parentKey !== overColumn.parentKey ||
      activeColumn.dragSortDisabled ||
      !activeKeys.length ||
      !overKeys.length
    ) {
      return false;
    }
    const baseState = draftStateRef.current || getSortableBaseState();
    const placement = getPlacement(
      baseState,
      activeColumn,
      overColumn,
      activeKeys,
      overKeys,
    );
    const nextState = reorderColumnsState(
      baseState,
      activeColumn.parentKey,
      activeKeys,
      overKeys,
      placement,
    );
    if (nextState) {
      draftChangedRef.current = true;
      draftStateRef.current = nextState;
      updateSortableDraftState(nextState);
    }

    // A null nextState can simply mean the current draft is already in this
    // over position. The drop target is still valid and should be committable.
    return true;
  };

  const cleanupSortable = (clearDraft = true) => {
    document.documentElement.style.cursor = '';
    setActiveKey(null);
    setTranslate({ x: 0, y: 0 });
    draftStateRef.current = null;
    draftChangedRef.current = false;
    if (clearDraft) {
      updateSortableDraftState(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      onSortableStart?.();

      document.documentElement.style.cursor = 'move';
      draftStateRef.current = getSortableBaseState();
      draftChangedRef.current = false;
      const x =
        (event.activatorEvent as MouseEvent).offsetX -
        dragOverlaySize.width / 2;
      const y =
        (event.activatorEvent as MouseEvent).offsetY -
        dragOverlaySize.height / 2;
      setTranslate({ x, y });
      setActiveKey(event.active.id);
    }

    if (event.active.data.current?.type === 'resizableColumns') {
      onResizeStart?.();
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      updateSortablePreview(event);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      onSortableEnd?.();
      const finalDraftState = draftStateRef.current;

      if (draftChangedRef.current && finalDraftState) {
        updateMiddleState(finalDraftState);
        columnsConfig?.onChange?.(finalDraftState);
        cleanupSortable(false);
      } else {
        cleanupSortable(true);
      }
    }

    if (event.active.data.current?.type === 'resizableColumns') {
      onResizeEnd?.();
    }
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      onSortableEnd?.();
      cleanupSortable(true);
    }

    if (event.active.data.current?.type === 'resizableColumns') {
      onResizeEnd?.();
    }
  };

  return (
    <div className={headRowCls}>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={columns.map((column) => `${column.key}`)}>
          {columns?.map((column, columnIndex) => (
            <HeadCell
              key={column.key}
              column={column}
              columnIndex={columnIndex}
              rowIndex={headRowIndex}
              prevRowLastCellKey={
                previousRow[previousRow.length - 1]?.column?.key
              }
              currentRowLastIndex={columns.length - 1}
              firstRowLastCellKey={firstRow[firstRow.length - 1]?.column?.key}
            />
          ))}
        </SortableContext>
        {sortableColumns && (
          <DragOverlay dropAnimation={null}>
            {activeColumn && (
              <div
                className={headDraggingOverlayCellCls}
                style={{
                  ...dragOverlaySize,
                  lineHeight: `${dragOverlaySize.height}px`,
                  transform: `translate(${translate.x}px, ${translate.y}px)`,
                }}
              >
                {activeColumn?.children}
              </div>
            )}
          </DragOverlay>
        )}
      </DndContext>
    </div>
  );
}

export default HeadRow;
