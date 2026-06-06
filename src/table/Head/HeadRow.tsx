import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import React, { Key, useCallback, useMemo, useRef, useState } from 'react';

import { useColumnSortableContext } from '../columnSortableContext';
import { useComponentsContext } from '../componentsContext';
import { CellType, ColumnState } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import HeadCell from './HeadCell';
import useSortablePreview from './useSortablePreview';

const SORTABLE_SCROLL_IDLE_DELAY = 120;

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
  getScrollElement,
  onSortableStart,
  onSortableEnd,
  onResizeStart,
  onResizeEnd,
}: HeadRowProps) {
  const {
    sortableColumns,
    getSortableBaseState,
    updateSortableColumnsState,
    updateSortableDraftState,
  } = useColumnSortableContext();
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();

  const { headRowCls, headDraggingOverlayCellCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );
  const RowComponent = getComponent(['header', 'row'], 'div');

  const firstRow = headRows[0] || [];
  const previousRow = headRows[headRowIndex - 1] || [];
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const [dragOverlaySize] = useState({ width: 100, height: 40 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const scrollListenerCleanupRef = useRef<(() => void) | null>(null);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollLeftRef = useRef(0);
  const scrollingRef = useRef(false);

  const activeColumn = useMemo(() => {
    return columns.find((column) => column.key === activeKey);
  }, [activeKey, columns]);

  const sortablePreview = useSortablePreview({
    getBaseState: getSortableBaseState,
    updateDraftState: updateSortableDraftState,
  });

  const sortableItems = useMemo(
    () => columns.map((column) => `${column.key}`),
    [columns],
  );

  const dragOverlayStyle = useMemo<React.CSSProperties>(
    () => ({
      ...dragOverlaySize,
      lineHeight: `${dragOverlaySize.height}px`,
      transform: `translate(${translate.x}px, ${translate.y}px)`,
    }),
    [dragOverlaySize, translate.x, translate.y],
  );

  const cleanupSortableScrollListener = useCallback(() => {
    clearTimeout(scrollEndTimerRef.current!);
    scrollingRef.current = false;
    scrollListenerCleanupRef.current?.();
    scrollListenerCleanupRef.current = null;
  }, []);

  const startSortableScrollListener = () => {
    cleanupSortableScrollListener();

    const scrollElement = getScrollElement?.();
    if (!scrollElement) return;

    scrollLeftRef.current = scrollElement.scrollLeft;

    const handleScroll = () => {
      const scrollLeft = scrollElement.scrollLeft;
      if (scrollLeft === scrollLeftRef.current) return;

      scrollLeftRef.current = scrollLeft;
      scrollingRef.current = true;
      clearTimeout(scrollEndTimerRef.current!);
      scrollEndTimerRef.current = setTimeout(() => {
        scrollingRef.current = false;
      }, SORTABLE_SCROLL_IDLE_DELAY);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    scrollListenerCleanupRef.current = () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  };

  const cleanupSortable = (clearDraft = true) => {
    cleanupSortableScrollListener();
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
      startSortableScrollListener();
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

    // 滚动过程中禁止与固定列交换顺序，等滚动空闲后再允许正常拖拽排序。
    if (scrollingRef.current && overColumn.fixed) {
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
        updateSortableColumnsState(finalDraftState);
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
        <SortableContext items={sortableItems}>
          {columns.map((column, columnIndex) => (
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
                style={dragOverlayStyle}
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
