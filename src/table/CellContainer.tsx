import { motion } from 'motion/react';
import React, { ElementType, forwardRef, HTMLAttributes, useMemo } from 'react';

import { useSortingColumnsContext } from './sortingContext';

type CellContainerProps = HTMLAttributes<HTMLDivElement> & {
  component?: ElementType;
};
type MotionCellContainerProps = CellContainerProps & {
  ref: React.ForwardedRef<HTMLDivElement>;
  initial: false;
  layout: 'position';
  transition: {
    duration: number;
    ease: string;
  };
};

const CellContainer = forwardRef<HTMLDivElement, CellContainerProps>(
  ({ component: Component = 'div', ...props }, ref) => {
    const { sortingColumns } = useSortingColumnsContext();
    const MotionComponent = useMemo(
      () => (Component === 'div' ? motion.div : motion.create(Component)),
      [Component],
    );

    if (sortingColumns) {
      const motionProps: MotionCellContainerProps = {
        ...props,
        ref,
        initial: false,
        layout: 'position',
        transition: {
          duration: 0.15,
          ease: 'easeOut',
        },
      };

      return React.createElement(MotionComponent, motionProps);
    }

    return <Component {...props} ref={ref} />;
  },
);

export default CellContainer;
