import { isValidElement, Key, type ReactNode } from 'react';

import { isNum, isValidColumnKey } from '../../_utils/validate';
import type {
  CellType,
  ColumnState,
  ColumnsType,
  ColumnType,
  PercentColumnWidthType,
  SizeType,
} from '../interface';
import {
  DEFAULT_RESIZE_MIN_WIDTH,
  getDefaultInternalColumnWidth,
  isInternalColumn,
  storageKeys,
} from './const';
import { warningFallbackColumnKey, warningInvalidColumnKey } from './warning';

export const getEllipsisTitle = (children: ReactNode) => {
  let title = children;
  if (typeof children === 'string' || typeof children === 'number') {
    title = children.toString();
  } else if (
    isValidElement(children) &&
    typeof children.props.children === 'string'
  ) {
    title = children?.props?.children;
  }

  return title;
};

export const getColumnKey = (
  column: { key?: unknown; dataIndex?: unknown },
  index: number,
): Key => {
  warningInvalidColumnKey(column);

  if (isValidColumnKey(column.key)) return column.key;
  if (isValidColumnKey(column.dataIndex)) return column.dataIndex;

  warningFallbackColumnKey(column);

  return index;
};

export const filterSpan = (span?: number) => {
  if (isNum(span)) {
    const realSpan = Math.floor(span);
    if (realSpan === 0) {
      return false;
    }
  }

  return true;
};

export const getCellSpan = (span?: number) => {
  if (!isNum(span)) return 1;

  const realSpan = Math.floor(span);
  if (realSpan === 0) return 0;

  return Math.max(realSpan, 1);
};

export const filterCellSpan = (span?: {
  rowSpan?: number;
  colSpan?: number;
}) => {
  const { rowSpan, colSpan } = span || {};
  return filterSpan(rowSpan) && filterSpan(colSpan);
};

const parseColumnWidth = (
  width: number | string | undefined,
  containerWidth: number,
) => {
  if (isNum(width)) {
    return width;
  }

  if (typeof width === 'string') {
    if (!width.endsWith('%')) return undefined;

    const percent = Number.parseFloat(width.slice(0, -1));
    if (!isNum(percent)) return undefined;

    const parsedWidth = (percent / 100) * containerWidth;
    return parseFloat(parsedWidth.toFixed(2));
  }

  return undefined;
};

const getEffectiveResizeMinWidth = (
  resizeMinWidth: PercentColumnWidthType | number | undefined,
  width: number,
  containerWidth: number,
) => {
  const minWidth =
    parseColumnWidth(resizeMinWidth, containerWidth) ??
    DEFAULT_RESIZE_MIN_WIDTH;

  return Math.min(minWidth, width);
};

export function parseHeaderRows<T>(
  columns: ColumnState<T>[] = [],
): CellType<T>[][] {
  const rows: CellType<T>[][] = [];

  function fillRowCells(
    cols: ColumnState<T>[],
    colIndex: number,
    rowIndex: number = 0,
  ): number[] {
    // Init rows
    rows[rowIndex] = rows[rowIndex] || [];

    let currentColIndex = colIndex;
    const colSpans: number[] = cols.map((column) => {
      const cell: CellType<T> = {
        key: column.key,
        children: column.title,
        column,
        colStart: currentColIndex,
      };

      let colSpan: number = 1;

      const subColumns = column.children;
      if (subColumns && subColumns.length > 0) {
        colSpan = fillRowCells(
          subColumns,
          currentColIndex,
          rowIndex + 1,
        ).reduce((total, count) => total + count, 0);
        cell.hasSubColumns = true;
      }

      if ('colSpan' in column) {
        ({ colSpan = 1 } = column);
      }

      if ('rowSpan' in column) {
        cell.rowSpan = column.rowSpan;
      }

      cell.colSpan = colSpan;
      cell.colEnd = (cell.colStart as number) + colSpan - 1;
      rows[rowIndex].push(cell);

      currentColIndex += colSpan;

      return colSpan;
    });

    return colSpans;
  }

  // Generate `rows` cell data
  fillRowCells(columns, 0);

  // Handle `rowSpan`
  const rowCount = rows.length;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rows[rowIndex].forEach((cell) => {
      if (!('rowSpan' in cell) && !cell.hasSubColumns) {
        cell.rowSpan = rowCount - rowIndex;
      }
    });
  }

  return rows;
}

export function filterColumns<T = any>(
  size: SizeType,
  columns: ColumnsType<T>,
  parentKey: Key = '',
  ancestorKeys: Key[] = [],
  depth = 0,
) {
  if (!Array.isArray(columns)) return [];

  return columns.reduce(
    (result: ColumnState<T>[], column: ColumnType<T>, index: number) => {
      if (isInternalColumn(column)) {
        const width = column.width ?? getDefaultInternalColumnWidth(size);
        result.push({
          ...column,
          title: column.title ?? '',
          width,
          parentKey,
          ancestorKeys,
          depth,
          order: index,
          visible: true,
          distribute: false,
          widthManuallyChanged: false,
          autoWidthLocked: false,
          hasChildren: false,
          children: [],
        } as ColumnState<T>);
        return result;
      }

      const currentKey = getColumnKey(column, index);
      if (
        column.hidden === true ||
        (column.children?.length &&
          column.children?.every((subColumn) => subColumn.hidden))
      )
        return result;
      let children: ColumnsType<T> = [];
      if (column.children?.length) {
        children = filterColumns(
          size,
          column.children,
          currentKey,
          [...ancestorKeys, currentKey],
          depth + 1,
        );
      }

      const newNode = {
        ...column,
        key: currentKey,
        parentKey,
        ancestorKeys,
        depth,
      };
      if (children.length) newNode.children = children;
      result.push(newNode as ColumnState<T>);
      return result;
    },
    [],
  );
}

export function parseMiddleState(input: ColumnState[]) {
  return JSON.parse(JSON.stringify(input, storageKeys));
}

/**
 * 展平middleState数组
 * @param columns middleState
 * @returns 展平后的middleState数组
 */
export function flattenMiddleState(middleState: ColumnState[]): ColumnState[] {
  return middleState.reduce((result: ColumnState[], state) => {
    if (state.hasChildren) {
      result.push(...flattenMiddleState(state.children as ColumnState[]));
    }
    result.push(state);

    return result;
  }, []);
}

/**
 * 展平columns数组，只保留没有children的列
 * @param columns 列数组
 * @returns 展平后的叶子列数组
 */
export function flattenColumnsWithFilterChildren<T>(
  columns: ColumnsType<T>,
): ColumnsType<T> {
  const result: ColumnsType<T> = [];

  function traverse(cols: ColumnsType<T>) {
    cols.forEach((column) => {
      if (column.children && column.children.length > 0) {
        traverse(column.children);
      } else {
        result.push(column);
      }
    });
  }

  traverse(columns);
  return result;
}

export type FnColumnType<T> = Partial<Omit<ColumnState<T>, 'width'>> & {
  width?: ColumnType<T>['width'];
};

export function flattenColumnsWithTotalWidth<T>(
  containerWidth: number,
  columns: FnColumnType<T>[],
  topMinWidth: number,
  leafMinWidth: number,
  size?: SizeType,
): { flattenColumns: ColumnState<T>[]; usedWidthTotal: number } {
  const result: ColumnState<T>[] = [];
  let usedWidthTotal = 0;

  function traverse(
    cols: FnColumnType<T>[],
    parentKey: Key = '',
    ancestorKeys: Key[] = [],
    depth: number = 0,
  ) {
    cols.forEach((column, index) => {
      if (isInternalColumn(column)) {
        const defaultWidth = getDefaultInternalColumnWidth(size);
        const width =
          parseColumnWidth(column.width, containerWidth) ?? defaultWidth;
        usedWidthTotal += width;

        result.push({
          ...column,
          width,
          resizeMinWidth: getEffectiveResizeMinWidth(
            column.resizeMinWidth,
            width,
            containerWidth,
          ),
          parentKey,
          ancestorKeys,
          depth,
          order: index,
          visible: true,
          distribute: false,
          widthManuallyChanged: false,
          autoWidthLocked: false,
          hasChildren: false,
          children: [],
        } as ColumnState<T>);
        return;
      }

      if (
        column.hidden ||
        !(column.visible ?? true) ||
        (column.children?.length &&
          column.children.every(
            (subColumn) => subColumn.hidden || !(subColumn.visible ?? true),
          ))
      ) {
        return;
      }

      const currentKey = getColumnKey(column, index);

      const hasChildren = !!column.children?.length;

      if (hasChildren) {
        traverse(
          column.children as FnColumnType<T>[],
          currentKey,
          [...ancestorKeys, currentKey],
          depth + 1,
        );
      }

      let width: number | undefined = undefined;
      let resizeMinWidth: number | undefined = undefined;
      let distribute = false;
      let widthManuallyChanged = false;
      let autoWidthLocked = false;

      if (!hasChildren) {
        width = parseColumnWidth(column.width, containerWidth);
        if (!isNum(width)) {
          distribute = true;
          width = depth === 0 ? topMinWidth : leafMinWidth;
        }
        usedWidthTotal += width;

        resizeMinWidth =
          typeof width === 'number'
            ? getEffectiveResizeMinWidth(
                column.resizeMinWidth,
                width,
                containerWidth,
              )
            : column.resizeMinWidth;

        widthManuallyChanged = column.resizeDisabled
          ? false
          : !!column.widthManuallyChanged;

        autoWidthLocked = column.resizeDisabled
          ? false
          : !!column.autoWidthLocked || widthManuallyChanged;

        distribute = column.resizeDisabled
          ? false
          : autoWidthLocked
          ? false
          : distribute;
      }

      result.push({
        ...column,
        width,
        resizeMinWidth,
        key: currentKey,
        parentKey,
        ancestorKeys,
        depth,
        order: isNum(column.order) ? column.order : index,
        visible: column.visible ?? true,
        distribute,
        widthManuallyChanged,
        autoWidthLocked,
        hasChildren,
        children: [],
      });
    });
  }

  traverse(columns);

  return {
    flattenColumns: result,
    usedWidthTotal,
  };
}

export function rebuildColumns<T>(
  flattenedColumns: ColumnState<T>[],
): ColumnState<T>[] {
  const columns = flattenedColumns.slice();
  // 创建节点映射表
  const columnMap = new Map<Key, ColumnState<T>>();
  const rootColumns: ColumnState<T>[] = [];

  // 先按深度排序确保父节点先处理
  columns.sort((a, b) => a.depth - b.depth);

  columns.forEach((column) => {
    columnMap.set(column.key, column);

    if (column.depth === 0) {
      rootColumns.push(column);
    } else {
      const parent = columnMap.get(column.parentKey);

      if (parent) {
        parent.children?.push(column);
      }
    }
  });

  return rootColumns;
}

const cloneColumnsState = (tree: ColumnState[]): ColumnState[] => {
  return tree.map((column) => ({
    ...column,
    children: column.children?.length ? cloneColumnsState(column.children) : [],
  }));
};

type UpdateColumnState = Omit<ColumnState, 'children'>;
export type BatchUpdateType = {
  targetKey: Key;
  prop: (keyof UpdateColumnState)[];
  value: ColumnState[keyof UpdateColumnState][];
};

/**
 * 修改树形结构中的数据
 * @param tree - 原始树数据
 * @param key - 节点中的唯一标识符
 * @param updates - 要修改的key和数据
 * @returns 新树结构
 */
export function batchUpdateColumns(
  tree: ColumnState[],
  updates: BatchUpdateType[],
): ColumnState[] {
  const cloneTree = cloneColumnsState(tree);

  const updateMap = new Map(updates.map((u) => [u.targetKey, u]));

  function traverse(cols: ColumnState[]) {
    cols.forEach((column) => {
      if (updateMap.has(column.key)) {
        const { prop, value } = updateMap.get(column.key)!;
        for (let i = 0; i < prop.length; i++) {
          (column[prop[i]] as ColumnState[keyof UpdateColumnState]) = value[i];
        }
      }
      if (column.children?.length) traverse(column.children);
    });
  }

  traverse(cloneTree);
  return cloneTree;
}

/**
 * 排序
 * @param columns 列数组
 * @param compareFn 排序比较函数
 * @returns 排序后的列数组
 */
export function columnsSort<T>(columns: ColumnState<T>[]) {
  if (!Array.isArray(columns)) return columns;

  // 深度优先递归排序
  const deepSort = (cols: ColumnState<T>[]): ColumnState<T>[] => {
    // 1. 排序当前层级
    const sorted = [...cols].sort((a, b) => a.order - b.order);

    // 2. 递归排序子节点
    return sorted.map((col) => {
      if (col.children?.length) {
        return {
          ...col,
          children: deepSort(col.children),
        };
      }
      return col;
    });
  };

  return deepSort(columns);
}

/**
 * 在树结构中替换指定节点
 * @param tree 树状数组数据
 * @param keys 要查找的节点keys
 * @param replaceNodes 替换的节点数组
 * @returns 处理后的新树
 */
export function replaceTreeNode(
  tree: ColumnState[],
  targetKeys: Key[],
  replaceNodes: ColumnState[],
  replaced: boolean = false,
) {
  let hasReplaced = replaced;

  return tree.reduce((result: ColumnState[], column) => {
    if (targetKeys.includes(column.key)) {
      if (!hasReplaced) {
        result.push(...replaceNodes);
        hasReplaced = true;
      }
    } else if (column.hasChildren && !hasReplaced) {
      result.push({
        ...column,
        children: replaceTreeNode(
          column.children || [],
          targetKeys,
          replaceNodes,
          hasReplaced,
        ),
      });
    } else {
      result.push(column);
    }

    return result;
  }, []);
}

/**
 * 在树状数组中查找指定key的节点
 * @param tree 树状数组
 * @param targetKey 目标节点key
 * @returns 找到的节点或null
 */
export function findNodeByKey(
  tree: ColumnState[],
  targetKey: Key,
): ColumnState | null {
  for (const node of tree) {
    if (node.key === targetKey) {
      return node;
    }
    if (node.hasChildren) {
      const found = findNodeByKey(node.children as ColumnState[], targetKey);
      if (found) return found;
    }
  }
  return null;
}
