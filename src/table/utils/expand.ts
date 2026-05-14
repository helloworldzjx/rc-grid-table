import type { Key } from "react";

import type { ColumnType, ColumnsType, ExpandableConfig } from "../interface";
import { DEFAULT_EXPAND_COLUMN_WIDTH, EXPAND_COLUMN, INTERNAL_EXPAND_COLUMN_KEY, isExpandColumn } from "./const";

export interface FlattenRecord<T = any> {
  record: T;
  rowIndex: number;
  indent: number;
  key: Key;
}

export const getRecordKey = <T = any>(record: T, rowKey: string): Key => {
  return record?.[rowKey as keyof T] as Key;
};

export const getRecordChildren = <T = any>(record: T, childrenColumnName = 'children'): T[] => {
  const children = record?.[childrenColumnName as keyof T];
  return Array.isArray(children) ? children as T[] : [];
};

export const hasChildrenInData = <T = any>(dataSource: T[] = [], childrenColumnName = 'children'): boolean => {
  return dataSource.some((record) => {
    const children = getRecordChildren(record, childrenColumnName);
    return children.length > 0 || hasChildrenInData(children, childrenColumnName);
  });
};

export const flattenDataSource = <T = any>(
  dataSource: T[] = [],
  rowKey: string,
  childrenColumnName = 'children',
  expandedRowKeys: Key[] = [],
): FlattenRecord<T>[] => {
  const result: FlattenRecord<T>[] = [];

  const traverse = (records: T[], indent = 0) => {
    records.forEach((record) => {
      const key = getRecordKey(record, rowKey);
      const rowIndex = result.length;
      const children = getRecordChildren(record, childrenColumnName);

      result.push({
        record,
        rowIndex,
        indent,
        key,
      });

      if (children.length && expandedRowKeys.includes(key)) {
        traverse(children, indent + 1);
      }
    });
  };

  traverse(dataSource);
  return result;
};

export const getDefaultExpandedRowKeys = <T = any>(
  dataSource: T[] = [],
  rowKey: string,
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

      if (hasExpandedRowRender) {
        if (rowExpandable?.(record) !== false) {
          keys.push(key);
        }
        return;
      }

      if (children.length) {
        keys.push(key);
        traverse(children);
      }
    });
  };

  traverse(dataSource);
  return keys;
};

const removeExpandColumn = <T = any>(columns: ColumnsType<T>): ColumnsType<T> => {
  return columns.reduce((result: ColumnsType<T>, column) => {
    if (isExpandColumn(column)) {
      return result;
    }

    const realColumn = column as ColumnType<T>;
    if (realColumn.children?.length) {
      result.push({
        ...realColumn,
        children: removeExpandColumn(realColumn.children),
      } as ColumnType<T>);
    } else {
      result.push(realColumn as ColumnType<T>);
    }

    return result;
  }, []);
};

export const getColumnsWithExpandColumn = <T = any>(
  columns: ColumnsType<T> = [],
  expandable: ExpandableConfig<T> = {},
): ColumnsType<T> => {
  const {
    columnTitle,
    columnWidth = DEFAULT_EXPAND_COLUMN_WIDTH,
    expandedRowRender,
    fixed,
    showExpandColumn = true,
  } = expandable;
  const hasExpandedRowRender = typeof expandedRowRender === 'function';

  if (!hasExpandedRowRender || !showExpandColumn) {
    return removeExpandColumn(columns);
  }

  const expandColumn = {
    ...EXPAND_COLUMN,
    key: INTERNAL_EXPAND_COLUMN_KEY,
    title: columnTitle,
    width: columnWidth,
    fixed,
  } as ColumnType<T>;
  let inserted = false;
  const nextColumns = columns.reduce((result: ColumnsType<T>, column) => {
    if (isExpandColumn(column)) {
      result.push(expandColumn);
      inserted = true;
    } else {
      result.push(column);
    }

    return result;
  }, []);

  if (!inserted) {
    nextColumns.unshift(expandColumn);
  }

  return nextColumns;
};
