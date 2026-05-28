import type { Key } from 'react';

import { isValidKey } from '../../_utils/validate';
import type { RowKey, RowSortChangeInfo, RowSortPlacement } from '../interface';
import { getRecordChildren, getRecordKey } from './expand';
import { warningInvalidRecordKey } from './warning';

export interface RowSortEntity<T = any> {
  key: Key;
  record: T;
  index: number;
  parentKey?: Key;
  parentPath: number[];
}

const cloneRecords = <T>(records: T[], childrenColumnName: string): T[] =>
  records.map((record) => {
    const children = getRecordChildren(record, childrenColumnName);
    if (!children.length) {
      return record;
    }

    return {
      ...(record as object),
      [childrenColumnName]: cloneRecords(children, childrenColumnName),
    } as T;
  });

export const getRowSortEntities = <T = any>(
  dataSource: T[] = [],
  rowKey: RowKey<T>,
  childrenColumnName = 'children',
) => {
  const keyEntities = new Map<Key, RowSortEntity<T>>();

  const traverse = (
    records: T[],
    parentKey?: Key,
    parentPath: number[] = [],
  ) => {
    records.forEach((record, index) => {
      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row sorting', key);
        return;
      }
      const entity = {
        key,
        record,
        index,
        parentKey,
        parentPath,
      };

      keyEntities.set(key, entity);

      const children = getRecordChildren(record, childrenColumnName);
      if (children.length) {
        traverse(children, key, [...parentPath, index]);
      }
    });
  };

  traverse(dataSource);
  return keyEntities;
};

const getMutableSiblings = <T>(
  dataSource: T[],
  parentPath: number[],
  childrenColumnName: string,
) => {
  let siblings = dataSource;

  parentPath.forEach((pathIndex) => {
    const parent = siblings[pathIndex] as Record<string, unknown>;
    const children = parent?.[childrenColumnName];
    siblings = Array.isArray(children) ? (children as T[]) : [];
  });

  return siblings;
};

const isSamePath = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const isDescendantOrSelfPath = (
  parentPath: number[],
  maybeDescendantPath: number[],
) =>
  parentPath.length <= maybeDescendantPath.length &&
  parentPath.every((value, index) => value === maybeDescendantPath[index]);

export const reorderDataSource = <T = any>({
  dataSource,
  rowKey,
  childrenColumnName = 'children',
  activeKey,
  overKey,
  placement,
  allowCrossLevelSort = false,
}: {
  dataSource: T[];
  rowKey: RowKey<T>;
  childrenColumnName?: string;
  activeKey: Key;
  overKey: Key;
  placement: RowSortPlacement;
  allowCrossLevelSort?: boolean;
}): { dataSource: T[]; info: RowSortChangeInfo<T> } | null => {
  if (activeKey === overKey) {
    return null;
  }

  const entities = getRowSortEntities(dataSource, rowKey, childrenColumnName);
  const activeEntity = entities.get(activeKey);
  const overEntity = entities.get(overKey);

  if (!activeEntity || !overEntity) {
    return null;
  }

  if (!allowCrossLevelSort && activeEntity.parentKey !== overEntity.parentKey) {
    return null;
  }

  if (
    allowCrossLevelSort &&
    isDescendantOrSelfPath(
      [...activeEntity.parentPath, activeEntity.index],
      overEntity.parentPath,
    )
  ) {
    return null;
  }

  const nextDataSource = cloneRecords(dataSource, childrenColumnName);
  const sameParent = isSamePath(activeEntity.parentPath, overEntity.parentPath);
  const fromSiblings = getMutableSiblings(
    nextDataSource,
    activeEntity.parentPath,
    childrenColumnName,
  );
  const toSiblings = sameParent
    ? fromSiblings
    : getMutableSiblings(
        nextDataSource,
        overEntity.parentPath,
        childrenColumnName,
      );
  const [activeRecord] = fromSiblings.splice(activeEntity.index, 1);

  if (!activeRecord) {
    return null;
  }

  let insertIndex = overEntity.index;

  if (sameParent && activeEntity.index < overEntity.index) {
    insertIndex -= 1;
  }
  if (placement === 'after') {
    insertIndex += 1;
  }

  toSiblings.splice(insertIndex, 0, activeRecord);

  return {
    dataSource: nextDataSource,
    info: {
      activeKey,
      overKey,
      activeRecord: activeEntity.record,
      overRecord: overEntity.record,
      fromParentKey: activeEntity.parentKey,
      toParentKey: overEntity.parentKey,
      fromIndex: activeEntity.index,
      toIndex: insertIndex,
      placement,
    },
  };
};
