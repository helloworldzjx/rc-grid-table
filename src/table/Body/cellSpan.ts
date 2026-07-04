import type { CSSProperties } from 'react';

import { isNum } from '../../_utils/validate';
import { getCellSpan } from '../utils/handle';
import type { BodyRenderMode } from './interface';

export type BodyCellRenderState = 'hidden' | 'placeholder' | 'content';

interface BodyCellSpanInfoProps {
  renderMode: BodyRenderMode;
  rowSpan?: number;
  colSpan?: number;
  colIndex: number;
  getRowSpanHeight?: (rowSpan: number) => number;
}

export const getBodyCellSpanInfo = ({
  renderMode,
  rowSpan: rawRowSpan,
  colSpan: rawColSpan,
  colIndex,
  getRowSpanHeight,
}: BodyCellSpanInfoProps) => {
  const colSpan = getCellSpan(rawColSpan);
  const rowSpan = getCellSpan(rawRowSpan);
  const rowSpanStart = isNum(rowSpan) && rowSpan > 1;
  const style: CSSProperties = {};

  const createSpanInfo = (renderState: BodyCellRenderState) => ({
    rowSpan,
    colSpan,
    renderState,
    style,
  });

  if (colSpan === 0) {
    return createSpanInfo('hidden');
  }

  if (renderMode === 'normal') {
    if (rowSpan === 0) {
      return createSpanInfo('hidden');
    }

    if (rowSpanStart) {
      style.gridRow = `span ${rowSpan}`;
    }
    if (isNum(colSpan) && colSpan > 1) {
      style.gridColumn = `span ${colSpan}`;
    }

    return createSpanInfo('content');
  }

  style.gridColumn = `${colIndex + 1} / span ${colSpan || 1}`;

  if (renderMode === 'rowSpanOverlay') {
    if (!rowSpanStart) {
      return createSpanInfo('placeholder');
    }

    style.height = getRowSpanHeight?.(rowSpan);
    return createSpanInfo('content');
  }

  if (rowSpan === 0) {
    return createSpanInfo('hidden');
  }

  if (rowSpanStart) {
    return createSpanInfo('placeholder');
  }

  return createSpanInfo('content');
};
