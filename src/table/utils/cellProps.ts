import classNames from 'classnames';

import type { CellAttributes, SpanCellAttributes } from '../interface';

const omitSpanProps = (props: CellAttributes): CellAttributes => {
  const nextProps = { ...props } as SpanCellAttributes;

  delete nextProps.rowSpan;
  delete nextProps.colSpan;

  return nextProps;
};

export const mergeCellProps = (
  tableCellProps: CellAttributes = {},
  columnCellProps: SpanCellAttributes = {},
): SpanCellAttributes => {
  const cleanTableCellProps = omitSpanProps(tableCellProps);
  const mergedCellProps = { ...cleanTableCellProps, ...columnCellProps };

  if (cleanTableCellProps.className || columnCellProps.className) {
    mergedCellProps.className = classNames(
      cleanTableCellProps.className,
      columnCellProps.className,
    );
  }

  if (cleanTableCellProps.style || columnCellProps.style) {
    mergedCellProps.style = {
      ...cleanTableCellProps.style,
      ...columnCellProps.style,
    };
  }

  return mergedCellProps;
};
