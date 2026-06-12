import { createContext, useContext } from 'react';

import type { InternalColumnState, StickyOffsets } from '../internalInterface';

export interface ColumnSortPreviewLayoutContextProps<T = any> {
  columns?: InternalColumnState<T>[];
  flattenColumns?: InternalColumnState<T>[];
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
