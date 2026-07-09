import { composeRef } from '@rc-component/util/lib/ref';
import { useIsomorphicLayoutEffect } from 'ahooks';
import { animateMini } from 'motion';
import React, {
  ElementType,
  forwardRef,
  HTMLAttributes,
  Key,
  useMemo,
  useRef,
} from 'react';

import { useColumnSortMotionContext } from '../contexts/ColumnSortMotionContext';
import { COLUMNS_SORT_MOTION_DURATION } from '../utils/const';

type CellContainerProps = HTMLAttributes<HTMLDivElement> & {
  component?: ElementType;
  motionKeys?: Key[];
  motionLayoutDependency?: string | number | false;
  motionLayoutPosition?: number;
};

const getMatchedMotionKeys = (
  motionKeys: Key[] | undefined,
  sortableMotionKeys: ReadonlySet<Key>,
) => {
  if (!motionKeys?.length || !sortableMotionKeys.size) return [];

  return motionKeys.filter((key) => sortableMotionKeys.has(key));
};

type MotionAnimation = ReturnType<typeof animateMini>;

const isInvalidAnimationStateError = (error: unknown) =>
  (typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'InvalidStateError') ||
  (typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'InvalidStateError');

const stopMotionAnimation = (animation: MotionAnimation | null) => {
  if (!animation) return;

  try {
    animation.stop();
  } catch (error) {
    if (!isInvalidAnimationStateError(error)) {
      throw error;
    }

    // 列排序预览时，合并/占位单元格可能在动画清理前变为不可渲染。
    // 此时 WAAPI commitStyles 会抛 InvalidStateError，退回 cancel 即可。
    animation.cancel();
  }
};

const CellContainer = forwardRef<HTMLDivElement, CellContainerProps>(
  (
    {
      component: Component = 'div',
      motionKeys,
      motionLayoutDependency,
      motionLayoutPosition,
      ...rest
    },
    ref,
  ) => {
    const { sortingColumns, sortableMotionKeys, sortableMotionVersion } =
      useColumnSortMotionContext();
    const innerRef = useRef<HTMLDivElement | null>(null);
    const previousPositionRef = useRef<number | undefined>(undefined);
    const animationRef = useRef<MotionAnimation | null>(null);

    const activeMotionKeys = useMemo(
      () =>
        sortingColumns
          ? getMatchedMotionKeys(motionKeys, sortableMotionKeys)
          : [],
      [motionKeys, sortableMotionKeys, sortingColumns],
    );
    const motionEnabled = activeMotionKeys.length > 0;

    useIsomorphicLayoutEffect(() => {
      if (
        typeof motionLayoutPosition !== 'number' ||
        motionLayoutDependency === false
      ) {
        previousPositionRef.current = undefined;
        stopMotionAnimation(animationRef.current);
        animationRef.current = null;
        return;
      }

      const previousPosition = previousPositionRef.current;
      previousPositionRef.current = motionLayoutPosition;

      if (!motionEnabled || previousPosition === undefined) {
        return;
      }

      const element = innerRef.current;
      if (!element) return;

      const offset = previousPosition - motionLayoutPosition;
      if (Math.abs(offset) < 0.5) {
        return;
      }

      stopMotionAnimation(animationRef.current);
      const baseTransform =
        typeof rest.style?.transform === 'string' ? rest.style.transform : '';
      const fromTransform = baseTransform
        ? `translateX(${offset}px) ${baseTransform}`
        : `translateX(${offset}px)`;
      const toTransform = baseTransform || 'none';
      element.style.transform = baseTransform;

      let animation: ReturnType<typeof animateMini>;
      animation = animateMini(
        element,
        {
          transform: [fromTransform, toTransform],
        },
        {
          duration: COLUMNS_SORT_MOTION_DURATION / 1000,
          ease: 'easeOut',
        },
      );
      animationRef.current = animation;
      animation.then(() => {
        if (animationRef.current !== animation) return;

        element.style.transform = baseTransform;
        animationRef.current = null;
      });
    }, [
      motionEnabled,
      motionLayoutDependency,
      motionLayoutPosition,
      rest.style?.transform,
      sortableMotionVersion,
    ]);

    useIsomorphicLayoutEffect(() => {
      return () => {
        stopMotionAnimation(animationRef.current);
        animationRef.current = null;
      };
    }, []);

    const refCallback = useMemo(() => composeRef(ref, innerRef), [ref]);

    return <Component {...rest} ref={refCallback} />;
  },
);

export default CellContainer;
