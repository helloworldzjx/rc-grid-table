import { isNum, isObject } from '../../_utils/validate';
import type { TableVirtualConfig } from '../interface';

export const getVirtualFixedHeightConfig = (
  virtual: boolean | TableVirtualConfig,
  useRowHeight = true,
) => {
  if (!isObject(virtual)) {
    return {
      rowHeight: undefined,
      expandedRowHeight: undefined,
    };
  }

  const rowHeight =
    useRowHeight && isNum(virtual.rowHeight) && virtual.rowHeight > 0
      ? virtual.rowHeight
      : undefined;
  const expandedRowHeight =
    virtual.expandedRowHeight === false
      ? undefined
      : isNum(virtual.expandedRowHeight) && virtual.expandedRowHeight > 0
      ? virtual.expandedRowHeight
      : rowHeight;

  return {
    rowHeight,
    expandedRowHeight,
  };
};
