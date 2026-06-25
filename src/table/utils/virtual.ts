import { isNum, isObject } from '../../_utils/validate';
import type { TableVirtualConfig } from '../interface';

export const getVirtualFixedHeightConfig = (
  virtual: boolean | TableVirtualConfig,
) => {
  if (!isObject(virtual)) {
    return {
      rowHeight: undefined,
      expandedRowHeight: undefined,
    };
  }

  const virtualConfig = virtual as TableVirtualConfig;

  const rowHeight =
    isNum(virtualConfig.rowHeight) && virtualConfig.rowHeight > 0
      ? virtualConfig.rowHeight
      : undefined;
  const expandedRowHeight =
    virtualConfig.expandedRowHeight === false
      ? undefined
      : isNum(virtualConfig.expandedRowHeight) &&
        virtualConfig.expandedRowHeight > 0
      ? virtualConfig.expandedRowHeight
      : rowHeight;

  return {
    rowHeight,
    expandedRowHeight,
  };
};
