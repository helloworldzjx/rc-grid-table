import classNames from 'classnames';
import React, { CSSProperties, FC, memo, useMemo } from 'react';

import CellContainer from '../CellContainer';
import { useDataSortContext } from '../contexts';
import { useColumnSortableContext } from '../contexts/ColumnSortableContext';
import { useComponentsContext } from '../contexts/ComponentsContext';
import { useFixedShadowActive } from '../contexts/FixedShadowContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableContext } from '../contexts/TableContext';
import type { InternalColumnState } from '../internalInterface';
import { getComponentCls } from '../style/classNames';
import { mergeCellProps } from '../utils/cellProps';
import {
  isExpandColumn,
  isRowSortColumn,
  isSelectionColumn,
} from '../utils/const';
import { getDataSortColumnKey } from '../utils/dataSort';
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
  const { onHeadFilterRowCell } = useTableContext();

  const {
    cellCls,
    filterCellCls,
    headLastCellCls,
    dataSortActiveCellCls,
    selectionCellCls,
    rowSortCellCls,
    expandCellCls,
    columnSortableActiveCellCls,
    columnSortableHotCellCls,
    previewHiddenCellCls,
    previewRestoredCellCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
    fixedEndShadowActiveCellCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const { dataSortOrders = [] } = useDataSortContext();
  const { activeStatus, hotKeys } = useColumnSortableContext();
  const fixedShadowActive = useFixedShadowActive(fixedInfo);
  const inSortableActiveScope = activeStatus.keys.has(column.key);
  const inSortableHotScope = hotKeys.has(column.key);

  const CellComponent = useMemo(
    () =>
      getComponent(
        ['header', 'filterCell'],
        getComponent(['header', 'cell'], 'div'),
      ),
    [getComponent],
  );

  const cellProps = useMemo(
    () =>
      mergeCellProps(
        onHeadFilterRowCell?.(column, columnIndex),
        column.onHeadFilterRowCell?.(column, columnIndex),
      ),
    [column, columnIndex, onHeadFilterRowCell],
  );

  const mergedStyle = useMemo(() => {
    const style: CSSProperties = {};
    if (fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart;
    }
    if (fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd;
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

  const hasSortValue = useMemo(() => {
    const dataSortColumnKey = getDataSortColumnKey(column);
    return dataSortOrders.some((item) => item.columnKey === dataSortColumnKey);
  }, [column, dataSortOrders]);

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
          [dataSortActiveCellCls]: hasSortValue,
          [selectionCellCls]: isSelectionColumn(column),
          [rowSortCellCls]: isRowSortColumn(column),
          [expandCellCls]: isExpandColumn(column),
          [fixedStartCellCls]: fixedInfo.fixStart !== null,
          [fixedStartLastCellCls]: fixedInfo.fixedStartShadow,
          [fixedEndCellCls]: fixedInfo.fixEnd !== null,
          [fixedEndFirstCellCls]: fixedInfo.fixedEndShadow,
          [fixedStartShadowActiveCellCls]: fixedShadowActive.start,
          [fixedEndShadowActiveCellCls]: fixedShadowActive.end,
          [columnSortableActiveCellCls]: inSortableActiveScope,
          [columnSortableHotCellCls]: inSortableHotScope,
          [previewHiddenCellCls]: column.previewHidden,
          [previewRestoredCellCls]: column.previewRestored,
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
