import type { CSSProperties } from 'react';

import { isNum } from '../../_utils/validate';
import { getCellSpan } from '../utils/handle';
import type { BodyRenderMode } from './interface';

interface BodyCellSpanInfoProps {
  renderMode: BodyRenderMode;
  rowSpan?: number;
  colSpan?: number;
  colIndex?: number;
  getRowSpanHeight?: (rowSpan: number) => number;
}

export const isVirtualBodyRenderMode = (renderMode: BodyRenderMode) =>
  renderMode !== 'normal';

export const getBodyCellSpanInfo = ({
  renderMode,
  rowSpan: rawRowSpan,
  colSpan: rawColSpan,
  colIndex,
  getRowSpanHeight,
}: BodyCellSpanInfoProps) => {
  const rowSpan = getCellSpan(rawRowSpan);
  const colSpan = getCellSpan(rawColSpan);
  const style: CSSProperties = {};
  let hidden = false;

  if (renderMode === 'normal') {
    hidden = rowSpan === 0 || colSpan === 0;

    if (isNum(rowSpan) && rowSpan > 1) {
      style.gridRow = `span ${rowSpan}`;
    }
    if (isNum(colSpan) && colSpan > 1) {
      style.gridColumn = `span ${colSpan}`;
    }
  } else {
    hidden =
      renderMode === 'rowSpanOverlay'
        ? rowSpan <= 1 || colSpan === 0
        : rowSpan === 0 || colSpan === 0 || rowSpan > 1;

    if (colIndex !== undefined) {
      style.gridColumn = `${colIndex + 1} / span ${colSpan || 1}`;
    }
    if (renderMode === 'rowSpanOverlay') {
      style.height = getRowSpanHeight?.(rowSpan);
    }
  }

  return {
    rowSpan,
    colSpan,
    hidden,
    style,
  };
};
