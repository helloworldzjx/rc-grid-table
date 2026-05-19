import classNames from 'classnames';
import React, {
  CSSProperties,
  memo,
  MouseEvent,
  ReactNode,
  useMemo,
} from 'react';

import CellContainer from '../CellContainer';
import { useTableContext } from '../context';
import { ColumnState } from '../interface';
import { SelectionCheckbox, SelectionRadio } from '../Selection';
import { useStyles } from '../style';
import { isExpandColumn, isSelectionColumn } from '../utils/const';
import { FixedInfo } from '../utils/fixedColumns';
import { getEllipsisTitle } from '../utils/handle';

interface BodyRowProps<T = any> {
  column: ColumnState<T>;
  rowData: T;
  rowIndex: number;
  fixedInfo: FixedInfo;
  indent?: number;
  expanded?: boolean;
  expandable?: boolean;
  rowSupportExpand?: boolean;
  isFirstDataColumn?: boolean;
}

function BodyCell({
  rowData,
  column,
  rowIndex,
  fixedInfo,
  indent = 0,
  expanded = false,
  expandable = false,
  rowSupportExpand = false,
  isFirstDataColumn = false,
}: BodyRowProps) {
  const {
    expandable: expandableConfig,
    rowSelection,
    selection,
    onTriggerExpand,
  } = useTableContext();

  const {
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
    expandControlCellCls,
    expandControlCls,
    selectionCellCls,
    expandTreeCellInnerCls,
    expandIconCls,
    expandIconExpandedCls,
    expandIconSpacedCls,
  } = useStyles();

  const mergedStyle = useMemo(() => {
    const cellProps = column.onCell?.(rowData, rowIndex) || {};
    const { rowSpan, colSpan, style: cellStyle, align } = cellProps;
    const style: CSSProperties = {};
    if (rowSpan && rowSpan > 1) {
      style.gridRow = `span ${rowSpan}`;
    }
    if (colSpan && colSpan > 1) {
      style.gridColumn = `span ${colSpan}`;
    }

    if (fixedInfo.fixStart !== null) {
      style.left = fixedInfo.fixStart as number;
    }
    if (fixedInfo.fixEnd !== null) {
      style.right = fixedInfo.fixEnd as number;
    }
    if (align || column.align) {
      style.textAlign = align || column.align;
    }

    return { ...style, ...column.style, ...cellStyle };
  }, [
    column.onCell,
    rowData,
    rowIndex,
    fixedInfo.fixStart,
    fixedInfo.fixEnd,
    column.style,
  ]);

  const isInternalExpandColumn = isExpandColumn(column);
  const isInternalSelectionColumn = isSelectionColumn(column);
  const cellProps = useMemo(() => {
    const restProps = { ...column.onCell?.(rowData, rowIndex) };
    delete restProps.rowSpan;
    delete restProps.colSpan;
    delete restProps.style;
    delete restProps.align;
    delete restProps.className;
    return restProps;
  }, [column.onCell, rowData, rowIndex]);
  const cellClassName = useMemo(
    () => column.onCell?.(rowData, rowIndex)?.className,
    [column.onCell, rowData, rowIndex],
  );

  const handleExpand = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (rowSupportExpand) {
      onTriggerExpand?.(rowData);
    }
  };

  const renderExpandIcon = (spaced = false) => {
    const iconProps = {
      expanded,
      expandable: rowSupportExpand,
      record: rowData,
      index: rowIndex,
      indent,
      onExpand: (_record: any, event: MouseEvent<HTMLElement>) =>
        handleExpand(event),
    };

    const iconNode = expandableConfig?.expandIcon ? (
      expandableConfig.expandIcon(iconProps)
    ) : (
      <button
        type="button"
        className={classNames(expandIconCls, {
          [expandIconExpandedCls]: expanded,
          [expandIconSpacedCls]: spaced || !rowSupportExpand,
        })}
        aria-label={expanded ? 'Collapse row' : 'Expand row'}
        aria-expanded={rowSupportExpand ? expanded : undefined}
        disabled={!rowSupportExpand}
        onClick={handleExpand}
      />
    );

    return (
      <div
        className={expandControlCls}
        style={{ justifyContent: expandableConfig?.align ?? 'center' }}
      >
        {iconNode}
      </div>
    );
  };

  const renderSelectionControl = () => {
    if (!selection || !rowSelection) return null;

    const type = rowSelection.type ?? 'checkbox';
    const checked = selection.isSelected(rowData);
    const controlProps =
      type === 'radio'
        ? rowSelection.getRadioProps?.(rowData) || {}
        : rowSelection.getCheckboxProps?.(rowData) || {};
    const disabled = !!controlProps.disabled;
    const originNode =
      type === 'radio' ? (
        <SelectionRadio
          {...controlProps}
          style={{
            ...controlProps.style,
            justifyContent: rowSelection.align ?? 'center',
          }}
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            selection.onSelectRecord(rowData, rowIndex, event)
          }
        />
      ) : (
        <SelectionCheckbox
          {...controlProps}
          style={{
            ...controlProps.style,
            justifyContent: rowSelection.align ?? 'center',
          }}
          checked={checked}
          indeterminate={selection.isHalfSelected(rowData)}
          disabled={disabled}
          onChange={(event) =>
            selection.onSelectRecord(rowData, rowIndex, event)
          }
        />
      );

    return (
      rowSelection.renderCell?.(checked, rowData, rowIndex, originNode) ??
      originNode
    );
  };

  let cellValue: ReactNode = undefined;
  if (
    !isInternalExpandColumn &&
    !isInternalSelectionColumn &&
    column.dataIndex &&
    typeof column.dataIndex === 'string'
  ) {
    cellValue = rowData?.[column.dataIndex];
  }
  if (
    !isInternalExpandColumn &&
    !isInternalSelectionColumn &&
    column.render &&
    typeof column.render === 'function'
  ) {
    cellValue = column.render?.(cellValue, rowData, rowIndex);
  }

  let childrenNode = isInternalExpandColumn
    ? renderExpandIcon()
    : isInternalSelectionColumn
    ? renderSelectionControl()
    : cellValue;
  const ellipsis = !!column.ellipsis;
  if (ellipsis) {
    const showTitle =
      typeof column.ellipsis === 'boolean'
        ? column.ellipsis
        : column.ellipsis?.showTitle;
    const elTitle = showTitle
      ? (getEllipsisTitle(childrenNode) as string)
      : undefined;
    childrenNode = (
      <div title={elTitle} className={cellEllipsisInnerCls}>
        {childrenNode}
      </div>
    );
  }

  if (
    !isInternalExpandColumn &&
    !isInternalSelectionColumn &&
    isFirstDataColumn &&
    expandable &&
    !expandableConfig?.expandedRowRender
  ) {
    childrenNode = (
      <div
        className={expandTreeCellInnerCls}
        style={{
          paddingInlineStart: indent * (expandableConfig?.indentSize ?? 15),
        }}
      >
        {renderExpandIcon(true)}
        <span>{childrenNode}</span>
      </div>
    );
  }

  return (
    <CellContainer
      className={classNames(
        cellCls,
        {
          [cellEllipsisCls]: ellipsis,
          [cellFixedStartCls]: fixedInfo.fixStart !== null,
          [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
          [cellFixedEndCls]: fixedInfo.fixEnd !== null,
          [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
          [expandControlCellCls]: isInternalExpandColumn,
          [selectionCellCls]: isInternalSelectionColumn,
        },
        column.className,
        cellClassName,
      )}
      style={mergedStyle}
      {...cellProps}
    >
      {childrenNode}
    </CellContainer>
  );
}

export default memo(BodyCell);
