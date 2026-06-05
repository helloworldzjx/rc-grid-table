import classNames from 'classnames';
import React, { FC, useMemo } from 'react';

import { useComponentsContext } from '../componentsContext';
import { useTableContext } from '../context';
import useFixedInfo from '../hooks/useFixedInfo';
import type { VirtualColumnsState } from '../hooks/useVirtualColumns';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import HeadFilterCell from './HeadFilterCell';

interface HeadFilterRowProps {
  rowIndex: number;
  virtualColumns: VirtualColumnsState;
}

const HeadFilterRow: FC<HeadFilterRowProps> = ({
  rowIndex,
  virtualColumns,
}) => {
  const { flattenColumns = [], fixedOffset } = useTableContext();
  const prefixCls = usePrefixClsContext();
  const { headRowCls, filterRowCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const { getComponent } = useComponentsContext();

  const fixedInfoList = useFixedInfo(flattenColumns, fixedOffset);

  const RowComponent = useMemo(
    () =>
      getComponent(
        ['header', 'filterRow'],
        getComponent(['header', 'row'], 'div'),
      ),
    [getComponent],
  );

  const hasFilter = useMemo(() => {
    return flattenColumns.some(
      (column) => typeof column.filterRender === 'function',
    );
  }, [flattenColumns]);

  const renderColumns = useMemo(() => {
    return virtualColumns.inVirtual
      ? virtualColumns.columns
      : flattenColumns.map((column, columnIndex) => ({ column, columnIndex }));
  }, [virtualColumns.inVirtual, virtualColumns.columns, flattenColumns]);

  if (!hasFilter) {
    return null;
  }

  return (
    <RowComponent className={classNames(headRowCls, filterRowCls)}>
      {renderColumns.map(({ column, columnIndex }) => (
        <HeadFilterCell
          key={column.key}
          column={column}
          columnIndex={columnIndex}
          rowIndex={rowIndex}
          fixedInfo={fixedInfoList[columnIndex]}
          last={columnIndex === flattenColumns.length - 1}
          virtualColumn={virtualColumns.inVirtual}
        />
      ))}
    </RowComponent>
  );
};

export default HeadFilterRow;
