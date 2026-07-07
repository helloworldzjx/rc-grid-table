import { useMemo } from 'react';

import { isNum } from '../../_utils/validate';
import type { FixedType } from '../interface';
import type { StickyOffsets } from '../internalInterface';

function getFixColumnsGapped(flattenColumns: readonly { fixed?: FixedType }[]) {
  const columnFixedList: Array<FixedType | undefined> = [];
  const columnFixedSet = new Set<FixedType>();
  let lastStartIndex = -1;
  let firstEndIndex = -1;

  for (let i = 0; i < flattenColumns.length; i += 1) {
    const fixed = flattenColumns[i].fixed;
    columnFixedList.push(fixed);

    if (fixed) {
      columnFixedSet.add(fixed);
    }
    if (fixed === 'start') {
      lastStartIndex = i;
    }
    if (fixed === 'end' && firstEndIndex === -1) {
      firstEndIndex = i;
    }
  }

  if (columnFixedSet.has('start')) {
    for (let i = 0; i <= lastStartIndex; i += 1) {
      if (columnFixedList[i] !== 'start') {
        return true;
      }
    }
  }

  if (columnFixedSet.has('end')) {
    for (let i = firstEndIndex; i < columnFixedList.length; i += 1) {
      if (columnFixedList[i] !== 'end') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get sticky column offset width
 */
function useStickyOffsets(
  colWidths: number[],
  flattenColumns: readonly { fixed?: FixedType }[],
) {
  const stickyOffsets: StickyOffsets = useMemo(() => {
    const columnCount = flattenColumns.length;

    const startOffsets: number[] = [];
    const endOffsets: number[] = new Array(columnCount);
    let startTotal = 0;
    let endTotal = 0;
    let hasStartFixedColumns = false;
    let hasEndFixedColumns = false;

    for (let i = 0; i < columnCount; i += 1) {
      startOffsets[i] = startTotal;

      if (flattenColumns[i].fixed === 'start') {
        const width = colWidths[i];
        startTotal += isNum(width) ? width : 0;
        hasStartFixedColumns = true;
      }
    }

    for (let i = columnCount - 1; i >= 0; i -= 1) {
      endOffsets[i] = endTotal;

      if (flattenColumns[i].fixed === 'end') {
        const width = colWidths[i];
        endTotal += isNum(width) ? width : 0;
        hasEndFixedColumns = true;
      }
    }

    return {
      start: startOffsets,
      end: endOffsets,
      widths: colWidths,
      hasFixColumns: hasStartFixedColumns || hasEndFixedColumns,
      hasFixStartColumns: hasStartFixedColumns,
      hasFixEndColumns: hasEndFixedColumns,
      fixColumnsGapped: getFixColumnsGapped(flattenColumns),
    };
  }, [colWidths, flattenColumns]);

  return stickyOffsets;
}

export default useStickyOffsets;
