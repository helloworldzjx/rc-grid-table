import type { Key } from 'react';

import { isValidKey } from '../../_utils/validate';
import type { BodyItem } from '../Body/interface';
import type { ExpandableConfig, RowKey } from '../interface';
import { getRecordChildren, getRecordKey } from './expand';

interface GetBodyItemsOptions<T = any> {
  dataSource?: T[];
  rowKey: RowKey<T>;
  childrenColumnName: string;
  expandedRowKeySet: Set<Key>;
  preservedExpandedRowKeySet?: Set<Key>;
  expandable?: ExpandableConfig<T>;
  hasExpandedRowRender: boolean;
  isTreeMode: boolean;
}

interface BodyItemsResult<T = any> {
  bodyItems: BodyItem<T>[];
  rowDataItemCount: number;
  hasTreeData: boolean;
}

export const getBodyItems = <T = any>({
  dataSource,
  rowKey,
  childrenColumnName,
  expandedRowKeySet,
  preservedExpandedRowKeySet,
  expandable,
  hasExpandedRowRender,
  isTreeMode,
}: GetBodyItemsOptions<T>): BodyItemsResult<T> => {
  const bodyItems: BodyItem<T>[] = [];
  let rowDataItemCount = 0;
  let hasTreeData = false;

  const appendRecord = (rowData: T, indent: number) => {
    const key = getRecordKey(rowData, rowKey);
    const rowIndex = rowDataItemCount;
    rowDataItemCount += 1;

    const hasValidKey = isValidKey(key);
    const rowReactKey = hasValidKey ? key : rowIndex;
    const expanded = hasValidKey ? expandedRowKeySet.has(key) : false;
    const preservedExpanded =
      hasValidKey && !!preservedExpandedRowKeySet?.has(key);
    const children = isTreeMode
      ? getRecordChildren(rowData, childrenColumnName)
      : [];
    const treeExpandable = isTreeMode && children.length > 0;
    const rowExpandable = hasExpandedRowRender
      ? expandable?.rowExpandable?.(rowData) !== false
      : treeExpandable;

    if (treeExpandable) {
      hasTreeData = true;
    }

    bodyItems.push({
      type: 'row',
      key: `row-${rowReactKey}`,
      reactKey: rowReactKey,
      record: rowData,
      rowIndex,
      indent,
      rowKeyValue: key,
      expanded,
      treeExpandable,
      rowExpandable,
      invalidRowKey: !hasValidKey,
    });

    if (
      hasExpandedRowRender &&
      rowExpandable &&
      (expanded || preservedExpanded)
    ) {
      const expandedRowClassName =
        typeof expandable?.expandedRowClassName === 'function'
          ? expandable.expandedRowClassName(rowData, rowIndex, indent)
          : expandable?.expandedRowClassName;

      bodyItems.push({
        type: 'expanded',
        key: `expanded-${rowReactKey}`,
        reactKey: `${rowReactKey}-expanded`,
        record: rowData,
        rowIndex,
        indent,
        expanded,
        className: expandedRowClassName,
      });
    }

    if (treeExpandable && hasValidKey && expanded) {
      children.forEach((record) => appendRecord(record, indent + 1));
    }
  };

  dataSource?.forEach((record) => appendRecord(record, 0));

  return {
    bodyItems,
    rowDataItemCount,
    hasTreeData: isTreeMode && hasTreeData,
  };
};
