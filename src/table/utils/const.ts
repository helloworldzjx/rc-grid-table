import type {
  ExpandColumnType,
  RowSortColumnType,
  SelectionColumnType,
  SizeType,
} from '../interface';

/** 特殊列默认配置 start */

export const INTERNAL_EXPAND_COLUMN_KEY = '__RC_GRID_TABLE_EXPAND_COLUMN__';
export const INTERNAL_SELECTION_COLUMN_KEY =
  '__RC_GRID_TABLE_SELECTION_COLUMN__';
export const INTERNAL_ROW_SORT_COLUMN_KEY = '__RC_GRID_TABLE_ROW_SORT_COLUMN__';
export const DEFAULT_INTERNAL_COLUMN_WIDTH_BY_SIZE: Record<SizeType, number> = {
  small: 39,
  middle: 47,
  large: 55,
};

export const getDefaultInternalColumnWidth = (size: SizeType = 'large') => {
  return (
    DEFAULT_INTERNAL_COLUMN_WIDTH_BY_SIZE[size] ??
    DEFAULT_INTERNAL_COLUMN_WIDTH_BY_SIZE.large
  );
};

export const EXPAND_COLUMN: ExpandColumnType = {
  key: INTERNAL_EXPAND_COLUMN_KEY,
  __RC_GRID_TABLE_EXPAND_COLUMN: true,
};

export const SELECTION_COLUMN: SelectionColumnType = {
  key: INTERNAL_SELECTION_COLUMN_KEY,
  __RC_GRID_TABLE_SELECTION_COLUMN: true,
};

export const ROW_SORT_COLUMN: RowSortColumnType = {
  key: INTERNAL_ROW_SORT_COLUMN_KEY,
  __RC_GRID_TABLE_ROW_SORT_COLUMN: true,
};

export const isExpandColumn = (column: unknown): column is ExpandColumnType => {
  return (
    column === EXPAND_COLUMN ||
    !!(column as typeof EXPAND_COLUMN)?.__RC_GRID_TABLE_EXPAND_COLUMN
  );
};

export const isSelectionColumn = (
  column: unknown,
): column is SelectionColumnType => {
  return (
    column === SELECTION_COLUMN ||
    !!(column as typeof SELECTION_COLUMN)?.__RC_GRID_TABLE_SELECTION_COLUMN
  );
};

export const isRowSortColumn = (
  column: unknown,
): column is RowSortColumnType => {
  return (
    column === ROW_SORT_COLUMN ||
    !!(column as typeof ROW_SORT_COLUMN)?.__RC_GRID_TABLE_ROW_SORT_COLUMN
  );
};

export const isInternalColumn = (column: unknown) =>
  isExpandColumn(column) ||
  isSelectionColumn(column) ||
  isRowSortColumn(column);

/** 特殊列默认配置 end */

/** ready skeleton 时的 body 高度 */
export const READY_SKELETON_BODY_HEIGHT = 286;

/** 滚动条thumb最小size */
export const MIN_THUMB_SIZE = 20;

/** 滚动条size */
export const SCROLLBAR_SIZE = 12;

/** 滚动条thumb size */
export const SCROLLBAR_THUMB_SIZE = 8;

/** 滚动条thumb相对定位top */
export const SCROLLBAR_THUMB_ABSOLUTE_LEFT_TOP =
  (SCROLLBAR_SIZE - SCROLLBAR_THUMB_SIZE) / 2;

/** 滚动条显隐容差，避免临界宽度下反复闪烁 */
export const SCROLLBAR_VISIBLE_TOLERANCE = 1;

/** 列拖拽overlay元素内容x偏移量 */
export const COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X = 16;

/** 列排序预览 motion layout 的动画时长，释放 motionKeys 和 drag end 收尾等待都要与它保持一致 */
export const COLUMNS_SORT_MOTION_DURATION = 150;
