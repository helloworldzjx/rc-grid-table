import { createContext, useContext } from 'react';

import type { ColumnState, StickyOffsets } from '../interface';

export interface ColumnSortPreviewLayoutContextProps<T = any> {
  columns?: ColumnState<T>[];
  flattenColumns?: ColumnState<T>[];
  flattenColumnsWidths?: number[];
  columnsWidthTotal?: number;
  fixedOffset?: StickyOffsets;
}

// 只承载列排序预览布局。真实布局仍在 TableLayoutContext，避免 draft 状态扩大订阅范围。
const ColumnSortPreviewLayoutContext =
  createContext<ColumnSortPreviewLayoutContextProps>({});

const useColumnSortPreviewLayoutContext = <T = any,>() =>
  useContext(
    ColumnSortPreviewLayoutContext,
  ) as ColumnSortPreviewLayoutContextProps<T>;

export { useColumnSortPreviewLayoutContext };

export default ColumnSortPreviewLayoutContext;
