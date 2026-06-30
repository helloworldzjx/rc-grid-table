import { Key } from 'react';

import { isNum } from '../../_utils/validate';
import type {
  ColumnState,
  ColumnStatePatch,
  ColumnsType,
  ColumnType,
  ColumnViewState,
  SizeType,
} from '../interface';
import type { CellType, InternalColumnState } from '../internalInterface';
import { isValidColumnKey } from '../utils/validate';
import {
  DEFAULT_RESIZE_MIN_WIDTH,
  getDefaultInternalColumnWidth,
  isInternalColumn,
} from './const';
import { warningFallbackColumnKey, warningInvalidColumnKey } from './warning';

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
  resizeMinWidth: number | undefined,
  width: number,
) => {
  const minWidth = isNum(resizeMinWidth)
    ? resizeMinWidth
    : DEFAULT_RESIZE_MIN_WIDTH;

  return Math.min(minWidth, width);
};

export function parseHeaderRows<T>(
  columns: InternalColumnState<T>[] = [],
): CellType<T>[][] {
  const rows: CellType<T>[][] = [];

  function fillRowCells(
    cols: InternalColumnState<T>[],
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

export function filterHiddenColumns<T = any>(
  size: SizeType,
  columns: ColumnsType<T>,
  parentKey: Key = '',
  ancestorKeys: Key[] = [],
  depth = 0,
) {
  if (!Array.isArray(columns)) return [];

  return columns.reduce(
    (
      result: InternalColumnState<T>[],
      column: ColumnType<T>,
      index: number,
    ) => {
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
        } as InternalColumnState<T>);
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
        children = filterHiddenColumns(
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
      result.push(newNode as InternalColumnState<T>);
      return result;
    },
    [],
  );
}

const getColumnStateFixed = <T>(
  column: ColumnState<T> | InternalColumnState<T>,
) => {
  if (
    'columnStateFixed' in column &&
    (column.columnStateFixed === 'start' ||
      column.columnStateFixed === 'end' ||
      column.columnStateFixed === false)
  ) {
    return column.columnStateFixed;
  }

  return column.fixed;
};

export function parseColumnsState<T = any>(
  input: Array<ColumnState<T> | InternalColumnState<T>>,
): ColumnState<T>[] {
  if (!Array.isArray(input)) return [];

  return input.reduce((result: ColumnState<T>[], column) => {
    const key = column.key;
    if (key === undefined || key === null) return result;

    const state: ColumnState<T> = { key };

    if (column.dataIndex !== undefined) state.dataIndex = column.dataIndex;
    if (isNum(column.order)) state.order = column.order;
    if (typeof column.visible === 'boolean') state.visible = column.visible;
    const fixed = getColumnStateFixed(column);
    if (fixed === 'start' || fixed === 'end') {
      state.fixed = fixed;
    } else if (fixed === false) {
      state.fixed = false;
    }
    if (isNum(column.width)) state.width = column.width;
    if (typeof column.widthManuallyChanged === 'boolean') {
      state.widthManuallyChanged = column.widthManuallyChanged;
    }

    const children = parseColumnsState(column.children || []);
    if (children.length) state.children = children;

    result.push(state);
    return result;
  }, []);
}

/**
 * 展平columnsState数组
 * @param columns columnsState
 * @returns 展平后的columnsState数组
 */
export function flattenColumnsState<T = any>(
  columnsState: ColumnState<T>[],
): ColumnState<T>[] {
  return columnsState.reduce((result: ColumnState<T>[], state) => {
    if (state.children?.length) {
      result.push(...flattenColumnsState(state.children || []));
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

export type FnColumnType<T> = Partial<Omit<InternalColumnState<T>, 'width'>> & {
  width?: ColumnType<T>['width'];
};

export type FlattenColumnsOptions = {
  previewHiddenColumns?: boolean;
  previewRestoredKeys?: ReadonlySet<Key>;
};

export function flattenColumnsWithTotalWidth<T>(
  containerWidth: number,
  columns: FnColumnType<T>[],
  topMinWidth: number,
  leafMinWidth: number,
  size?: SizeType,
  options: FlattenColumnsOptions = {},
): { flattenColumns: InternalColumnState<T>[]; usedWidthTotal: number } {
  const result: InternalColumnState<T>[] = [];
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
        } as InternalColumnState<T>);
        return;
      }

      const columnVisible = column.visible ?? true;
      const previewVisible = !!options.previewHiddenColumns && !columnVisible;
      const childrenAllHidden = column.children?.length
        ? column.children.every(
            (subColumn) =>
              subColumn.hidden ||
              (!options.previewHiddenColumns && !(subColumn.visible ?? true)),
          )
        : false;

      if (column.hidden) {
        return;
      }

      if (childrenAllHidden) {
        return;
      }

      const currentKey = getColumnKey(column, index);

      const hasChildren = !!column.children?.length;
      if (!hasChildren && !previewVisible && !columnVisible) {
        return;
      }

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
            ? getEffectiveResizeMinWidth(column.resizeMinWidth, width)
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
        visible: columnVisible,
        previewVisible,
        previewHidden: previewVisible,
        previewRestored:
          !!options.previewHiddenColumns &&
          columnVisible &&
          options.previewRestoredKeys?.has(currentKey),
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
  flattenedColumns: InternalColumnState<T>[],
): InternalColumnState<T>[] {
  const columns = flattenedColumns.slice();
  // 创建节点映射表
  const columnMap = new Map<Key, InternalColumnState<T>>();
  const rootColumns: InternalColumnState<T>[] = [];

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

/**
 * 修改树形结构中的数据
 * @param tree - 原始树数据
 * @param key - 节点中的唯一标识符
 * @param updates - 要修改的key和数据
 * @returns 新树结构
 */
export function batchPatchColumns<T = any>(
  tree: ColumnState<T>[],
  patches: ColumnStatePatch<T>[],
): ColumnState<T>[] {
  const cloneTree = cloneColumnsState(tree) as ColumnState<T>[];
  const patchMap = new Map(patches.map((patch) => [patch.key, patch.partial]));

  function traverse(cols: ColumnState<T>[]) {
    cols.forEach((column) => {
      const partial = patchMap.get(column.key);
      if (partial) {
        Object.assign(column, partial);
      }
      if (column.children?.length) traverse(column.children);
    });
  }

  traverse(cloneTree);
  return parseColumnsState(cloneTree);
}

export function syncColumnsStateRuntimeWidths<T = any>(
  tree: ColumnState<T>[],
  flattenColumns: InternalColumnState<T>[],
  flattenColumnsWidths: number[],
): ColumnState<T>[] {
  const patches = flattenColumns.reduce<ColumnStatePatch<T>[]>(
    (result, column, index) => {
      const partial: ColumnStatePatch<T>['partial'] = {};
      const width = flattenColumnsWidths[index] ?? column.width;

      if (isNum(width)) partial.width = width;
      if (typeof column.widthManuallyChanged === 'boolean') {
        partial.widthManuallyChanged = column.widthManuallyChanged;
      }

      if (Object.keys(partial).length) {
        result.push({ key: column.key, partial });
      }

      return result;
    },
    [],
  );

  return patches.length
    ? batchPatchColumns(tree, patches)
    : parseColumnsState(tree);
}

export function pickColumnsStateWidths<T = any>(
  tree: ColumnState<T>[],
): ColumnState<T>[] {
  const traverse = (columns: ColumnState<T>[]): ColumnState<T>[] => {
    return columns.reduce((result: ColumnState<T>[], column) => {
      const children = column.children?.length ? traverse(column.children) : [];
      const hasWidth = isNum(column.width);
      const hasWidthManuallyChanged =
        typeof column.widthManuallyChanged === 'boolean';

      if (!hasWidth && !hasWidthManuallyChanged && !children.length) {
        return result;
      }

      const state: ColumnState<T> = { key: column.key };
      if (column.dataIndex !== undefined) state.dataIndex = column.dataIndex;
      if (hasWidth) state.width = column.width;
      if (hasWidthManuallyChanged) {
        state.widthManuallyChanged = column.widthManuallyChanged;
      }
      if (children.length) state.children = children;

      result.push(state);
      return result;
    }, []);
  };

  return parseColumnsState(traverse(tree));
}

export function getColumnsViewState<T = any>(
  columns: InternalColumnState<T>[] = [],
): ColumnViewState<T>[] {
  return columns.map((column) => {
    const children = column.children?.length
      ? getColumnsViewState(column.children)
      : [];

    const viewState: ColumnViewState<T> = {
      key: column.key,
      dataIndex: column.dataIndex,
      title: column.title,
      parentKey: column.parentKey,
      ancestorKeys: column.ancestorKeys,
      depth: column.depth,
      order: column.order,
      visible: column.visible,
      fixed: getColumnStateFixed(column),
      width: column.width,
      resizeMinWidth: column.resizeMinWidth,
      widthManuallyChanged: column.widthManuallyChanged,
      hasChildren: column.hasChildren,
      internal: isInternalColumn(column),
      previewVisible: column.previewVisible,
      previewHidden: column.previewHidden,
      previewRestored: column.previewRestored,
    };

    if (children.length) viewState.children = children;

    return viewState;
  });
}

/**
 * 排序
 * @param columns 列数组
 * @param compareFn 排序比较函数
 * @returns 排序后的列数组
 */
export function columnsSort<T>(columns: InternalColumnState<T>[]) {
  if (!Array.isArray(columns)) return columns;

  // 深度优先递归排序
  const deepSort = (
    cols: InternalColumnState<T>[],
  ): InternalColumnState<T>[] => {
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
  tree: InternalColumnState[],
  targetKeys: Key[],
  replaceNodes: InternalColumnState[],
  replaced: boolean = false,
) {
  let hasReplaced = replaced;

  return tree.reduce((result: InternalColumnState[], column) => {
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
  tree: InternalColumnState[],
  targetKey: Key,
): InternalColumnState | null {
  for (const node of tree) {
    if (node.key === targetKey) {
      return node;
    }
    if (node.hasChildren) {
      const found = findNodeByKey(
        node.children as InternalColumnState[],
        targetKey,
      );
      if (found) return found;
    }
  }
  return null;
}

type ColumnOrderState = {
  key: Key;
  order?: number;
  children?: ColumnOrderState[];
};

export const isColumnsOrderEqual = (
  a: ColumnOrderState[] = [],
  b: ColumnOrderState[] = [],
): boolean => {
  if (a.length !== b.length) return false;

  const orderedA = [...a].sort(
    (prev, next) =>
      (isNum(prev.order) ? prev.order : 0) -
      (isNum(next.order) ? next.order : 0),
  );
  const orderedB = [...b].sort(
    (prev, next) =>
      (isNum(prev.order) ? prev.order : 0) -
      (isNum(next.order) ? next.order : 0),
  );

  return orderedA.every((column, index) => {
    const target = orderedB[index];
    return (
      !!target &&
      column.key === target.key &&
      column.order === target.order &&
      isColumnsOrderEqual(column.children || [], target.children || [])
    );
  });
};

export const getSortablePreviewColumns = <T>(
  columnsState: InternalColumnState<T>[],
  sourceFlattenColumns: InternalColumnState<T>[],
  sourceWidths: number[],
) => {
  const sourceColumnMap = new Map<Key, InternalColumnState<T>>();

  sourceFlattenColumns.forEach((column, index) => {
    const width = sourceWidths[index] ?? column.width;
    sourceColumnMap.set(
      column.key,
      isNum(width) && width !== column.width ? { ...column, width } : column,
    );
  });

  const flattenColumns: InternalColumnState<T>[] = [];

  const cloneColumns = (
    columns: InternalColumnState<T>[],
  ): InternalColumnState<T>[] =>
    columns.reduce<InternalColumnState<T>[]>((result, column) => {
      const children = column.children?.length
        ? cloneColumns(column.children)
        : [];

      if (children.length) {
        result.push({
          ...column,
          width: undefined,
          hasChildren: true,
          children,
        });
        return result;
      }

      const sourceColumn = sourceColumnMap.get(column.key);
      if (!sourceColumn) return result;

      flattenColumns.push(sourceColumn);
      result.push(sourceColumn);
      return result;
    }, []);

  const treeColumns = cloneColumns(columnsState);

  return {
    treeColumns,
    flattenColumns,
    flattenColumnsWidths: flattenColumns.map(
      (column) => column.width as number,
    ),
  };
};
