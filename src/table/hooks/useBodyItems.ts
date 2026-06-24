import { useEffect, useMemo, useState, type Key } from 'react';

import { isValidKey } from '../../_utils/validate';
import type { BodyItem } from '../Body/interface';
import type { ExpandableConfig, RowKey } from '../interface';
import { getBodyItems } from '../utils/bodyItems';

interface UseBodyItemsProps<T = any> {
  dataSource?: T[];
  rowKey: RowKey<T>;
  childrenColumnName: string;
  mergedExpandedRowKeys: Key[];
  expandable?: ExpandableConfig<T>;
  hasExpandedRowRender: boolean;
  isTreeMode: boolean;
}

const getExpandableBodyRowKeySet = <T>(bodyItems: BodyItem<T>[]) => {
  const keySet = new Set<Key>();

  bodyItems.forEach((item) => {
    if (
      item.type === 'row' &&
      item.rowExpandable &&
      !item.invalidRowKey &&
      isValidKey(item.rowKeyValue)
    ) {
      keySet.add(item.rowKeyValue);
    }
  });

  return keySet;
};

export default function useBodyItems<T = any>({
  dataSource,
  rowKey,
  childrenColumnName,
  mergedExpandedRowKeys,
  expandable,
  hasExpandedRowRender,
  isTreeMode,
}: UseBodyItemsProps<T>) {
  const expandedRowKeySet = useMemo(
    () => new Set(mergedExpandedRowKeys),
    [mergedExpandedRowKeys],
  );

  const baseBodyItemsResult = useMemo(
    () =>
      getBodyItems({
        dataSource,
        rowKey,
        childrenColumnName,
        expandedRowKeySet,
        expandable,
        hasExpandedRowRender,
        isTreeMode,
      }),
    [
      childrenColumnName,
      dataSource,
      expandable,
      expandedRowKeySet,
      hasExpandedRowRender,
      isTreeMode,
      rowKey,
    ],
  );
  const { bodyItems } = baseBodyItemsResult;

  const expandableBodyRowKeySet = useMemo(
    () => getExpandableBodyRowKeySet(bodyItems),
    [bodyItems],
  );
  const [preservedExpandedRowKeySet, setPreservedExpandedRowKeySet] = useState<
    Set<Key>
  >(() => new Set());

  useEffect(() => {
    setPreservedExpandedRowKeySet((prev) => {
      if (!hasExpandedRowRender) {
        return prev.size ? new Set() : prev;
      }

      let changed = false;
      const next = new Set<Key>();

      prev.forEach((key) => {
        if (expandableBodyRowKeySet.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      });

      mergedExpandedRowKeys.forEach((key) => {
        if (expandableBodyRowKeySet.has(key) && !next.has(key)) {
          next.add(key);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [expandableBodyRowKeySet, hasExpandedRowRender, mergedExpandedRowKeys]);

  const hasCollapsedPreservedExpandedRow = useMemo(() => {
    let hasCollapsed = false;

    preservedExpandedRowKeySet.forEach((key) => {
      if (!expandedRowKeySet.has(key)) {
        hasCollapsed = true;
      }
    });

    return hasCollapsed;
  }, [expandedRowKeySet, preservedExpandedRowKeySet]);

  const normalBodyItems = useMemo(() => {
    if (!hasCollapsedPreservedExpandedRow) {
      return bodyItems;
    }

    return getBodyItems({
      dataSource,
      rowKey,
      childrenColumnName,
      expandedRowKeySet,
      preservedExpandedRowKeySet,
      expandable,
      hasExpandedRowRender,
      isTreeMode,
    }).bodyItems;
  }, [
    bodyItems,
    childrenColumnName,
    dataSource,
    expandable,
    expandedRowKeySet,
    hasCollapsedPreservedExpandedRow,
    hasExpandedRowRender,
    isTreeMode,
    preservedExpandedRowKeySet,
    rowKey,
  ]);

  return useMemo(
    () => ({
      ...baseBodyItemsResult,
      normalBodyItems,
    }),
    [baseBodyItemsResult, normalBodyItems],
  );
}
