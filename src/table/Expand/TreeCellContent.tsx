import React, { ReactNode, useMemo } from 'react';

import { useExpandableContext } from '../expandableContext';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';
import ExpandControl from './ExpandControl';

interface TreeCellContentProps<T = any> {
  children?: ReactNode;
  rowData: T;
  rowIndex: number;
  indent: number;
  expanded: boolean;
  expandable: boolean;
}

function TreeCellContent<T = any>({
  children,
  rowData,
  rowIndex,
  indent,
  expanded,
  expandable,
}: TreeCellContentProps<T>) {
  const prefixCls = usePrefixClsContext();
  const { expandable: expandableConfig } = useExpandableContext<T>();

  const { expandTreeCellInnerCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  return (
    <div
      className={expandTreeCellInnerCls}
      style={{
        paddingInlineStart: indent * (expandableConfig?.indentSize ?? 15),
      }}
    >
      <ExpandControl
        rowData={rowData}
        rowIndex={rowIndex}
        indent={indent}
        expanded={expanded}
        expandable={expandable}
        spaced
      />
      <div>{children}</div>
    </div>
  );
}

export default TreeCellContent;
