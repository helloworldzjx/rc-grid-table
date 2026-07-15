import type { Key } from 'react';

import { isValidKey } from '../../_utils/validate';
import type { RowKey, RowSortChangeInfo, RowSortPlacement } from '../interface';
import { getRecordChildren, getRecordKey } from './record';
import { warningInvalidRecordKey } from './warning';

export interface RowSortEntity<T = any> {
  key: Key;
  record: T;
  siblingIndex: number;
  parentKey?: Key;
  parentPath: number[];
}

export type RowSortEntities<T = any> = ReadonlyMap<Key, RowSortEntity<T>>;

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
    records.forEach((record, siblingIndex) => {
      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row sorting', key);
        return;
      }
      const entity = {
        key,
        record,
        siblingIndex,
        parentKey,
        parentPath,
      };

      keyEntities.set(key, entity);

      const children = getRecordChildren(record, childrenColumnName);
      if (children.length) {
        traverse(children, key, [...parentPath, siblingIndex]);
      }
    });
  };

  traverse(dataSource);
  return keyEntities;
};

const getPathKey = (path: readonly number[]) => path.join('/');

const cloneRecordWithChildren = <T>(
  record: T,
  children: T[],
  childrenColumnName: string,
): T =>
  ({
    ...(record as object),
    [childrenColumnName]: children,
  } as T);

const createMutableTreeDraft = <T>(
  dataSource: T[],
  childrenColumnName: string,
) => {
  const nextDataSource = dataSource.slice();
  // Cache cloned sibling arrays so shared paths are copied only once.
  const siblingsMap = new Map<string, T[]>([['', nextDataSource]]);

  const getMutableSiblings = (parentPath: number[]) => {
    let siblings = nextDataSource;
    const currentPath: number[] = [];

    parentPath.forEach((pathIndex) => {
      currentPath.push(pathIndex);
      const pathKey = getPathKey(currentPath);
      let childSiblings = siblingsMap.get(pathKey);

      if (!childSiblings) {
        const parent = siblings[pathIndex];
        childSiblings = getRecordChildren(parent, childrenColumnName).slice();
        siblings[pathIndex] = cloneRecordWithChildren(
          parent,
          childSiblings,
          childrenColumnName,
        );
        siblingsMap.set(pathKey, childSiblings);
      }

      siblings = childSiblings;
    });

    return siblings;
  };

  return {
    dataSource: nextDataSource,
    getMutableSiblings,
  };
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
  entities: inputEntities,
}: {
  dataSource: T[];
  rowKey: RowKey<T>;
  childrenColumnName?: string;
  activeKey: Key;
  overKey: Key;
  placement: RowSortPlacement;
  allowCrossLevelSort?: boolean;
  entities?: RowSortEntities<T>;
}): { dataSource: T[]; info: RowSortChangeInfo<T> } | null => {
  if (activeKey === overKey) {
    return null;
  }

  const entities =
    inputEntities ?? getRowSortEntities(dataSource, rowKey, childrenColumnName);
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
      [...activeEntity.parentPath, activeEntity.siblingIndex],
      overEntity.parentPath,
    )
  ) {
    return null;
  }

  const sameParent = isSamePath(activeEntity.parentPath, overEntity.parentPath);
  const draft = createMutableTreeDraft(dataSource, childrenColumnName);
  const fromSiblings = draft.getMutableSiblings(activeEntity.parentPath);
  const toSiblings = sameParent
    ? fromSiblings
    : draft.getMutableSiblings(overEntity.parentPath);
  const [activeRecord] = fromSiblings.splice(activeEntity.siblingIndex, 1);

  if (!activeRecord) {
    return null;
  }

  let insertIndex = overEntity.siblingIndex;

  if (sameParent && activeEntity.siblingIndex < overEntity.siblingIndex) {
    insertIndex -= 1;
  }
  if (placement === 'after') {
    insertIndex += 1;
  }

  toSiblings.splice(insertIndex, 0, activeRecord);

  return {
    dataSource: draft.dataSource,
    info: {
      activeKey,
      overKey,
      activeRecord: activeEntity.record,
      overRecord: overEntity.record,
      fromParentKey: activeEntity.parentKey,
      toParentKey: overEntity.parentKey,
      fromSiblingIndex: activeEntity.siblingIndex,
      overSiblingIndex: overEntity.siblingIndex,
      toSiblingIndex: insertIndex,
      placement,
    },
  };
};
