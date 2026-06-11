import { Key, ReactNode } from 'react';

import { isValidKey } from '../../_utils/validate';
import type {
  ColumnSorter,
  ColumnState,
  DataSortConfig,
  DataSortOrder,
  DataSortOrderType,
  SortDirection,
  SortOrder,
} from '../interface';

export type ActiveDataSortOrder = DataSortOrder & { order: SortOrder };

type DataSortTitleRender<T = any> = {
  column?: ColumnState<T>;
  columnIndex: number;
  dataSort?: DataSortConfig;
  dataSortOrders: DataSortOrder[];
  hasSubColumns?: boolean;
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

export const isLeafColumn = <T>(column?: ColumnState<T> | null) =>
  !!column && !column.hasChildren && !column.children?.length;

export const getDataSortColumnKey = <T>(column: ColumnState<T>): Key =>
  column.key;

const collectLeafColumnMap = <T>(
  columns: ColumnState<T>[] = [],
): Map<Key, ColumnState<T>> => {
  const map = new Map<Key, ColumnState<T>>();

  const traverse = (items: ColumnState<T>[]) => {
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
  columns: ColumnState<T>[] = [],
  sortOrders: ActiveDataSortOrder[] = normalizeDataSortOrder(),
): ActiveDataSortOrder[] => {
  if (!columns.length || !sortOrders.length) return [];

  const columnMap = collectLeafColumnMap(columns);
  return sortOrders.filter((item) => !!columnMap.get(item.columnKey)?.sorter);
};

const getSortFunction = <T>(
  sorter: ColumnState<T>['sorter'],
): ColumnSorter<T> | null => {
  return typeof sorter === 'function' ? sorter : null;
};

export const sortDataSource = <T>(
  dataSource: T[] = [],
  columns: ColumnState<T>[] = [],
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

export const getDataSortTitleRender = <T>({
  column,
  columnIndex,
  dataSort,
  dataSortOrders,
  hasSubColumns,
}: DataSortTitleRender<T>) => {
  const canRenderDataSort =
    isLeafColumn(column) && !hasSubColumns && !!column?.sorter;

  if (!canRenderDataSort || !column) {
    return {
      hasSortRender: false,
      hasSortValue: false,
      sortRenderNode: undefined,
    };
  }

  const columnKey = getDataSortColumnKey(column);
  const sortIndex = dataSortOrders.findIndex(
    (item) => item.columnKey === columnKey,
  );
  const sortOrder = sortIndex >= 0 ? dataSortOrders[sortIndex].order : null;
  const sortDirections = column.sortDirections?.length
    ? column.sortDirections
    : DEFAULT_SORT_DIRECTIONS;
  const sortRender = column.sortRender ?? dataSort?.sortRender;
  const sortRenderNode = sortRender?.({
    columnKey,
    columnIndex,
    active: sortIndex >= 0,
    sortOrder,
    sortPriority: sortIndex >= 0 ? sortIndex + 1 : undefined,
    sortOrders: dataSortOrders,
    sortDirections,
  });

  return {
    hasSortRender: isRenderableNode(sortRenderNode),
    hasSortValue: sortIndex >= 0,
    sortRenderNode,
  };
};
