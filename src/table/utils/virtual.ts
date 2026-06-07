import { isNum } from '../../_utils/validate';
import type { TableVirtualConfig } from '../interface';

export const getVirtualFixedHeightConfig = (
  virtual: boolean | TableVirtualConfig | undefined,
  useRowHeight = true,
) => {
  if (typeof virtual !== 'object' || virtual === null) {
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
