import type { Key } from 'react';

import { isValidKey } from '../../_utils/validate';
import type { RowKey } from '../interface';

export interface FlattenRecord<T = any> {
  record: T;
  rowIndex: number;
  indent: number;
  key?: Key;
}

export const getRecordKey = <T = any>(
  record: T,
  rowKey: RowKey<T>,
): Key | undefined => {
  const key =
    typeof rowKey === 'function' ? rowKey(record) : record?.[rowKey as keyof T];
  return isValidKey(key) ? key : undefined;
};

export const getRecordChildren = <T = any>(
  record: T,
  childrenColumnName = 'children',
): T[] => {
  const children = record?.[childrenColumnName as keyof T];
  return Array.isArray(children) ? (children as T[]) : [];
};

export const hasChildrenInData = <T = any>(
  dataSource: T[] = [],
  childrenColumnName = 'children',
): boolean => {
  return dataSource.some((record) => {
    const children = getRecordChildren(record, childrenColumnName);
    return (
      children.length > 0 || hasChildrenInData(children, childrenColumnName)
    );
  });
};
