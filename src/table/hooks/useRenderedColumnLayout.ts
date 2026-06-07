import { useMemo } from 'react';

import { useColumnSortPreviewLayoutContext } from '../columnSortPreviewLayoutContext';
import { useTableLayoutContext } from '../tableLayoutContext';

const useRenderedColumnLayout = <T = any>() => {
  const tableLayout = useTableLayoutContext<T>();
  const previewLayout = useColumnSortPreviewLayoutContext<T>();

  return useMemo(
    () => ({
      ...tableLayout,
      columns: previewLayout.columns ?? tableLayout.columns,
      flattenColumns:
        previewLayout.flattenColumns ?? tableLayout.flattenColumns,
      flattenColumnsWidths:
        previewLayout.flattenColumnsWidths ?? tableLayout.flattenColumnsWidths,
      columnsWidthTotal:
        previewLayout.columnsWidthTotal ?? tableLayout.columnsWidthTotal,
      fixedOffset: previewLayout.fixedOffset ?? tableLayout.fixedOffset,
      hasFixedColumns:
        previewLayout.fixedOffset?.hasFixColumns ?? tableLayout.hasFixedColumns,
      fixColumnsGapped:
        previewLayout.fixedOffset?.fixColumnsGapped ??
        tableLayout.fixColumnsGapped,
    }),
    [previewLayout, tableLayout],
  );
};

export default useRenderedColumnLayout;
