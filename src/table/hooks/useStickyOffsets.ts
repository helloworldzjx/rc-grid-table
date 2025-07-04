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

    const getOffsets = (startIndex: number, endIndex: number, offset: number): [offsets: number[], hasFixedColumns: boolean] => {
      const offsets: number[] = [];
      let total = 0;

      for (let i = startIndex; i !== endIndex; i += offset) {
        offsets.push(total);

        if (flattenColumns[i].fixed) {
          total += colWidths[i] || 0;
        }
      }

      return [
        offsets,
        !!total,
      ];
    };

    const [startOffsets, hasStartFixedColumns] = getOffsets(0, columnCount, 1);
    const [endOffsets, hasEndFixedColumns] = getOffsets(columnCount - 1, -1, -1);

    return {
      start: startOffsets,
      end: endOffsets.reverse(),
      widths: colWidths,
      hasFixColumns: hasStartFixedColumns || hasEndFixedColumns,
    };
  }, [colWidths, flattenColumns]);

  return stickyOffsets;
}

export default useStickyOffsets;