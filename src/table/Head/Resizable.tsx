import { useDndMonitor, useDraggable } from '@dnd-kit/core';
import { useDebounceFn } from 'ahooks';
import classNames from 'classnames';
import React, {
  forwardRef,
  Key,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { useTableContext } from '../contexts';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableColumnStateContext } from '../contexts/TableColumnStateContext';
import { useTableLayoutContext } from '../contexts/TableLayoutContext';
import type { ColumnStatePatch } from '../interface';
import { getComponentCls } from '../style/classNames';
import { getDefaultInternalColumnWidth } from '../utils/const';
import {
  isResizableColumnsData,
  type ResizableColumnsData,
} from '../utils/dnd';

interface ResizableProps {
  id: string;
  keys: Key[];
}

const Resizable = forwardRef<HTMLDivElement, ResizableProps>(
  ({ id, keys }, ref) => {
    const { size } = useTableContext();
    const { flattenColumns = [], flattenColumnsWidths = [] } =
      useTableLayoutContext();
    const {
      columnsStatePreviewMode,
      updateLockContainerWidth,
      updateFlattenColumnsWidths,
      clearFlattenColumnsWidthPreview,
      commitColumnWidthChange,
    } = useTableColumnStateContext();
    const prefixCls = usePrefixClsContext();
    const disabled = columnsStatePreviewMode === 'visibleHotOnly';

    const { headCellResizeHandleCls, headCellResizeHandleDisabledCls } =
      useMemo(() => getComponentCls(prefixCls), [prefixCls]);

    const updated = useRef(false);
    const appliedDistanceTotal = useRef(0);
    const latestWidths = useRef(flattenColumnsWidths);
    const {
      cancel: cancelSetFlattenColumnsWidths,
      run: setFlattenColumnsWidths,
    } = useDebounceFn(updateFlattenColumnsWidths, { wait: 0 });

    const { listeners, setNodeRef } = useDraggable({
      id,
      disabled,
      data: { type: 'resizableColumns' } satisfies ResizableColumnsData,
    });

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        setNodeRef(node);
        if (typeof ref === 'function') {
          ref(node);
          return;
        }
        if (ref) {
          ref.current = node;
        }
      },
      [ref, setNodeRef],
    );

    const idxs = useMemo(() => {
      const idxArr = flattenColumns.reduce((indexes: number[], item, index) => {
        if (keys.includes(item.key)) {
          indexes.push(index);
        }

        return indexes;
      }, []);

      return idxArr;
    }, [flattenColumns, keys]);

    useEffect(() => {
      latestWidths.current = flattenColumnsWidths;
    }, [flattenColumnsWidths]);

    const getResizeMinWidth = (idx: number, width: number) => {
      const minWidth =
        flattenColumns[idx]?.resizeMinWidth ??
        getDefaultInternalColumnWidth(size);
      return Math.min(minWidth, width);
    };

    const applyResizeDistance = (distance: number) => {
      if (!distance) return 0;

      const widths = latestWidths.current;
      const resizeIdxs = idxs.filter((idx: number) => {
        if (distance >= 0) return true;
        const width = widths[idx] as number;
        return width > getResizeMinWidth(idx, width);
      });
      if (!resizeIdxs.length) return 0;

      const avg = distance / resizeIdxs.length;
      let appliedDistance = 0;
      const nextWidths = widths.map((width, index) => {
        if (resizeIdxs.includes(index)) {
          const minWidth = getResizeMinWidth(index, width);
          const nextWidth = parseFloat((width + avg).toFixed(2));
          const appliedWidth = Math.max(nextWidth, minWidth);
          appliedDistance += appliedWidth - width;
          return appliedWidth;
        }

        return width;
      });

      if (!appliedDistance) return 0;

      latestWidths.current = nextWidths;
      setFlattenColumnsWidths(nextWidths);
      updated.current = true;
      return appliedDistance;
    };

    const updateState = () => {
      const widths = latestWidths.current;
      const patches = idxs.reduce<ColumnStatePatch[]>((result, idx) => {
        const column = flattenColumns[idx];
        if (!column) return result;

        result.push({
          key: column.key,
          partial: {
            width: widths[idx],
            widthManuallyChanged: true,
          },
        });

        return result;
      }, []);

      if (!patches.length) return;

      commitColumnWidthChange('resizeWidth', patches, widths);
      clearFlattenColumnsWidthPreview(widths);
    };

    useDndMonitor({
      onDragStart(event) {
        if (
          event.active.id !== id ||
          !isResizableColumnsData(event.active.data.current)
        )
          return;
        updateLockContainerWidth(true);
        latestWidths.current = flattenColumnsWidths;
        appliedDistanceTotal.current = 0;
        document.documentElement.style.cursor = 'e-resize';
      },
      onDragMove(event) {
        if (
          event.active.id !== id ||
          !isResizableColumnsData(event.active.data.current)
        )
          return;
        const distance = event.delta.x - appliedDistanceTotal.current;
        const appliedDistance = applyResizeDistance(distance);
        appliedDistanceTotal.current += appliedDistance;
      },
      onDragEnd(event) {
        if (
          event.active.id !== id ||
          !isResizableColumnsData(event.active.data.current)
        )
          return;
        updateLockContainerWidth(false);
        document.documentElement.style.cursor = '';
        cancelSetFlattenColumnsWidths();
        if (updated.current) {
          updateFlattenColumnsWidths(latestWidths.current);
          updateState();
          appliedDistanceTotal.current = 0;
          updated.current = false;
        }
      },
    });

    return (
      <div
        aria-disabled={disabled}
        className={classNames(headCellResizeHandleCls, {
          [headCellResizeHandleDisabledCls]: disabled,
        })}
        ref={setRefs}
        {...listeners}
      />
    );
  },
);

export default memo(Resizable);
