import classNames from 'classnames';
import React, { FC, memo, useMemo } from 'react';

import { useComponentsContext } from '../contexts/ComponentsContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableContext } from '../contexts/TableContext';
import useFixedInfo from '../hooks/useFixedInfo';
import useRenderedColumnLayout from '../hooks/useRenderedColumnLayout';
import { getComponentCls } from '../style/classNames';
import HeadFilterCell from './HeadFilterCell';

interface HeadFilterRowProps {
  headRowIndex: number;
}

const HeadFilterRow: FC<HeadFilterRowProps> = ({ headRowIndex }) => {
  const { flattenColumns = [], fixedOffset } = useRenderedColumnLayout();
  const { onHeaderFilterRow } = useTableContext();
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

  const rowProps = useMemo(() => {
    return onHeaderFilterRow?.(flattenColumns, headRowIndex);
  }, [onHeaderFilterRow, flattenColumns, headRowIndex]);

  if (!hasFilter) {
    return null;
  }

  return (
    <RowComponent
      {...rowProps}
      className={classNames(headRowCls, filterRowCls, rowProps?.className)}
    >
      {flattenColumns.map((column, columnIndex) => (
        <HeadFilterCell
          key={column.key}
          column={column}
          columnIndex={columnIndex}
          fixedInfo={fixedInfoList[columnIndex]}
          last={columnIndex === flattenColumns.length - 1}
        />
      ))}
    </RowComponent>
  );
};

export default memo(HeadFilterRow);
