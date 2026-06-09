import React, { CSSProperties, useMemo } from 'react';

import { useRowSelectionContext } from '../rowSelectionContext';
import SelectionCheckbox from './Checkbox';
import SelectionRadio from './Radio';

interface BodySelectionCellProps<T = any> {
  rowData: T;
  rowIndex: number;
}

function BodySelectionCell<T = any>({
  rowData,
  rowIndex,
}: BodySelectionCellProps<T>) {
  const { rowSelection, selection } = useRowSelectionContext<T>();

  const selectionType = rowSelection?.type ?? 'checkbox';
  const selectionChecked = selection?.isSelected(rowData) ?? false;

  const selectionControlProps = useMemo(
    () =>
      selectionType === 'radio'
        ? rowSelection?.getRadioProps?.(rowData) || {}
        : rowSelection?.getCheckboxProps?.(rowData) || {},
    [rowData, rowSelection, selectionType],
  );

  const mergedSelectionControlStyle = useMemo<CSSProperties>(
    () => ({
      ...selectionControlProps.style,
      justifyContent: rowSelection?.align ?? 'center',
    }),
    [selectionControlProps.style, rowSelection?.align],
  );

  if (!selection || !rowSelection) {
    return null;
  }

  const disabled = !!selectionControlProps.disabled;
  const originNode =
    selectionType === 'radio' ? (
      <SelectionRadio
        {...selectionControlProps}
        style={mergedSelectionControlStyle}
        checked={selectionChecked}
        disabled={disabled}
        onChange={(event) => selection.onSelectRecord(rowData, rowIndex, event)}
      />
    ) : (
      <SelectionCheckbox
        {...selectionControlProps}
        style={mergedSelectionControlStyle}
        checked={selectionChecked}
        indeterminate={selection.isHalfSelected(rowData)}
        disabled={disabled}
        onChange={(event) => selection.onSelectRecord(rowData, rowIndex, event)}
      />
    );

  return (
    rowSelection.renderCell?.(
      selectionChecked,
      rowData,
      rowIndex,
      originNode,
    ) ?? originNode
  );
}

export default BodySelectionCell;
