import type { Key } from 'react';

import type { ColumnsType, ColumnType, SizeType } from '../interface';
import type { InternalColumnState } from '../internalInterface';
import { getDefaultInternalColumnWidth, isInternalColumn } from './const';
import { getColumnKey } from './handle';

export function buildRenderableColumnTree<T = any>(
  size: SizeType,
  columns: ColumnsType<T>,
  parentKey: Key = '',
  ancestorKeys: Key[] = [],
  depth = 0,
): InternalColumnState<T>[] {
  if (!Array.isArray(columns)) return [];

  return columns.reduce(
    (
      result: InternalColumnState<T>[],
      column: ColumnType<T>,
      index: number,
    ) => {
      if (isInternalColumn(column)) {
        const width = column.width ?? getDefaultInternalColumnWidth(size);
        const ownFixed = column.fixed;

        result.push({
          ...column,
          title: column.title ?? '',
          width,
          ownFixed,
          effectiveFixed: ownFixed ?? false,
          renderFixed: ownFixed ?? false,
          groupFixedState: ownFixed ?? false,
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
      if (column.hidden === true) {
        return result;
      }

      let children: ColumnsType<T> = [];
      const isBranchNode = Array.isArray(column.children);
      if (isBranchNode) {
        children = buildRenderableColumnTree(
          size,
          column.children || [],
          currentKey,
          [...ancestorKeys, currentKey],
          depth + 1,
        );
      }

      if (isBranchNode && children.length === 0) {
        return result;
      }

      const ownFixed = column.fixed;
      const newNode = {
        ...column,
        key: currentKey,
        ownFixed,
        effectiveFixed: ownFixed ?? false,
        renderFixed: ownFixed ?? false,
        groupFixedState: ownFixed ?? false,
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
