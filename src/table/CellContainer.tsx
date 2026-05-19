import { motion } from 'motion/react';
import React, { forwardRef, HTMLAttributes } from 'react';

import { useTableContext } from './context';

type CellContainerProps = HTMLAttributes<HTMLDivElement>;
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
  (props, ref) => {
    const { sortingColumns } = useTableContext();

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

      return React.createElement(
        motion.div as React.ElementType<MotionCellContainerProps>,
        motionProps,
      );
    }

    return <div {...props} ref={ref} />;
  },
);

export default CellContainer;
