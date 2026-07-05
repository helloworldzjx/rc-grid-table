import { motion } from 'motion/react';
import React, {
  ElementType,
  forwardRef,
  HTMLAttributes,
  Key,
  useMemo,
} from 'react';

import { useColumnSortMotionContext } from '../contexts/ColumnSortMotionContext';
import { COLUMNS_SORT_MOTION_DURATION } from '../utils/const';

type CellContainerProps = HTMLAttributes<HTMLDivElement> & {
  component?: ElementType;
  motionKeys?: Key[];
  motionLayoutDependency?: string | number | false;
};

const hasMotionKey = (
  motionKeys: Key[] | undefined,
  sortableMotionKeys: ReadonlySet<Key>,
) => {
  if (!motionKeys?.length || !sortableMotionKeys.size) return false;

  return motionKeys.some((key) => sortableMotionKeys.has(key));
};

const CellContainer = forwardRef<HTMLDivElement, CellContainerProps>(
  (
    {
      component: Component = 'div',
      motionKeys,
      motionLayoutDependency,
      ...rest
    },
    ref,
  ) => {
    const { sortingColumns, sortableMotionKeys, sortableMotionVersion } =
      useColumnSortMotionContext();

    // 列排序预览仍使用 motion layout，但只给 active-over 区间内的 cell 开启。
    // 非相关 cell 保持普通组件，避免整张表所有 cell 都参与 getBoundingClientRect 测量。
    const motionEnabled = useMemo(() => {
      return hasMotionKey(motionKeys, sortableMotionKeys);
    }, [motionKeys, sortableMotionKeys]);
    const useMotionLayout = sortingColumns && motionEnabled;

    const MotionComponent = useMemo(
      () =>
        useMotionLayout
          ? Component === 'div'
            ? motion.div
            : motion.create(Component)
          : null,
      [Component, useMotionLayout],
    );

    const props = useMemo(() => {
      if (useMotionLayout) {
        const motionProps: Record<string, unknown> = {
          ...rest,
          initial: false,
          layout: 'position',
          transition: {
            duration: COLUMNS_SORT_MOTION_DURATION / 1000,
            ease: 'easeOut',
          },
        };

        if (motionLayoutDependency !== false) {
          // dependency 描述 cell 的真实位置签名；只在 key/span/fixed offset 等位置因素变化时触发布局测量。
          motionProps.layoutDependency =
            motionLayoutDependency ?? sortableMotionVersion;
        }

        return motionProps;
      }

      return rest;
    }, [motionLayoutDependency, rest, sortableMotionVersion, useMotionLayout]);

    const Container = useMemo(() => {
      if (useMotionLayout) {
        return MotionComponent!;
      }

      return Component;
    }, [useMotionLayout, MotionComponent, Component]);

    return <Container {...props} ref={ref} />;
  },
);

export default CellContainer;
