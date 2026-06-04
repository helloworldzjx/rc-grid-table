import classNames from 'classnames';
import React, { CSSProperties, FC, useMemo } from 'react';

import CellContainer from '../CellContainer';
import { useComponentsContext } from '../componentsContext';
import { ColumnState } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import { FixedInfo } from '../utils/fixedColumns';

interface HeadFilterCellProps<T = any> {
  column: ColumnState<T>;
  columnIndex: number;
  fixedInfo: FixedInfo;
  last?: boolean;
}

const HeadFilterCell: FC<HeadFilterCellProps> = ({
  column,
  columnIndex,
  fixedInfo,
  last = false,
}) => {
  const prefixCls = usePrefixClsContext();
  const { getComponent } = useComponentsContext();

  const {
    cellCls,
    filterCellCls,
    headLastCellCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const CellComponent = useMemo(
    () =>
      getComponent(
        ['header', 'filterCell'],
        getComponent(['header', 'cell'], 'div'),
      ),
    [getComponent],
  );

  const cellProps = useMemo(
    () => column.onFilterCell?.(column, columnIndex) || {},
    [column, columnIndex],
  );

  const mergedStyle = useMemo(() => {
    const style: CSSProperties = {};
    if (fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number;
    }
    if (fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number;
    }
    const align = cellProps.align ?? column.align;
    if (align) {
      style.textAlign = align;
    }

    return { ...style, ...column.style, ...cellProps.style };
  }, [
    cellProps,
    column.align,
    column.style,
    fixedInfo.fixEnd,
    fixedInfo.fixStart,
  ]);

  const restCellProps = useMemo(() => {
    const restProps = { ...cellProps };
    delete restProps.style;
    delete restProps.align;
    delete restProps.className;
    return restProps;
  }, [cellProps]);

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        filterCellCls,
        {
          [headLastCellCls]: last,
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
        },
        column.className,
        cellProps.className,
      )}
      style={mergedStyle}
      {...restCellProps}
    >
      {column.filterRender?.(column, columnIndex)}
    </CellContainer>
  );
};

export default HeadFilterCell;
