import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import React, { Key, useMemo, useState } from 'react';

import { useTableContext } from '../context';
import { CellType, ColumnState } from '../interface';
import { useStyles } from '../style';
import HeadCell from './HeadCell';
import useSortablePreview from './useSortablePreview';

interface HeadRowProps<T = any> {
  headRows: CellType<T>[][];
  row: CellType<T>[];
  headRowIndex: number;
  getScrollElement?: () => HTMLDivElement | null;
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
    getComponent,
  } = useTableContext();

  const { headRowCls, headDraggingOverlayCellCls } = useStyles();
  const RowComponent = getComponent(['header', 'row'], 'div');

  const firstRow = headRows[0] || [];
  const previousRow = headRows[headRowIndex - 1] || [];
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const [dragOverlaySize] = useState({ width: 100, height: 40 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const activeColumn = useMemo(() => {
    return columns.find((column) => column.key === activeKey);
  }, [activeKey, columns]);

  const getSortableBaseState = () => {
    return (
      sortableDraftState ||
      (innerColumnsState.length ? innerColumnsState : middleState)
    );
  };

  const sortablePreview = useSortablePreview({
    getBaseState: getSortableBaseState,
    updateDraftState: updateSortableDraftState,
  });

  const cleanupSortable = (clearDraft = true) => {
    document.documentElement.style.cursor = '';
    setActiveKey(null);
    setTranslate({ x: 0, y: 0 });
    sortablePreview.cleanup(clearDraft);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      onSortableStart?.();

      document.documentElement.style.cursor = 'move';
      sortablePreview.start();
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
    const activeData = event.active?.data.current;
    const overData = event.over?.data.current;
    if (!activeData || !overData) return;
    if (
      activeData.type !== 'sortableColumns' ||
      overData.type !== 'sortableColumns'
    ) {
      return;
    }
    if (event.active?.id === event.over?.id) return;

    const activeColumn = activeData?.column as ColumnState | undefined;
    const overColumn = overData?.column as ColumnState | undefined;
    const activeKeys = (activeData?.sortKeys || []) as Key[];
    const overKeys = (overData?.sortKeys || []) as Key[];

    if (
      !activeColumn ||
      !overColumn ||
      !activeKeys.length ||
      !overKeys.length
    ) {
      return;
    }

    if (
      activeColumn.parentKey !== overColumn.parentKey ||
      activeColumn.dragSortDisabled
    ) {
      return;
    }

    if (!activeData?.sortable || !overData?.sortable) {
      return;
    }

    // 获取当前的index，sortable数据由插件提供
    const activeIndex = activeData.sortable.index;
    const overIndex = overData.sortable.index;

    sortablePreview.schedule({
      activeIndex,
      overIndex,
      activeColumn,
      overColumn,
      activeKeys,
      overKeys,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      sortablePreview.flush();
      onSortableEnd?.();
      const finalDraftState = sortablePreview.getDraftState();

      if (sortablePreview.hasDraftChanged() && finalDraftState) {
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
      sortablePreview.cancel();
      onSortableEnd?.();
      cleanupSortable(true);
    }

    if (event.active.data.current?.type === 'resizableColumns') {
      onResizeEnd?.();
    }
  };

  return (
    <RowComponent className={headRowCls}>
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
    </RowComponent>
  );
}

export default HeadRow;
