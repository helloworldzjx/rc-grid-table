import classNames from 'classnames';
import React, { MouseEvent, useCallback, useMemo } from 'react';

import { useExpandableContext } from '../expandableContext';
import type { ExpandIconProps as TableExpandIconProps } from '../interface';
import { usePrefixClsContext } from '../prefixClsContext';
import { getComponentCls } from '../style/classNames';

interface ExpandControlProps<T = any> {
  rowData: T;
  rowIndex: number;
  indent: number;
  expanded: boolean;
  expandable: boolean;
  spaced?: boolean;
}

function ExpandControl<T = any>({
  rowData,
  rowIndex,
  indent,
  expanded,
  expandable,
  spaced = false,
}: ExpandControlProps<T>) {
  const prefixCls = usePrefixClsContext();
  const { expandable: expandableConfig, onTriggerExpand } =
    useExpandableContext<T>();

  const {
    expandControlCls,
    expandIconCls,
    expandIconExpandedCls,
    expandIconSpacedCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const handleExpand = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (expandable) {
        onTriggerExpand?.(rowData);
      }
    },
    [expandable, onTriggerExpand, rowData],
  );

  const expandIconProps = useMemo<TableExpandIconProps<T>>(
    () => ({
      expanded,
      expandable,
      record: rowData,
      index: rowIndex,
      indent,
      onExpand: (_record, event) => handleExpand(event),
    }),
    [expandable, expanded, handleExpand, indent, rowData, rowIndex],
  );

  const iconNode = expandableConfig?.expandIcon ? (
    expandableConfig.expandIcon(expandIconProps)
  ) : (
    <button
      type="button"
      className={classNames(expandIconCls, {
        [expandIconExpandedCls]: expanded,
        [expandIconSpacedCls]: spaced || !expandable,
      })}
      aria-label={expanded ? 'Collapse row' : 'Expand row'}
      aria-expanded={expandable ? expanded : undefined}
      disabled={!expandable}
      onClick={handleExpand}
    />
  );

  return (
    <div
      className={expandControlCls}
      style={{ justifyContent: expandableConfig?.align ?? 'center' }}
    >
      {iconNode}
    </div>
  );
}

export default ExpandControl;
