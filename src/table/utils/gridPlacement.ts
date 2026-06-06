import type { CSSProperties } from 'react';

import { isNum } from '../../_utils/validate';

interface NormalSpanStyleProps {
  rowSpan?: number;
  colSpan?: number;
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
