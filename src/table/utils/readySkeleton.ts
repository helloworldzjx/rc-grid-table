import type {
  SizeType,
  TableReadySkeleton,
  TableReadySkeletonConfig,
} from '../interface';
import { distribute } from './calc';
import { getDefaultInternalColumnWidth } from './const';

const MIN_COLUMN_WIDTH = 150;

const getBodyRowMinHeight = (size: SizeType) =>
  getDefaultInternalColumnWidth(size);

export const normalizeReadySkeletonConfig = (
  readySkeleton?: TableReadySkeleton,
): TableReadySkeletonConfig | undefined => {
  if (readySkeleton === true) return {};
  if (readySkeleton && typeof readySkeleton === 'object') return readySkeleton;

  return undefined;
};

export const getReadySkeletonColumnsCount = (containerWidth: number) => {
  return Math.floor(containerWidth / MIN_COLUMN_WIDTH);
};

export const getReadySkeletonRowCount = (
  bodyHeight: number,
  size: SizeType,
) => {
  const minRowHeigh = getBodyRowMinHeight(size);
  return Math.floor(bodyHeight / minRowHeigh);
};

export const getReadySkeletonBodyRowsHeight = (
  bodyHeight: number,
  size: SizeType,
) => {
  const rowCount = getReadySkeletonRowCount(bodyHeight, size);
  return distribute(bodyHeight, rowCount);
};

export const getReadySkeletonHeadRowsHeight = (
  bodyHeight: number,
  size: SizeType,
  config?: TableReadySkeletonConfig,
) => {
  const values = getReadySkeletonBodyRowsHeight(bodyHeight, size);
  const headRowHeight = Math.max(values[0], getBodyRowMinHeight(size));

  return config?.showFilterRow
    ? [headRowHeight, headRowHeight]
    : [headRowHeight];
};

export const getReadySkeletonHeadHeight = (
  bodyHeight: number,
  size: SizeType,
  config?: TableReadySkeletonConfig,
) => {
  return getReadySkeletonHeadRowsHeight(bodyHeight, size, config).reduce(
    (sum, height) => sum + height,
    0,
  );
};

export const getReadySkeletonHeightInfo = (
  bodyHeight: number,
  size: SizeType,
  config?: TableReadySkeletonConfig,
) => {
  const values = getReadySkeletonBodyRowsHeight(bodyHeight, size);
  const headRowsHeight = getReadySkeletonHeadRowsHeight(
    bodyHeight,
    size,
    config,
  );
  const head = headRowsHeight.reduce((sum, height) => sum + height, 0);

  return {
    head,
    headRowsHeight,
    bodyRowsHeight: values,
    bodyCount: values.length,
  };
};

export const getHeadSkeletonLineWidth = (columnIndex: number) => {
  const oddVisualColumn = columnIndex % 2 === 0;

  return oddVisualColumn ? 40 : 60;
};

export const getBodySkeletonLineWidth = (
  rowIndex: number,
  showFilterRow?: boolean,
) => {
  const oddVisualRow = rowIndex % 2 === 0;

  if (showFilterRow) {
    return oddVisualRow ? 75 : 100;
  }

  return oddVisualRow ? 100 : 75;
};
