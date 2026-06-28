import React, { PropsWithChildren, useMemo } from 'react';

import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { getComponentCls } from '../style/classNames';
import ExpandControl from './ExpandControl';

interface TreeCellControlProps<T = any> {
  rowData: T;
  rowIndex: number;
  indent: number;
  expanded: boolean;
  expandable: boolean;
}

function TreeCellControl<T = any>({
  rowData,
  rowIndex,
  indent,
  expanded,
  expandable,
  children,
}: PropsWithChildren<TreeCellControlProps<T>>) {
  const prefixCls = usePrefixClsContext();

  const { expandTreeControlCls, expandTreeContentCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  return (
    <>
      <div className={expandTreeControlCls}>
        <ExpandControl
          rowData={rowData}
          rowIndex={rowIndex}
          indent={indent}
          expanded={expanded}
          expandable={expandable}
        />
      </div>
      <div className={expandTreeContentCls}>{children}</div>
    </>
  );
}

export default TreeCellControl;
