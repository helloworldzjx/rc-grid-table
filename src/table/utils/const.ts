import type { ExpandColumnType, SelectionColumnType } from "../interface";

export const INTERNAL_EXPAND_COLUMN_KEY = '__RC_GRID_TABLE_EXPAND_COLUMN__';
export const INTERNAL_SELECTION_COLUMN_KEY = '__RC_GRID_TABLE_SELECTION_COLUMN__';
export const DEFAULT_EXPAND_COLUMN_WIDTH = 55;
export const DEFAULT_SELECTION_COLUMN_WIDTH = 55;

export const EXPAND_COLUMN: ExpandColumnType = {
  key: INTERNAL_EXPAND_COLUMN_KEY,
  __RC_GRID_TABLE_EXPAND_COLUMN: true,
  resizeDisabled: true,
};

export const SELECTION_COLUMN: SelectionColumnType = {
  key: INTERNAL_SELECTION_COLUMN_KEY,
  __RC_GRID_TABLE_SELECTION_COLUMN: true,
  resizeDisabled: true,
};

export const isExpandColumn = (column: unknown): column is ExpandColumnType => {
  return column === EXPAND_COLUMN || !!(column as typeof EXPAND_COLUMN)?.__RC_GRID_TABLE_EXPAND_COLUMN;
};

export const isSelectionColumn = (column: unknown): column is SelectionColumnType => {
  return column === SELECTION_COLUMN || !!(column as typeof SELECTION_COLUMN)?.__RC_GRID_TABLE_SELECTION_COLUMN;
};

export const isInternalColumn = (column: unknown) => isExpandColumn(column) || isSelectionColumn(column);
