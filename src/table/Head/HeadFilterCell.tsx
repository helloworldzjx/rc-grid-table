import classNames from 'classnames';
import React, { CSSProperties, FC, memo, useMemo } from 'react';

import CellContainer from '../CellContainer';
import { useColumnSortableContext } from '../contexts/ColumnSortableContext';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { useFixedShadowActive } from '../contexts/FixedShadowContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import type { InternalColumnState } from '../internalInterface';
import { getComponentCls } from '../style/classNames';
import { FixedInfo } from '../utils/fixedColumns';

interface HeadFilterCellProps<T = any> {
  column: InternalColumnState<T>;
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
    columnSortableActiveCellCls,
    columnSortableHotCellCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
    fixedEndShadowActiveCellCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { sortableActiveKeys, sortableHotKeys } = useColumnSortableContext();
  const fixedShadowActive = useFixedShadowActive(fixedInfo);
  const inSortableActiveScope = sortableActiveKeys.has(column.key);
  const inSortableHotScope = sortableHotKeys.has(column.key);

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

  const motionKeys = useMemo(() => [column.key], [column.key]);
  const motionLayoutDependency = useMemo(
    () =>
      [
        // filter cell 是单列覆盖，列 index 和 fixed offset 变化时才需要触发 layout 测量。
        column.key,
        columnIndex,
        fixedInfo.fixStart ?? '',
        fixedInfo.fixEnd ?? '',
      ].join('|'),
    [column.key, columnIndex, fixedInfo.fixStart, fixedInfo.fixEnd],
  );

  const filterNode = useMemo(
    () => column.filterRender?.(column, columnIndex),
    [column, columnIndex],
  );

  return (
    <CellContainer
      component={CellComponent}
      className={classNames(
        cellCls,
        filterCellCls,
        {
          [headLastCellCls]: last,
          [columnSortableActiveCellCls]: inSortableActiveScope,
          [columnSortableHotCellCls]: inSortableHotScope,
          [fixedStartCellCls]: fixedInfo.fixStart !== null,
          [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
          [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
          [fixedEndCellCls]: fixedInfo.fixEnd !== null,
          [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
          [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
        },
        column.className,
        cellProps.className,
      )}
      style={mergedStyle}
      motionKeys={motionKeys}
      motionLayoutDependency={motionLayoutDependency}
      {...restCellProps}
    >
      {filterNode}
    </CellContainer>
  );
};

export default memo(HeadFilterCell);
