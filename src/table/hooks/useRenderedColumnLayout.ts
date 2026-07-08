import { useMemo } from 'react';

import { useColumnSortPreviewLayoutContext } from '../contexts/ColumnSortPreviewLayoutContext';
import { useTableLayoutContext } from '../contexts/TableLayoutContext';

const useRenderedColumnLayout = <T = any>() => {
  const tableLayout = useTableLayoutContext<T>();
  const previewLayout = useColumnSortPreviewLayoutContext<T>();

  return useMemo(
    () => ({
      ...tableLayout,
      // 排序预览期间，局部消费者读取 preview layout；没有预览时退回真实 TableLayout。
      // 这样 header/body/summary 可以同步预览顺序，而虚拟滚动等全局逻辑不订阅 draft。
      columns: previewLayout.columns ?? tableLayout.columns,
      flattenColumns:
        previewLayout.flattenColumns ?? tableLayout.flattenColumns,
      flattenColumnsWidths:
        previewLayout.flattenColumnsWidths ?? tableLayout.flattenColumnsWidths,
      columnMotionPositions:
        previewLayout.columnMotionPositions ??
        tableLayout.columnMotionPositions,
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
