import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';

import { useExpandableContext } from '../contexts/ExpandableContext';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import type { ExpandIconProps as TableExpandIconProps } from '../interface';
import { getComponentCls } from '../style/classNames';

interface ExpandControlProps<T = any> {
  rowData: T;
  rowIndex: number;
  indent: number;
  expanded: boolean;
  expandable: boolean;
}

function ExpandControl<T = any>({
  rowData,
  rowIndex,
  indent,
  expanded,
  expandable,
}: ExpandControlProps<T>) {
  const prefixCls = usePrefixClsContext();
  const { expandable: expandableConfig, onTriggerExpand } =
    useExpandableContext<T>();

  const { expandControlCls, expandControlExpandedCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const handleExpand = useCallback(() => {
    if (expandable) {
      onTriggerExpand?.(rowData);
    }
  }, [expandable, onTriggerExpand, rowData]);

  const expandIconProps = useMemo<TableExpandIconProps<T>>(
    () => ({
      expanded,
      expandable,
      record: rowData,
      index: rowIndex,
      indent,
      onExpand: () => handleExpand(),
    }),
    [expandable, expanded, handleExpand, indent, rowData, rowIndex],
  );

  const iconNode = expandableConfig?.expandIcon ? (
    expandableConfig.expandIcon(expandIconProps)
  ) : (
    <svg
      viewBox="0 0 16 16"
      focusable="false"
      aria-hidden="true"
      fill="currentColor"
      stroke="currentColor"
      width="1em"
      height="1em"
    >
      <line
        x1="4"
        y1="8"
        x2="12"
        y2="8"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="4"
        x2="8"
        y2="12"
        strokeWidth={1.5}
        strokeLinecap="round"
        display={expanded ? 'none' : 'inline'}
      />
    </svg>
  );

  return (
    <button
      type="button"
      className={classNames(expandControlCls, {
        [expandControlExpandedCls]: expanded,
      })}
      aria-label={expanded ? 'Collapse row' : 'Expand row'}
      aria-expanded={expandable ? expanded : undefined}
      disabled={!expandable}
      onClick={handleExpand}
    >
      {iconNode}
    </button>
  );
}

export default ExpandControl;
