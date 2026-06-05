import type { CSSProperties } from 'react';

import { isNum } from '../../_utils/validate';

interface NormalSpanStyleProps {
  rowSpan?: number;
  colSpan?: number;
}

interface VirtualColumnPlacementStyleProps extends NormalSpanStyleProps {
  rowIndex?: number;
  colStart?: number;
}

export const getNormalSpanStyle = ({
  rowSpan,
  colSpan,
}: NormalSpanStyleProps): CSSProperties => {
  const style: CSSProperties = {};

  if (isNum(rowSpan) && rowSpan > 1) {
    style.gridRow = `span ${rowSpan}`;
  }
  if (isNum(colSpan) && colSpan > 1) {
    style.gridColumn = `span ${colSpan}`;
  }

  return style;
};

export const getVirtualColumnPlacementStyle = ({
  rowIndex,
  colStart,
  rowSpan,
  colSpan,
}: VirtualColumnPlacementStyleProps): CSSProperties => {
  const style: CSSProperties = {};

  if (isNum(rowIndex)) {
    style.gridRow =
      isNum(rowSpan) && rowSpan > 1
        ? `${rowIndex + 1} / span ${rowSpan}`
        : `${rowIndex + 1}`;
  }

  if (isNum(colStart)) {
    style.gridColumn =
      isNum(colSpan) && colSpan > 1
        ? `${colStart + 1} / span ${colSpan}`
        : `${colStart + 1}`;
  }

  return style;
};
