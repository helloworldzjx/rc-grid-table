import React, { CSSProperties, ElementType, ReactNode, useMemo } from 'react';

import { useColumnSortPreviewLayoutContext } from './columnSortPreviewLayoutContext';

const getGridTemplateColumns = (widths?: number[]) =>
  widths?.length ? `${widths.join('px ')}px` : '';

interface ColumnPreviewStyleScopeProps {
  children?: ReactNode;
  className?: string;
  component: ElementType;
  columnsWidthCssVar: string;
  columnsWidthTotalCssVar: string;
  gridTemplateColumns: string;
  columnsWidthTotal: number;
  style?: CSSProperties;
}

const ColumnPreviewStyleScope = ({
  children,
  className,
  component: Component,
  columnsWidthCssVar,
  columnsWidthTotalCssVar,
  gridTemplateColumns,
  columnsWidthTotal,
  style: originStyle,
}: ColumnPreviewStyleScopeProps) => {
  const {
    flattenColumnsWidths: previewWidths,
    columnsWidthTotal: previewColumnsWidthTotal,
  } = useColumnSortPreviewLayoutContext();
  const previewGridTemplateColumns = getGridTemplateColumns(previewWidths);

  const style = useMemo<CSSProperties>(
    () => ({
      ...originStyle,
      [`${columnsWidthCssVar}`]:
        previewGridTemplateColumns || gridTemplateColumns,
      [`${columnsWidthTotalCssVar}`]: `${
        previewColumnsWidthTotal ?? columnsWidthTotal
      }px`,
    }),
    [
      columnsWidthCssVar,
      columnsWidthTotal,
      columnsWidthTotalCssVar,
      gridTemplateColumns,
      originStyle,
      previewColumnsWidthTotal,
      previewGridTemplateColumns,
    ],
  );

  return (
    <Component className={className} style={style}>
      {children}
    </Component>
  );
};

export { getGridTemplateColumns };

export default ColumnPreviewStyleScope;
