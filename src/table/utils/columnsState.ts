import type { Key } from 'react';

import type {
  ColumnFixedInsertPosition,
  ColumnState,
  ColumnStatePatch,
} from '../interface';
import { flattenColumnsState, parseColumnsState } from './handle';

export type ColumnStatePatchField =
  | 'order'
  | 'visible'
  | 'fixed'
  | 'width'
  | 'widthManuallyChanged';

const allPatchFields: ColumnStatePatchField[] = [
  'order',
  'visible',
  'fixed',
  'width',
  'widthManuallyChanged',
];

const fullStateFields = [
  ...allPatchFields,
  'autoWidthLocked',
] as const satisfies readonly (ColumnStatePatchField | 'autoWidthLocked')[];

export const collectInvisibleColumnKeys = <T>(columnsState: ColumnState<T>[]) =>
  flattenColumnsState(columnsState).reduce<Key[]>((result, column) => {
    if (column.visible === false) {
      result.push(column.key);
    }

    return result;
  }, []);

const patchVisibleDeep = <T>(
  column: ColumnState<T>,
  visible: boolean,
): ColumnState<T> => {
  const next: ColumnState<T> = { ...column, visible };
  if (column.children?.length) {
    next.children = column.children.map((child) =>
      patchVisibleDeep(child, visible),
    );
  }

  return next;
};

export const patchColumnsStateVisible = <T>(
  columnsState: ColumnState<T>[],
  targetKey: Key,
  visible: boolean,
): { nextState: ColumnState<T>[]; found: boolean } => {
  let found = false;

  const traverse = (columns: ColumnState<T>[]): ColumnState<T>[] =>
    columns.map((column) => {
      if (column.key === targetKey) {
        found = true;
        return patchVisibleDeep(column, visible);
      }

      if (!column.children?.length) return { ...column };

      const children = traverse(column.children);
      return {
        ...column,
        children,
        visible: children.some((child) => child.visible !== false),
      };
    });

  return { nextState: parseColumnsState(traverse(columnsState)), found };
};

const patchFixedDeep = <T>(
  column: ColumnState<T>,
  fixed: ColumnState<T>['fixed'],
): ColumnState<T> => {
  const next: ColumnState<T> = { ...column, fixed };
  if (column.children?.length) {
    next.children = column.children.map((child) =>
      patchFixedDeep(child, fixed),
    );
  }

  return next;
};

const getFixedBucket = (fixed: ColumnState['fixed']) => {
  return fixed === 'start' || fixed === 'end' ? fixed : false;
};

const sortColumnsByOrder = <T>(columns: ColumnState<T>[]) => {
  return columns
    .map((column, index) => ({ column, index }))
    .sort((a, b) => {
      const prevOrder =
        typeof a.column.order === 'number' ? a.column.order : a.index;
      const nextOrder =
        typeof b.column.order === 'number' ? b.column.order : b.index;
      return prevOrder - nextOrder || a.index - b.index;
    })
    .map(({ column }) => column);
};

const getEmptyFixedBucketInsertIndex = <T>(
  columns: ColumnState<T>[],
  fixed: Exclude<ColumnState<T>['fixed'], undefined>,
) => {
  if (fixed === 'start') return 0;
  if (fixed === 'end') return columns.length;

  const lastStartIndex = columns.reduce((result, column, index) => {
    return getFixedBucket(column.fixed) === 'start' ? index : result;
  }, -1);

  if (lastStartIndex >= 0) return lastStartIndex + 1;

  const firstEndIndex = columns.findIndex(
    (column) => getFixedBucket(column.fixed) === 'end',
  );

  return firstEndIndex >= 0 ? firstEndIndex : 0;
};

const isAlreadyAtFixedBoundary = <T>(
  sortedColumns: ColumnState<T>[],
  activeKeySet: Set<Key>,
  fixed: Exclude<ColumnState<T>['fixed'], undefined>,
  insertPosition: ColumnFixedInsertPosition,
  activeCount: number,
) => {
  const targetColumns = sortedColumns.filter(
    (column) => getFixedBucket(column.fixed) === fixed,
  );
  if (targetColumns.length <= activeCount) return false;

  const activeColumns = sortedColumns.filter((column) =>
    activeKeySet.has(column.key),
  );
  if (
    activeColumns.length !== activeCount ||
    activeColumns.some((column) => getFixedBucket(column.fixed) !== fixed)
  ) {
    return false;
  }

  if (insertPosition === 'first') {
    return activeColumns.every(
      (column, index) => targetColumns[index]?.key === column.key,
    );
  }

  const targetTailColumns = targetColumns.slice(-activeColumns.length);
  return activeColumns.every(
    (column, index) => targetTailColumns[index]?.key === column.key,
  );
};

export const patchColumnsStateFixed = <T>(
  columnsState: ColumnState<T>[],
  targetKeys: Key[],
  fixed: Exclude<ColumnState<T>['fixed'], undefined>,
  insertPosition: ColumnFixedInsertPosition,
): { nextState: ColumnState<T>[]; found: boolean } => {
  let found = false;
  const targetKeySet = new Set(targetKeys);
  const fixedBucket = getFixedBucket(fixed);

  const reorderSiblings = (
    columns: ColumnState<T>[],
    patchedColumns: ColumnState<T>[],
  ) => {
    const sortedColumns = sortColumnsByOrder(columns);
    const sortedPatchedColumns = sortColumnsByOrder(patchedColumns);
    const activeColumns = sortedPatchedColumns.filter((column) =>
      targetKeySet.has(column.key),
    );
    if (!activeColumns.length) return patchedColumns;

    const remainingColumns = sortedPatchedColumns.filter(
      (column) => !targetKeySet.has(column.key),
    );

    let nextSortedColumns = sortedPatchedColumns;
    const remainingTargetIndexes = remainingColumns.reduce<number[]>(
      (result, column, index) => {
        if (getFixedBucket(column.fixed) === fixedBucket) {
          result.push(index);
        }
        return result;
      },
      [],
    );

    if (
      remainingTargetIndexes.length &&
      !isAlreadyAtFixedBoundary(
        sortedColumns,
        targetKeySet,
        fixedBucket,
        insertPosition,
        activeColumns.length,
      )
    ) {
      const insertIndex =
        insertPosition === 'first'
          ? Math.min(...remainingTargetIndexes)
          : Math.max(...remainingTargetIndexes) + 1;
      nextSortedColumns = [...remainingColumns];
      nextSortedColumns.splice(insertIndex, 0, ...activeColumns);
    } else if (!remainingTargetIndexes.length) {
      const insertIndex = getEmptyFixedBucketInsertIndex(
        remainingColumns,
        fixedBucket,
      );
      nextSortedColumns = [...remainingColumns];
      nextSortedColumns.splice(insertIndex, 0, ...activeColumns);
    }

    const orderMap = new Map<Key, number>();
    nextSortedColumns.forEach((column, order) => {
      orderMap.set(column.key, order);
    });

    return patchedColumns.map((column) => {
      const order = orderMap.get(column.key);
      if (order === undefined || column.order === order) return column;
      return { ...column, order };
    });
  };

  const traverse = (columns: ColumnState<T>[]): ColumnState<T>[] => {
    const patchedColumns = columns.map((column) => {
      if (targetKeySet.has(column.key)) {
        found = true;
        return patchFixedDeep(column, fixed);
      }

      if (!column.children?.length) return { ...column };

      return {
        ...column,
        children: traverse(column.children),
      };
    });

    return reorderSiblings(columns, patchedColumns);
  };

  return { nextState: parseColumnsState(traverse(columnsState)), found };
};

export const collectChangedPatches = <T>(
  previousState: ColumnState<T>[],
  nextState: ColumnState<T>[],
  field: 'order' | 'visible' | 'fixed',
): ColumnStatePatch<T>[] => {
  const previousMap = new Map<Key, ColumnState<T>>();
  flattenColumnsState(previousState).forEach((column) => {
    previousMap.set(column.key, column);
  });

  return flattenColumnsState(nextState).reduce<ColumnStatePatch<T>[]>(
    (result, column) => {
      const previous = previousMap.get(column.key);
      if (!previous || previous[field] === column[field]) return result;

      result.push({
        key: column.key,
        partial: { [field]: column[field] } as ColumnStatePatch<T>['partial'],
      });
      return result;
    },
    [],
  );
};

export const collectChangedColumnsStatePatches = <T>(
  previousState: ColumnState<T>[],
  nextState: ColumnState<T>[],
  fields: readonly ColumnStatePatchField[] = allPatchFields,
): ColumnStatePatch<T>[] => {
  const previousMap = new Map<Key, ColumnState<T>>();
  const fieldSet = new Set<ColumnStatePatchField>(fields);
  flattenColumnsState(previousState).forEach((column) => {
    previousMap.set(column.key, column);
  });

  return flattenColumnsState(nextState).reduce<ColumnStatePatch<T>[]>(
    (result, column) => {
      const previous = previousMap.get(column.key);
      const partial: ColumnStatePatch<T>['partial'] = {};

      if (fieldSet.has('order') && previous?.order !== column.order) {
        partial.order = column.order;
      }
      if (fieldSet.has('visible') && previous?.visible !== column.visible) {
        partial.visible = column.visible;
      }
      if (fieldSet.has('fixed') && previous?.fixed !== column.fixed) {
        partial.fixed = column.fixed;
      }
      if (fieldSet.has('width') && previous?.width !== column.width) {
        partial.width = column.width;
      }
      if (
        fieldSet.has('widthManuallyChanged') &&
        previous?.widthManuallyChanged !== column.widthManuallyChanged
      ) {
        partial.widthManuallyChanged = column.widthManuallyChanged;
      }

      if (!Object.keys(partial).length) return result;

      result.push({
        key: column.key,
        partial,
      });
      return result;
    },
    [],
  );
};

export const compactUserColumnStatePatches = <T>(
  baseState: ColumnState<T>[],
  finalState: ColumnState<T>[],
  userPatches: ColumnStatePatch<T>[],
): ColumnStatePatch<T>[] => {
  if (!userPatches.length) return [];

  const fieldsByKey = new Map<Key, Set<ColumnStatePatchField>>();
  userPatches.forEach((patch) => {
    const fields =
      fieldsByKey.get(patch.key) ?? new Set<ColumnStatePatchField>();

    allPatchFields.forEach((field) => {
      if (field in patch.partial) {
        fields.add(field);
      }
    });

    if (fields.size) {
      fieldsByKey.set(patch.key, fields);
    }
  });

  if (!fieldsByKey.size) return [];

  const baseMap = new Map<Key, ColumnState<T>>();
  const finalMap = new Map<Key, ColumnState<T>>();
  flattenColumnsState(baseState).forEach((column) => {
    baseMap.set(column.key, column);
  });
  flattenColumnsState(finalState).forEach((column) => {
    finalMap.set(column.key, column);
  });

  const result: ColumnStatePatch<T>[] = [];
  fieldsByKey.forEach((fields, key) => {
    const base = baseMap.get(key);
    const final = finalMap.get(key);
    if (!final) return;

    const partial: ColumnStatePatch<T>['partial'] = {};
    fields.forEach((field) => {
      if (base?.[field] !== final[field]) {
        Object.assign(partial, { [field]: final[field] });
      }
    });

    if (Object.keys(partial).length) {
      result.push({ key, partial });
    }
  });

  return result;
};

export const getPatchKeys = <T>(patches: ColumnStatePatch<T>[]) =>
  Array.from(new Set(patches.map((patch) => patch.key)));

export const isColumnsShapeEqual = (
  a: Array<{ key: Key; children?: any[] }> = [],
  b: Array<{ key: Key; children?: any[] }> = [],
): boolean => {
  if (a.length !== b.length) return false;

  return a.every((column, index) => {
    const target = b[index];
    return (
      !!target &&
      column.key === target.key &&
      isColumnsShapeEqual(column.children || [], target.children || [])
    );
  });
};

export const isColumnsStateEqual = <T>(
  previousState: ColumnState<T>[],
  nextState: ColumnState<T>[],
) => {
  if (!isColumnsShapeEqual(previousState, nextState)) return false;

  const previousMap = new Map<Key, ColumnState<T>>();
  flattenColumnsState(previousState).forEach((column) => {
    previousMap.set(column.key, column);
  });

  return flattenColumnsState(nextState).every((column) => {
    const previous = previousMap.get(column.key);
    if (!previous) return false;

    return fullStateFields.every((field) => previous[field] === column[field]);
  });
};
