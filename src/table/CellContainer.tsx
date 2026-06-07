import { motion } from 'motion/react';
import React, {
  ElementType,
  forwardRef,
  HTMLAttributes,
  Key,
  useMemo,
} from 'react';

import { useColumnSortMotionContext } from './columnSortMotionContext';

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
    const motionEnabled = hasMotionKey(motionKeys, sortableMotionKeys);
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
            duration: 0.15,
            ease: 'easeOut',
          },
        };

        if (motionLayoutDependency !== false) {
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
