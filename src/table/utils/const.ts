export const INTERNAL_EXPAND_COLUMN_KEY = '__RC_GRID_TABLE_EXPAND_COLUMN__';
export const DEFAULT_EXPAND_COLUMN_WIDTH = 55;

import type { ExpandColumnType } from "../interface";

export const EXPAND_COLUMN: ExpandColumnType = {
  key: INTERNAL_EXPAND_COLUMN_KEY,
  __RC_GRID_TABLE_EXPAND_COLUMN: true,
};

export const SELECTION_COLUMN = { __RC_GRID_TABLE_SELECTION_COLUMN: true } as const;

export const isExpandColumn = (column: unknown): column is ExpandColumnType => {
  return column === EXPAND_COLUMN || !!(column as typeof EXPAND_COLUMN)?.__RC_GRID_TABLE_EXPAND_COLUMN;
};
