import { isNum } from '../../_utils/validate';
import type { FixedInfo } from './fixedColumns';

const sumWidths = (widths: readonly number[], start: number, end: number) => {
  let total = 0;

  for (let index = start; index <= end; index += 1) {
    const width = widths[index];
    total += isNum(width) ? width : 0;
  }

  return total;
};

export const getColumnMotionStartPositions = (
  widths: readonly number[] = [],
) => {
  const positions: number[] = [];
  let position = 0;

  for (let index = 0; index < widths.length; index += 1) {
    positions[index] = position;

    const width = widths[index];
    position += isNum(width) ? width : 0;
  }

  return positions;
};

export const getColumnMotionPositionFromStartPositions = (
  positions: readonly number[],
  colStart: number,
  fixedInfo?: Pick<FixedInfo, 'fixStart' | 'fixEnd'>,
) => {
  const start = Math.max(colStart, 0);
  const normalPosition = positions[start] ?? 0;

  if (fixedInfo?.fixStart !== null && fixedInfo?.fixStart !== undefined) {
    return Math.max(normalPosition, fixedInfo.fixStart);
  }

  if (fixedInfo?.fixEnd !== null && fixedInfo?.fixEnd !== undefined) {
    return normalPosition;
  }

  return normalPosition;
};

export const getColumnMotionPosition = (
  widths: readonly number[],
  colStart: number,
  _colEnd: number,
  fixedInfo?: Pick<FixedInfo, 'fixStart' | 'fixEnd'>,
) => {
  const start = Math.max(colStart, 0);
  const normalPosition = sumWidths(widths, 0, start - 1);

  if (fixedInfo?.fixStart !== null && fixedInfo?.fixStart !== undefined) {
    return Math.max(normalPosition, fixedInfo.fixStart);
  }

  if (fixedInfo?.fixEnd !== null && fixedInfo?.fixEnd !== undefined) {
    return normalPosition;
  }

  return normalPosition;
};
