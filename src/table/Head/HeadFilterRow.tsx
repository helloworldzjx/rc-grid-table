import classNames from 'classnames';
import React, { FC, memo, useMemo } from 'react';

import { useComponentsContext } from '../componentsContext';
import useFixedInfo from '../hooks/useFixedInfo';
import useRenderedColumnLayout from '../hooks/useRenderedColumnLayout';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import HeadFilterCell from './HeadFilterCell';

const HeadFilterRow: FC = () => {
  const { flattenColumns = [], fixedOffset } = useRenderedColumnLayout();
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

  if (!hasFilter) {
    return null;
  }

  return (
    <RowComponent className={classNames(headRowCls, filterRowCls)}>
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
