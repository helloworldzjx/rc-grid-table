import type { Key } from 'react';

import type {
  ColumnType,
  ColumnsType,
  ExpandableConfig,
  RowSortableConfig,
  SizeType,
  TableRowSelection,
} from '../interface';
import {
  EXPAND_COLUMN,
  INTERNAL_EXPAND_COLUMN_KEY,
  INTERNAL_ROW_SORT_COLUMN_KEY,
  INTERNAL_SELECTION_COLUMN_KEY,
  ROW_SORT_COLUMN,
  SELECTION_COLUMN,
  getDefaultInternalColumnWidth,
  isExpandColumn,
  isRowSortColumn,
  isSelectionColumn,
} from './const';

export interface FlattenRecord<T = any> {
  record: T;
  rowIndex: number;
  indent: number;
  key: Key;
}

export const getRecordKey = <T = any>(record: T, rowKey: string): Key => {
  return record?.[rowKey as keyof T] as Key;
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

const removeInternalColumns = <T = any>(
  columns: ColumnsType<T>,
): ColumnsType<T> => {
  return columns.reduce((result: ColumnsType<T>, column) => {
    if (
      isExpandColumn(column) ||
      isSelectionColumn(column) ||
      isRowSortColumn(column)
    ) {
      return result;
    }

    const realColumn = column as ColumnType<T>;
    if (realColumn.children?.length) {
      result.push({
        ...realColumn,
        children: removeInternalColumns(realColumn.children),
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
  size?: SizeType,
): ColumnsType<T> => {
  const {
    columnTitle,
    columnWidth,
    expandedRowRender,
    fixed,
    resizeDisabled = true,
    resizeMinWidth,
    showExpandColumn = true,
  } = expandable;
  const hasExpandedRowRender = typeof expandedRowRender === 'function';

  if (!hasExpandedRowRender || !showExpandColumn) {
    return removeInternalColumns(columns).filter(
      (column) => !isSelectionColumn(column),
    );
  }

  const expandColumn = {
    ...EXPAND_COLUMN,
    key: INTERNAL_EXPAND_COLUMN_KEY,
    title: columnTitle,
    width: columnWidth ?? getDefaultInternalColumnWidth(size),
    fixed,
    resizeDisabled,
    resizeMinWidth,
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

export const getColumnsWithInternalColumns = <T = any>(
  columns: ColumnsType<T> = [],
  expandable: ExpandableConfig<T> = {},
  rowSelection?: TableRowSelection<T>,
  rowSortable?: RowSortableConfig<T>,
  size?: SizeType,
): ColumnsType<T> => {
  const {
    columnTitle,
    columnWidth,
    expandedRowRender,
    fixed,
    resizeDisabled = true,
    resizeMinWidth,
    showExpandColumn = true,
  } = expandable;
  const hasExpandedRowRender = typeof expandedRowRender === 'function';
  const shouldShowExpandColumn = hasExpandedRowRender && showExpandColumn;
  const shouldShowSelectionColumn = !!rowSelection;
  const shouldShowRowSortColumn = !!rowSortable;

  if (
    !shouldShowExpandColumn &&
    !shouldShowSelectionColumn &&
    !shouldShowRowSortColumn
  ) {
    return removeInternalColumns(columns);
  }

  const expandColumn = shouldShowExpandColumn
    ? ({
        ...EXPAND_COLUMN,
        key: INTERNAL_EXPAND_COLUMN_KEY,
        title: columnTitle,
        width: columnWidth ?? getDefaultInternalColumnWidth(size),
        fixed,
        resizeDisabled,
        resizeMinWidth,
      } as ColumnType<T>)
    : null;
  const selectionColumn = shouldShowSelectionColumn
    ? ({
        ...SELECTION_COLUMN,
        key: INTERNAL_SELECTION_COLUMN_KEY,
        title: '',
        width: rowSelection?.columnWidth ?? getDefaultInternalColumnWidth(size),
        fixed: rowSelection?.fixed,
        resizeDisabled: rowSelection?.resizeDisabled ?? true,
        resizeMinWidth: rowSelection?.resizeMinWidth,
        onCell: rowSelection?.onCell,
      } as ColumnType<T>)
    : null;
  const rowSortColumn = shouldShowRowSortColumn
    ? ({
        ...ROW_SORT_COLUMN,
        key: INTERNAL_ROW_SORT_COLUMN_KEY,
        title: rowSortable?.columnTitle,
        width: rowSortable?.columnWidth ?? getDefaultInternalColumnWidth(size),
        fixed: rowSortable?.fixed,
        resizeDisabled: true,
        resizeMinWidth: rowSortable?.resizeMinWidth,
      } as ColumnType<T>)
    : null;

  let expandInserted = false;
  let selectionInserted = false;
  let rowSortInserted = false;
  const nextColumns = columns.reduce((result: ColumnsType<T>, column) => {
    if (isRowSortColumn(column)) {
      if (rowSortColumn) {
        result.push(rowSortColumn);
        rowSortInserted = true;
      }
      return result;
    }

    if (isExpandColumn(column)) {
      if (expandColumn) {
        result.push(expandColumn);
        expandInserted = true;
      }
    } else if (isSelectionColumn(column)) {
      if (selectionColumn) {
        result.push(selectionColumn);
        selectionInserted = true;
      }
    } else {
      result.push(column);
    }

    return result;
  }, []);

  if (expandColumn && !expandInserted) {
    if (selectionColumn && selectionInserted) {
      const selectionIndex = nextColumns.findIndex(isSelectionColumn);
      nextColumns.splice(selectionIndex + 1, 0, expandColumn);
    } else {
      nextColumns.unshift(expandColumn);
    }
  }

  if (selectionColumn && !selectionInserted) {
    const expandIndex = nextColumns.findIndex(isExpandColumn);
    if (expandIndex >= 0) {
      nextColumns.splice(expandIndex, 0, selectionColumn);
    } else {
      nextColumns.unshift(selectionColumn);
    }
  }

  if (rowSortColumn && !rowSortInserted) {
    nextColumns.unshift(rowSortColumn);
  }

  return nextColumns;
};
