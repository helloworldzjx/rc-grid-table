import { motion } from 'motion/react';
import React, { ElementType, forwardRef, HTMLAttributes, useMemo } from 'react';

import { useColumnSortableContext } from './columnSortableContext';

type CellContainerProps = HTMLAttributes<HTMLDivElement> & {
  component?: ElementType;
};

const CellContainer = forwardRef<HTMLDivElement, CellContainerProps>(
  ({ component: Component = 'div', ...rest }, ref) => {
    const { sortingColumns } = useColumnSortableContext();

    const MotionComponent = useMemo(
      () => (Component === 'div' ? motion.div : motion.create(Component)),
      [Component],
    );

    const props = useMemo(() => {
      if (sortingColumns) {
        return {
          ...rest,
          initial: false,
          layout: 'position',
          transition: {
            duration: 0.15,
            ease: 'easeOut',
          },
        };
      }

      return rest;
    }, [sortingColumns, rest]);

    const Container = useMemo(() => {
      if (sortingColumns) {
        return MotionComponent;
      }

      return Component;
    }, [sortingColumns, MotionComponent, Component]);

    return <Container {...props} ref={ref} />;
  },
);

export default CellContainer;
