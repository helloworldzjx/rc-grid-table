import { createContext, useContext } from 'react';

import type { ColumnState, StickyOffsets } from './interface';

export interface ColumnSortPreviewLayoutContextProps<T = any> {
  columns?: ColumnState<T>[];
  flattenColumns?: ColumnState<T>[];
  flattenColumnsWidths?: number[];
  columnsWidthTotal?: number;
  fixedOffset?: StickyOffsets;
}

const ColumnSortPreviewLayoutContext =
  createContext<ColumnSortPreviewLayoutContextProps>({});

const useColumnSortPreviewLayoutContext = <T = any,>() =>
  useContext(
    ColumnSortPreviewLayoutContext,
  ) as ColumnSortPreviewLayoutContextProps<T>;

export { useColumnSortPreviewLayoutContext };

export default ColumnSortPreviewLayoutContext;
