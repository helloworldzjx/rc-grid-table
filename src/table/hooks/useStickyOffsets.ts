import { useMemo } from 'react';

import type { ColumnType, StickyOffsets } from '../interface';

/**
 * Get sticky column offset width
 */
function useStickyOffsets<RecordType>(
  colWidths: number[],
  flattenColumns: readonly ColumnType<RecordType>[],
) {
  const stickyOffsets: StickyOffsets = useMemo(() => {
    const columnCount = flattenColumns.length;

    const getOffsets = (startIndex: number, endIndex: number, offset: number): [offsets: number[], hasFixedColumns: boolean, fixColumnsGapped: boolean] => {
      const offsets: number[] = [];
      let total = 0;
      let hasFixedColumns = false;
      let fixColumnsGapped = false;

      for (let i = startIndex; i !== endIndex; i += offset) {
        offsets.push(total);

        if (flattenColumns[i].fixed) {
          total += colWidths[i] || 0;

          const fixed = offset === 1 ? 'start' : 'end'
          if(flattenColumns[i].fixed === fixed) {
            hasFixedColumns = true
          }
          const prevIndex = i - offset
          if(flattenColumns[prevIndex] && flattenColumns[i].fixed === fixed && !flattenColumns[prevIndex].fixed) {
            fixColumnsGapped = true
          }
        }
      }

      return [
        offsets,
        hasFixedColumns,
        fixColumnsGapped,
      ];
    };

    const [startOffsets, hasStartFixedColumns, startFixColumnsGapped] = getOffsets(0, columnCount, 1);
    const [endOffsets, hasEndFixedColumns, endFixColumnsGapped] = getOffsets(columnCount - 1, -1, -1);

    return {
      start: startOffsets,
      end: endOffsets.reverse(),
      widths: colWidths,
      hasFixColumns: hasStartFixedColumns || hasEndFixedColumns,
      hasFixStartColumns: hasStartFixedColumns,
      hasFixEndColumns: hasEndFixedColumns,
      fixColumnsGapped: startFixColumnsGapped || endFixColumnsGapped
    };
  }, [colWidths, flattenColumns]);

  return stickyOffsets;
}

export default useStickyOffsets;