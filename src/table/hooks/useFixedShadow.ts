import { useMemo } from 'react';

import { isNum } from '../../_utils/validate';
import type { FixedShadowContextProps } from '../fixedShadowContext';
import type { ColumnState } from '../interface';

interface UseFixedShadowProps<T = any> {
  scrollLeft: number;
  maxScrollLeft: number;
  fixColumnsGapped?: boolean;
  flattenColumns: ColumnState<T>[];
  flattenColumnsWidths: number[];
}

export default function useFixedShadow<T = any>({
  scrollLeft,
  maxScrollLeft,
  fixColumnsGapped,
  flattenColumns,
  flattenColumnsWidths,
}: UseFixedShadowProps<T>): FixedShadowContextProps {
  return useMemo(() => {
    const fixedShadowScrollLeft = fixColumnsGapped ? scrollLeft : 0;
    const fixedShadowMaxScrollLeft = fixColumnsGapped ? maxScrollLeft : 0;
    let activeFixedStartShadowOffset: number | undefined;
    let activeFixedEndShadowOffset: number | undefined;

    if (fixColumnsGapped) {
      flattenColumns.forEach((column, index) => {
        if (column.fixed !== 'start') return;

        const nextColumn = flattenColumns[index + 1];
        if (nextColumn?.fixed === 'start') return;

        let offset = 0;
        for (let i = 0; i < index; i += 1) {
          if (flattenColumns[i].fixed !== 'start') {
            const width = flattenColumnsWidths[i];
            offset += isNum(width) ? width : 0;
          }
        }
        if (fixedShadowScrollLeft > 0 && fixedShadowScrollLeft >= offset) {
          activeFixedStartShadowOffset = offset;
        }
      });

      for (let index = flattenColumns.length - 1; index >= 0; index -= 1) {
        const column = flattenColumns[index];
        if (column.fixed !== 'end') continue;

        const prevColumn = flattenColumns[index - 1];
        if (prevColumn?.fixed === 'end') continue;

        let offset = 0;
        for (let i = flattenColumns.length - 1; i > index; i -= 1) {
          if (flattenColumns[i].fixed !== 'end') {
            const width = flattenColumnsWidths[i];
            offset += isNum(width) ? width : 0;
          }
        }
        const remainingScrollLeft =
          fixedShadowMaxScrollLeft - fixedShadowScrollLeft;
        if (remainingScrollLeft > 0 && remainingScrollLeft >= offset) {
          activeFixedEndShadowOffset = offset;
        }
      }
    }

    return {
      scrollLeft: fixedShadowScrollLeft,
      maxScrollLeft: fixedShadowMaxScrollLeft,
      fixColumnsGapped,
      activeFixedStartShadowOffset,
      activeFixedEndShadowOffset,
    };
  }, [
    fixColumnsGapped,
    flattenColumns,
    flattenColumnsWidths,
    maxScrollLeft,
    scrollLeft,
  ]);
}
