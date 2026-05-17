import type { ExpandColumnType, SelectionColumnType, SizeType } from "../interface";

export const INTERNAL_EXPAND_COLUMN_KEY = '__RC_GRID_TABLE_EXPAND_COLUMN__';
export const INTERNAL_SELECTION_COLUMN_KEY = '__RC_GRID_TABLE_SELECTION_COLUMN__';
export const DEFAULT_INTERNAL_COLUMN_WIDTH_BY_SIZE: Record<SizeType, number> = {
  small: 39,
  middle: 47,
  large: 55,
};

export const getDefaultInternalColumnWidth = (size: SizeType = 'large') => {
  return DEFAULT_INTERNAL_COLUMN_WIDTH_BY_SIZE[size] ?? DEFAULT_INTERNAL_COLUMN_WIDTH_BY_SIZE.large;
};

export const EXPAND_COLUMN: ExpandColumnType = {
  key: INTERNAL_EXPAND_COLUMN_KEY,
  __RC_GRID_TABLE_EXPAND_COLUMN: true,
};

export const SELECTION_COLUMN: SelectionColumnType = {
  key: INTERNAL_SELECTION_COLUMN_KEY,
  __RC_GRID_TABLE_SELECTION_COLUMN: true,
};

export const isExpandColumn = (column: unknown): column is ExpandColumnType => {
  return column === EXPAND_COLUMN || !!(column as typeof EXPAND_COLUMN)?.__RC_GRID_TABLE_EXPAND_COLUMN;
};

export const isSelectionColumn = (column: unknown): column is SelectionColumnType => {
  return column === SELECTION_COLUMN || !!(column as typeof SELECTION_COLUMN)?.__RC_GRID_TABLE_SELECTION_COLUMN;
};

export const isInternalColumn = (column: unknown) => isExpandColumn(column) || isSelectionColumn(column);
