import {
  ClientRect,
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  pointerWithin,
  type Modifier,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { Coordinates, getEventCoordinates } from '@dnd-kit/utilities';
import React, {
  Key,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X } from '../../_utils/const';
import { useColumnSortableContext } from '../columnSortableContext';
import { useComponentsContext } from '../componentsContext';
import { CellType, ColumnState } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import HeadCell from './HeadCell';
import useSortablePreview from './useSortablePreview';

const SORTABLE_SCROLL_IDLE_DELAY = 120;
// 固定列处于 sticky 层，横向滚动后 dnd-kit 的 droppable rect 容易短暂滞后。
// 只在“从固定列开始拖拽”时使用 16ms 高频测量，避免普通列拖拽也承担额外测量成本。
const fixedColumnDroppableMeasuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
    frequency: 16,
  },
};

interface HeadRowProps<T = any> {
  headRows: CellType<T>[][];
  row: CellType<T>[];
  headRowIndex: number;
  getScrollElement?: () => HTMLDivElement | null;
  isSortableStartLocked?: () => boolean;
  lockSortableStart?: (duration: number) => void;
  onSortableStart?: () => void;
  onSortableEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

const canOverByFixed = <T,>(
  activeColumn: ColumnState<T>,
  overColumn: ColumnState<T>,
) => {
  if (!activeColumn.fixed) return true;

  return activeColumn.fixed === overColumn.fixed;
};

function HeadRow({
  headRows,
  row: columns,
  headRowIndex,
  getScrollElement,
  isSortableStartLocked,
  lockSortableStart,
  onSortableStart,
  onSortableEnd,
  onResizeStart,
  onResizeEnd,
}: HeadRowProps) {
  const {
    getSortableBaseState,
    updateSortableColumnsState,
    updateSortableDraftState,
    updateSortableMotionKeys,
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
  const [dragOverlaySize] = useState({ width: 90, height: 36 });
  const activeRectRef = useRef<ClientRect | null>(null);
  const scrollListenerCleanupRef = useRef<(() => void) | null>(null);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollLeftRef = useRef(0);
  const scrollingRef = useRef(false);
  const ignoreSortableDragRef = useRef(false);
  const sortableFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const activeColumn = useMemo(() => {
    return columns.find((column) => column.key === activeKey);
  }, [activeKey, columns]);

  const columnDroppableMeasuring = useMemo(() => {
    return activeColumn?.column?.fixed
      ? fixedColumnDroppableMeasuring
      : undefined;
  }, [activeColumn]);

  const sortablePreview = useSortablePreview({
    getBaseState: getSortableBaseState,
    updateDraftState: updateSortableDraftState,
    updateMotionKeys: updateSortableMotionKeys,
  });

  const sortableItems = useMemo(
    () => columns.map((column) => `${column.key}`),
    [columns],
  );

  const dragOverlayStyle = useMemo<React.CSSProperties>(
    () => ({
      ...dragOverlaySize,
      lineHeight: `${dragOverlaySize.height}px`,
    }),
    [dragOverlaySize],
  );

  const dragOverlayChildren = useMemo(() => {
    return activeColumn?.column?.columnOverlayTitle !== undefined
      ? activeColumn.column.columnOverlayTitle
      : activeColumn?.children;
  }, [activeColumn]);

  const dragOverlayModifiers = useMemo<Modifier[] | undefined>(() => {
    if (!activeColumn) return undefined;

    return [
      ({ activatorEvent, activeNodeRect, overlayNodeRect, transform }) => {
        let coordinates: Coordinates | null = null;
        if (activatorEvent) {
          coordinates = getEventCoordinates(activatorEvent);
        }

        // 保存拖拽开始时的 active rect。排序预览会改变 header 布局，
        // overlay 偏移需要基于初始位置计算，避免预览动画反向影响浮层位置。
        if (!activeRectRef.current && activeNodeRect) {
          activeRectRef.current = activeNodeRect;
        }
        const activeRect = activeRectRef.current ?? activeNodeRect;
        if (!coordinates || !activeRect) {
          return transform;
        }

        const overlayHeight = overlayNodeRect?.height ?? dragOverlaySize.height;
        const offsetX =
          coordinates.x -
          activeRect.left -
          COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X;
        const offsetY = coordinates.y - activeRect.top - overlayHeight / 2;

        return {
          ...transform,
          x: transform.x + offsetX,
          y: transform.y + offsetY,
        };
      },
    ];
  }, [activeColumn, dragOverlaySize.height, dragOverlaySize.width]);

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
    if (sortableFinishTimerRef.current) {
      clearTimeout(sortableFinishTimerRef.current);
      sortableFinishTimerRef.current = null;
    }
    cleanupSortableScrollListener();
    activeRectRef.current = null;
    document.documentElement.style.cursor = '';
    setActiveKey(null);
    sortablePreview.cleanup(clearDraft);
  };

  const finishSortableAfterMotion = (
    clearDraft: boolean,
    afterMotion?: () => void,
  ) => {
    if (sortableFinishTimerRef.current) {
      clearTimeout(sortableFinishTimerRef.current);
      sortableFinishTimerRef.current = null;
    }

    cleanupSortableScrollListener();
    activeRectRef.current = null;
    document.documentElement.style.cursor = '';
    setActiveKey(null);

    const delay = sortablePreview.getMotionFinishDelay();
    if (delay <= 0) {
      afterMotion?.();
      onSortableEnd?.();
      sortablePreview.cleanup(clearDraft);
      return;
    }

    // 最后一帧 preview layout 仍有 150ms motion 过渡。
    // 先锁住新的 dragStart，并延迟提交/清理，避免 drag end 立刻切掉 motionKeys 导致动画直接结束。
    lockSortableStart?.(delay);
    sortableFinishTimerRef.current = setTimeout(() => {
      sortableFinishTimerRef.current = null;
      afterMotion?.();
      onSortableEnd?.();
      sortablePreview.cleanup(clearDraft);
    }, delay);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      if (isSortableStartLocked?.()) {
        ignoreSortableDragRef.current = true;
        return;
      }

      ignoreSortableDragRef.current = false;
      onSortableStart?.();

      document.documentElement.style.cursor = 'move';
      sortablePreview.start();
      startSortableScrollListener();
      setActiveKey(event.active.id);
    }

    if (event.active.data.current?.type === 'resizableColumns') {
      onResizeStart?.();
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (ignoreSortableDragRef.current) return;

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

    // 横向滚动期间 sticky 固定列的视觉位置与普通列滚动层不同步，
    // 这段时间先不让固定列参与 over 交换，等滚动空闲后再允许正常排序。
    if (scrollingRef.current && overColumn.fixed) {
      return;
    }

    if (
      activeColumn.parentKey !== overColumn.parentKey ||
      activeColumn.dragSortDisabled
    ) {
      return;
    }

    // 固定列只能在相同 fixed 区域内排序，避免 start/normal/end 区域互相穿越。
    if (!canOverByFixed(activeColumn, overColumn)) {
      return;
    }

    if (!activeData?.sortable || !overData?.sortable) {
      return;
    }

    // dnd-kit 提供当前 SortableContext 中的 index；
    // draft 计算会再结合 active/over 覆盖的叶子列 key。
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
      if (ignoreSortableDragRef.current) {
        ignoreSortableDragRef.current = false;
        return;
      }

      sortablePreview.flush();
      const finalDraftState = sortablePreview.getDraftState();

      if (sortablePreview.hasDraftChanged() && finalDraftState) {
        finishSortableAfterMotion(false, () => {
          updateSortableColumnsState(finalDraftState);
        });
      } else {
        cleanupSortable(true);
        onSortableEnd?.();
      }
    }

    if (event.active.data.current?.type === 'resizableColumns') {
      onResizeEnd?.();
    }
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    if (event.active.data.current?.type === 'sortableColumns') {
      if (ignoreSortableDragRef.current) {
        ignoreSortableDragRef.current = false;
        return;
      }

      sortablePreview.rollback();
      finishSortableAfterMotion(true);
    }

    if (event.active.data.current?.type === 'resizableColumns') {
      onResizeEnd?.();
    }
  };

  useEffect(() => {
    return () => {
      if (sortableFinishTimerRef.current) {
        clearTimeout(sortableFinishTimerRef.current);
        sortableFinishTimerRef.current = null;
      }
      cleanupSortableScrollListener();
      document.documentElement.style.cursor = '';
    };
  }, [cleanupSortableScrollListener]);

  return (
    <RowComponent className={headRowCls}>
      <DndContext
        collisionDetection={pointerWithin}
        measuring={columnDroppableMeasuring}
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
        <DragOverlay dropAnimation={null} modifiers={dragOverlayModifiers}>
          {activeColumn && (
            <div
              className={headDraggingOverlayCellCls}
              style={dragOverlayStyle}
            >
              {dragOverlayChildren}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </RowComponent>
  );
}

export default memo(HeadRow);
