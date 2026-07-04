import type { Key } from 'react';

import { isValidKey } from '../../_utils/validate';
import type { ExpandableConfig, RowKey } from '../interface';
import { getRecordChildren, getRecordKey } from './record';
import { warningInvalidRecordKey } from './warning';

export const getDefaultExpandedRowKeys = <T = any>(
  dataSource: T[] = [],
  rowKey: RowKey<T>,
  expandable: ExpandableConfig<T> = {},
): Key[] => {
  const {
    childrenColumnName = 'children',
    expandedRowRender,
    rowExpandable,
  } = expandable;
  const keys: Key[] = [];
  const hasExpandedRowRender = typeof expandedRowRender === 'function';

  const traverse = (records: T[]) => {
    records.forEach((record) => {
      const key = getRecordKey(record, rowKey);
      const children = getRecordChildren(record, childrenColumnName);
      const validKey = isValidKey(key);

      if (hasExpandedRowRender) {
        if (!validKey && rowExpandable?.(record) !== false) {
          warningInvalidRecordKey(rowKey, 'default expanded rows', key);
        }
        if (validKey && rowExpandable?.(record) !== false) {
          keys.push(key);
        }
        return;
      }

      if (!validKey && children.length) {
        warningInvalidRecordKey(rowKey, 'default expanded rows', key);
      }
      if (validKey && children.length) {
        keys.push(key);
        traverse(children);
      }
    });
  };

  traverse(dataSource);
  return keys;
};
