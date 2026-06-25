export interface BodyHoverInterval {
  start: number;
  end: number;
}

export interface BodyHoverRowMeta {
  rowIndex: number;
  hoverable: boolean;
}

export interface BodyHoverCellMeta {
  rowIndex: number;
  colIndex?: number;
  hoverable: boolean;
  spanSource: boolean;
  interval: BodyHoverInterval;
}

export const getBodyHoverInterval = (
  rowIndex: number,
  rowSpan?: number,
): BodyHoverInterval => {
  if (typeof rowSpan === 'number' && rowSpan > 1) {
    return {
      start: rowIndex,
      end: rowIndex + rowSpan - 1,
    };
  }

  return {
    start: rowIndex,
    end: rowIndex,
  };
};

export const intersectsBodyHoverInterval = (
  current: BodyHoverInterval,
  target: BodyHoverInterval,
) => current.start <= target.end && current.end >= target.start;
