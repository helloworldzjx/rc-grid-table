import { Key, ReactNode } from 'react';

import { isValidKey } from '../../_utils/validate';
import type {
  ColumnSorter,
  DataSortConfig,
  DataSortOrder,
  DataSortOrderType,
  SortDirection,
  SortOrder,
} from '../interface';
import type { InternalColumnState } from '../internalInterface';

export type ActiveDataSortOrder = DataSortOrder & { order: SortOrder };

type DataSortHeaderRender<T = any> = {
  column?: InternalColumnState<T>;
  columnIndex: number;
  dataSort?: DataSortConfig;
  dataSortOrders: DataSortOrder[];
};

type DataSortHeaderActive<T = any> = {
  column?: InternalColumnState<T>;
  flattenColumns: InternalColumnState<T>[];
  sortActiveKeySet: ReadonlySet<Key>;
};

export const DEFAULT_SORT_DIRECTIONS: SortDirection[] = [
  'ascend',
  'descend',
  null,
];

export const normalizeDataSortOrder = (
  sortOrder?: DataSortOrderType,
): ActiveDataSortOrder[] => {
  const list = Array.isArray(sortOrder)
    ? sortOrder
    : sortOrder
    ? [sortOrder]
    : [];

  return list.filter(
    (item): item is ActiveDataSortOrder =>
      !!item &&
      isValidKey(item.columnKey) &&
      (item.order === 'ascend' || item.order === 'descend'),
  );
};

export const isLeafColumn = <T>(column?: InternalColumnState<T> | null) =>
  !!column && !column.hasChildren && !column.children?.length;

export const getDataSortColumnKey = <T>(column: InternalColumnState<T>): Key =>
  column.key;

const collectLeafColumnMap = <T>(
  columns: InternalColumnState<T>[] = [],
): Map<Key, InternalColumnState<T>> => {
  const map = new Map<Key, InternalColumnState<T>>();

  const traverse = (items: InternalColumnState<T>[]) => {
    items.forEach((column) => {
      if (isLeafColumn(column)) {
        map.set(getDataSortColumnKey(column), column);
      } else if (column.children?.length) {
        traverse(column.children);
      }
    });
  };

  traverse(columns);
  return map;
};

export const filterLeafDataSortOrder = <T>(
  columns: InternalColumnState<T>[] = [],
  sortOrders: ActiveDataSortOrder[] = normalizeDataSortOrder(),
): ActiveDataSortOrder[] => {
  if (!columns.length || !sortOrders.length) return [];

  const columnMap = collectLeafColumnMap(columns);
  return sortOrders.filter((item) => !!columnMap.get(item.columnKey)?.sorter);
};

const getSortFunction = <T>(
  sorter: InternalColumnState<T>['sorter'],
): ColumnSorter<T> | null => {
  return typeof sorter === 'function' ? sorter : null;
};

export const sortDataSource = <T>(
  dataSource: T[] = [],
  columns: InternalColumnState<T>[] = [],
  sortOrders = normalizeDataSortOrder(),
): T[] => {
  if (!dataSource.length || !sortOrders.length) return dataSource;

  const columnMap = collectLeafColumnMap(columns);
  const activeSorters = sortOrders.reduce<
    {
      order: 'ascend' | 'descend';
      sorter: ColumnSorter<T>;
    }[]
  >((result, sortItem) => {
    const column = columnMap.get(sortItem.columnKey);
    const sorter = getSortFunction(column?.sorter);
    if (!sorter) return result;

    result.push({
      order: sortItem.order,
      sorter,
    });
    return result;
  }, []);

  if (!activeSorters.length) return dataSource;

  return dataSource
    .map((record, index) => ({ record, index }))
    .sort((a, b) => {
      for (const { order, sorter } of activeSorters) {
        const result = sorter(a.record, b.record);
        if (result && !Number.isNaN(result)) {
          return order === 'ascend' ? result : -result;
        }
      }

      return a.index - b.index;
    })
    .map(({ record }) => record);
};

const isRenderableNode = (node: ReactNode) =>
  node !== undefined && node !== null && typeof node !== 'boolean';

export const getDataSortOrderState = (
  columnKey: Key,
  dataSortOrders: DataSortOrder[] = [],
) => {
  const sortIndex = dataSortOrders.findIndex(
    (item) => item.columnKey === columnKey,
  );
  const active = sortIndex >= 0;

  return {
    active,
    sortIndex,
    sortOrder: active ? dataSortOrders[sortIndex].order : null,
    sortPriority: active ? sortIndex + 1 : undefined,
  };
};

export const isDataSortHeaderActive = <T>({
  column,
  flattenColumns,
  sortActiveKeySet,
}: DataSortHeaderActive<T>) => {
  if (!column) return false;

  const columnKey = getDataSortColumnKey(column);

  if (column.hasChildren) {
    return flattenColumns.some(
      (item) =>
        item.ancestorKeys?.includes(columnKey) &&
        sortActiveKeySet.has(getDataSortColumnKey(item)),
    );
  }

  return sortActiveKeySet.has(columnKey);
};

export const getDataSortHeaderRender = <T>({
  column,
  columnIndex,
  dataSort,
  dataSortOrders,
}: DataSortHeaderRender<T>) => {
  if (!isLeafColumn(column) || !column?.sorter) {
    return {
      hasSortRender: false,
      sortRenderNode: undefined,
    };
  }

  const columnKey = getDataSortColumnKey(column);
  const sortState = getDataSortOrderState(columnKey, dataSortOrders);
  const sortDirections = column.sortDirections?.length
    ? column.sortDirections
    : DEFAULT_SORT_DIRECTIONS;
  const sortRender = column.sortRender ?? dataSort?.sortRender;
  const sortRenderNode = sortRender?.({
    columnKey,
    columnIndex,
    active: sortState.active,
    sortOrder: sortState.sortOrder,
    sortPriority: sortState.sortPriority,
    sortOrders: dataSortOrders,
    sortDirections,
  });

  return {
    hasSortRender: isRenderableNode(sortRenderNode),
    sortRenderNode,
  };
};
