import classNames from 'classnames';
import React, {
  CSSProperties,
  FC,
  memo,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { isNum } from '../../_utils/validate';
import { useColumnSortableContext } from '../contexts/ColumnSortableContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableColumnStateContext } from '../contexts/TableColumnStateContext';
import { useTableLayoutContext } from '../contexts/TableLayoutContext';
import type { ColumnStatePatch } from '../interface';
import { getComponentCls } from '../style/classNames';
import { distribute } from '../utils/calc';
import {
  batchPatchColumns,
  syncColumnsStateRuntimeWidths,
} from '../utils/handle';

const PLACEHOLDER_VISIBLE_TOLERANCE = 1;
const AUTO_FILL_CHECK_FRAMES = 4;

const Placeholder: FC = () => {
  const {
    containerWidth = 0,
    columnsWidthTotal,
    flattenColumns = [],
    flattenColumnsWidths = [],
  } = useTableLayoutContext();
  const {
    columnsState,
    columnsStatePreviewMode,
    updateFlattenColumnsWidths,
    clearFlattenColumnsWidthPreview,
    commitColumnsStateChange,
  } = useTableColumnStateContext();
  const { sortableDraftState } = useColumnSortableContext();
  const prefixCls = usePrefixClsContext();
  const disabled = columnsStatePreviewMode === 'visibleHotOnly';

  const { placeholderCls, placeholderDisabledCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const autoFillFrameRef = useRef<number | null>(null);
  const autoFillCheckCountRef = useRef(0);
  // autoFill 会在 rAF 中二次校准，使用 ref 保存最新状态，避免回调读到旧闭包。
  const latestAutoFillStateRef = useRef({
    containerWidth,
    columnsWidthTotal,
    flattenColumns,
    flattenColumnsWidths,
    sortableDraftState,
    columnsState,
    updateFlattenColumnsWidths,
    clearFlattenColumnsWidthPreview,
    commitColumnsStateChange,
    disabled,
  });

  latestAutoFillStateRef.current = {
    containerWidth,
    columnsWidthTotal,
    flattenColumns,
    flattenColumnsWidths,
    sortableDraftState,
    columnsState,
    updateFlattenColumnsWidths,
    clearFlattenColumnsWidthPreview,
    commitColumnsStateChange,
    disabled,
  };

  useEffect(() => {
    return () => {
      if (
        autoFillFrameRef.current !== null &&
        typeof cancelAnimationFrame === 'function'
      ) {
        cancelAnimationFrame(autoFillFrameRef.current);
      }
    };
  }, []);

  // 按当前剩余宽度补齐可 resize 的叶子列，并同步渲染宽度与 columnsState。
  const applyAutoFill = async () => {
    const {
      containerWidth,
      columnsWidthTotal,
      flattenColumns,
      flattenColumnsWidths,
      sortableDraftState,
      columnsState,
      updateFlattenColumnsWidths,
      clearFlattenColumnsWidthPreview,
      commitColumnsStateChange,
      disabled,
    } = latestAutoFillStateRef.current;

    if (disabled) return false;

    // 排序 draft 还没清理时不补宽，避免把临时排序态提交成真实列宽状态。
    if (sortableDraftState) return false;

    const remainingWidth = containerWidth - columnsWidthTotal;
    if (
      remainingWidth <= PLACEHOLDER_VISIBLE_TOLERANCE ||
      !columnsState.length
    ) {
      return false;
    }

    const resizeEnabledLeafColumns = flattenColumns.reduce(
      (
        result: Array<{
          index: number;
          width: number;
          widthManuallyChanged: boolean;
        }>,
        column,
        index,
      ) => {
        const width = flattenColumnsWidths[index] ?? column.width;

        if (!column.hasChildren && !column.resizeDisabled && isNum(width)) {
          result.push({
            index,
            width,
            widthManuallyChanged: column.widthManuallyChanged,
          });
        }

        return result;
      },
      [],
    );

    const allManuallyChanged = resizeEnabledLeafColumns.every(
      (column) => column.widthManuallyChanged,
    );
    let autoFillColumns = resizeEnabledLeafColumns;
    if (!allManuallyChanged) {
      autoFillColumns = resizeEnabledLeafColumns.filter(
        (column) => !column.widthManuallyChanged,
      );
    }

    if (!autoFillColumns.length) return false;

    const { first, avg } = distribute(remainingWidth, autoFillColumns.length);
    const nextWidths = [...flattenColumnsWidths];

    const patches = autoFillColumns.map(({ index, width }, leafIndex) => {
      const column = flattenColumns[index];
      const newWidth = width + (leafIndex === 0 ? first : avg);
      nextWidths[index] = newWidth;

      return {
        key: column.key,
        partial: {
          width: newWidth,
          widthManuallyChanged: false,
        },
      };
    }) satisfies ColumnStatePatch[];

    updateFlattenColumnsWidths(nextWidths);

    const baseColumnsState = syncColumnsStateRuntimeWidths(
      columnsState,
      flattenColumns,
      flattenColumnsWidths,
    );
    const updatedColumnsState = batchPatchColumns(baseColumnsState, patches);
    commitColumnsStateChange(updatedColumnsState, 'autoFillWidth', patches);

    clearFlattenColumnsWidthPreview(nextWidths);
    // 立即更新 ref，防止下一帧在 React render 前基于旧 columnsWidthTotal 重复累加。
    latestAutoFillStateRef.current = {
      ...latestAutoFillStateRef.current,
      columnsWidthTotal: nextWidths.reduce(
        (sum, num) => sum + (isNum(num) ? num : 0),
        0,
      ),
      flattenColumnsWidths: nextWidths,
      columnsState: updatedColumnsState,
    };

    return true;
  };

  // 补宽后 body 纵向滚动条可能消失，可用宽度会在后续帧变大；自动检查几帧补齐新增空间。
  const scheduleAutoFillCheck = () => {
    if (typeof requestAnimationFrame !== 'function') return;

    if (autoFillFrameRef.current !== null) {
      cancelAnimationFrame(autoFillFrameRef.current);
    }

    const check = async () => {
      autoFillFrameRef.current = null;
      if (autoFillCheckCountRef.current <= 0) return;

      autoFillCheckCountRef.current -= 1;
      const filled = await applyAutoFill();

      if (filled && autoFillCheckCountRef.current > 0) {
        autoFillFrameRef.current = requestAnimationFrame(check);
      }
    };

    autoFillFrameRef.current = requestAnimationFrame(check);
  };

  const autoFill = async () => {
    if (await applyAutoFill()) {
      autoFillCheckCountRef.current = AUTO_FILL_CHECK_FRAMES;
      scheduleAutoFillCheck();
    }
  };

  const placeholderStyle: CSSProperties = useMemo(
    () => ({
      left: columnsWidthTotal,
      display:
        containerWidth - columnsWidthTotal > PLACEHOLDER_VISIBLE_TOLERANCE
          ? 'block'
          : 'none',
    }),
    [columnsWidthTotal, containerWidth],
  );

  return (
    // 暂不动态渲染这个占位元素，而是通过display控制
    <div
      aria-disabled={disabled}
      onClick={disabled ? undefined : autoFill}
      className={classNames(placeholderCls, {
        [placeholderDisabledCls]: disabled,
      })}
      style={placeholderStyle}
    />
  );
};

export default memo(Placeholder);
