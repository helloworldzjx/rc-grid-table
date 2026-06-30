import { useMemo } from 'react';

import { isNum } from '../../_utils/validate';
import type { FixedShadowContextProps } from '../contexts/FixedShadowContext';
import type { InternalColumnState } from '../internalInterface';

interface UseFixedShadowProps<T = any> {
  scrollLeft: number;
  maxScrollLeft: number;
  fixColumnsGapped?: boolean;
  flattenColumns: InternalColumnState<T>[];
  flattenColumnsWidths: number[];
}

const defaultFixedShadowContext: FixedShadowContextProps = {
  scrollLeft: 0,
  maxScrollLeft: 0,
  fixColumnsGapped: false,
};

export default function useFixedShadow<T = any>({
  scrollLeft,
  maxScrollLeft,
  fixColumnsGapped,
  flattenColumns,
  flattenColumnsWidths,
}: UseFixedShadowProps<T>): FixedShadowContextProps {
  return useMemo(() => {
    if (!fixColumnsGapped) {
      return defaultFixedShadowContext;
    }

    const fixedShadowScrollLeft = scrollLeft;
    const fixedShadowMaxScrollLeft = maxScrollLeft;
    const remainingScrollLeft =
      fixedShadowMaxScrollLeft - fixedShadowScrollLeft;
    let activeFixedStartShadowOffset: number | undefined;
    let activeFixedEndShadowOffset: number | undefined;
    let fixedStartShadowOffset = 0;
    let fixedEndShadowOffset = 0;

    if (fixedShadowScrollLeft > 0) {
      for (let index = 0; index < flattenColumns.length; index += 1) {
        const column = flattenColumns[index];
        if (column.fixed !== 'start') {
          const width = flattenColumnsWidths[index];
          fixedStartShadowOffset += isNum(width) ? width : 0;
          continue;
        }

        const nextColumn = flattenColumns[index + 1];
        if (nextColumn?.fixed === 'start') continue;

        if (fixedShadowScrollLeft >= fixedStartShadowOffset) {
          activeFixedStartShadowOffset = fixedStartShadowOffset;
        }
      }
    }

    if (remainingScrollLeft > 0) {
      for (let index = flattenColumns.length - 1; index >= 0; index -= 1) {
        const column = flattenColumns[index];
        if (column.fixed !== 'end') {
          const width = flattenColumnsWidths[index];
          fixedEndShadowOffset += isNum(width) ? width : 0;
          continue;
        }

        const prevColumn = flattenColumns[index - 1];
        if (prevColumn?.fixed === 'end') continue;

        if (remainingScrollLeft >= fixedEndShadowOffset) {
          activeFixedEndShadowOffset = fixedEndShadowOffset;
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
