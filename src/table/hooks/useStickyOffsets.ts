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
      let fixColumnsGapped = false

      for (let i = startIndex; i !== endIndex; i += offset) {
        offsets.push(total);

        if (flattenColumns[i].fixed) {
          total += colWidths[i] || 0;

          const prevIndex = i - offset
          const fixed = offset === 1 ? 'start' : 'end'
          if(flattenColumns[prevIndex] && flattenColumns[i].fixed === fixed && !flattenColumns[prevIndex].fixed) {
            fixColumnsGapped = true
          }
        }
      }

      return [
        offsets,
        !!total,
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
      fixColumnsGapped: startFixColumnsGapped || endFixColumnsGapped
    };
  }, [colWidths, flattenColumns]);

  return stickyOffsets;
}

export default useStickyOffsets;