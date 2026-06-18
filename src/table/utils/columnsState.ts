import type { Key } from 'react';

import type { ColumnState, ColumnStatePatch } from '../interface';
import type { ColumnStateFeatureOptions } from '../internalInterface';
import { flattenColumnsState, parseColumnsState } from './handle';

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

export const patchColumnsStateFixed = <T>(
  columnsState: ColumnState<T>[],
  targetKey: Key,
  fixed: ColumnState<T>['fixed'],
): { nextState: ColumnState<T>[]; found: boolean } => {
  let found = false;

  const traverse = (columns: ColumnState<T>[]): ColumnState<T>[] =>
    columns.map((column) => {
      if (column.key === targetKey) {
        found = true;
        return patchFixedDeep(column, fixed);
      }

      if (!column.children?.length) return { ...column };

      return {
        ...column,
        children: traverse(column.children),
      };
    });

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
  features: ColumnStateFeatureOptions = {},
): ColumnStatePatch<T>[] => {
  const previousMap = new Map<Key, ColumnState<T>>();
  flattenColumnsState(previousState).forEach((column) => {
    previousMap.set(column.key, column);
  });

  return flattenColumnsState(nextState).reduce<ColumnStatePatch<T>[]>(
    (result, column) => {
      const previous = previousMap.get(column.key);
      const partial: ColumnStatePatch<T>['partial'] = {};

      if (features.sortableColumns && previous?.order !== column.order) {
        partial.order = column.order;
      }
      if (features.visibleColumns && previous?.visible !== column.visible) {
        partial.visible = column.visible;
      }
      if (features.fixableColumns && previous?.fixed !== column.fixed) {
        partial.fixed = column.fixed;
      }
      if (features.resizableColumns) {
        if (previous?.width !== column.width) {
          partial.width = column.width;
        }
        if (previous?.widthManuallyChanged !== column.widthManuallyChanged) {
          partial.widthManuallyChanged = column.widthManuallyChanged;
        }
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

export const isColumnsStateEqualByFeatures = <T>(
  previousState: ColumnState<T>[],
  nextState: ColumnState<T>[],
  features: ColumnStateFeatureOptions = {},
) =>
  collectChangedColumnsStatePatches(previousState, nextState, features)
    .length === 0 && isColumnsShapeEqual(previousState, nextState);
