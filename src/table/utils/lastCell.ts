import type { Key } from 'react';

type ColumnKeyItem = {
  key: Key;
};

export const hasLastColumnKey = (
  flattenColumns: readonly ColumnKeyItem[],
  keys?: readonly Key[],
) => {
  const lastColumnKey = flattenColumns[flattenColumns.length - 1]?.key;

  return lastColumnKey !== undefined && !!keys?.includes(lastColumnKey);
};
