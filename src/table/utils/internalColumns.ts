import type {
  ColumnType,
  ColumnsType,
  ExpandableConfig,
  RowSortableConfig,
  SizeType,
  TableRowSelection,
} from '../interface';
import {
  EXPAND_COLUMN,
  INTERNAL_EXPAND_COLUMN_KEY,
  INTERNAL_ROW_SORT_COLUMN_KEY,
  INTERNAL_SELECTION_COLUMN_KEY,
  ROW_SORT_COLUMN,
  SELECTION_COLUMN,
  getDefaultInternalColumnWidth,
  isExpandColumn,
  isRowSortColumn,
  isSelectionColumn,
} from './const';

const stripInternalColumns = <T = any>(
  columns: ColumnsType<T>,
): ColumnsType<T> => {
  return columns.reduce((result: ColumnsType<T>, column) => {
    if (
      isExpandColumn(column) ||
      isSelectionColumn(column) ||
      isRowSortColumn(column)
    ) {
      return result;
    }

    const realColumn = column as ColumnType<T>;
    if (realColumn.children?.length) {
      result.push({
        ...realColumn,
        children: stripInternalColumns(realColumn.children),
      } as ColumnType<T>);
    } else {
      result.push(realColumn as ColumnType<T>);
    }

    return result;
  }, []);
};

export const mergeInternalColumns = <T = any>(
  size: SizeType,
  columns: ColumnsType<T> = [],
  expandable: ExpandableConfig<T> = {},
  rowSelection?: TableRowSelection<T>,
  rowSortable?: RowSortableConfig<T>,
): ColumnsType<T> => {
  const {
    columnTitle,
    columnOverlayTitle,
    columnWidth,
    expandedRowRender,
    fixed,
    resizeDisabled = true,
    resizeMinWidth,
    showExpandColumn = true,
  } = expandable;
  const hasExpandedRowRender = typeof expandedRowRender === 'function';
  const shouldShowExpandColumn = hasExpandedRowRender && showExpandColumn;
  const shouldShowSelectionColumn = !!rowSelection;
  const shouldShowRowSortColumn = !!rowSortable;

  if (
    !shouldShowExpandColumn &&
    !shouldShowSelectionColumn &&
    !shouldShowRowSortColumn
  ) {
    return stripInternalColumns(columns);
  }

  const expandColumn = shouldShowExpandColumn
    ? ({
        ...EXPAND_COLUMN,
        key: INTERNAL_EXPAND_COLUMN_KEY,
        title: columnTitle,
        columnOverlayTitle,
        width: columnWidth ?? getDefaultInternalColumnWidth(size),
        align: expandable.align ?? 'center',
        fixed,
        resizeDisabled,
        resizeMinWidth,
      } as ColumnType<T>)
    : null;
  const selectionColumn = shouldShowSelectionColumn
    ? ({
        ...SELECTION_COLUMN,
        key: INTERNAL_SELECTION_COLUMN_KEY,
        title: '',
        columnOverlayTitle: rowSelection?.columnOverlayTitle,
        width: rowSelection?.columnWidth ?? getDefaultInternalColumnWidth(size),
        align: rowSelection?.align ?? 'center',
        fixed: rowSelection?.fixed,
        resizeDisabled: rowSelection?.resizeDisabled ?? true,
        resizeMinWidth: rowSelection?.resizeMinWidth,
        onCell: rowSelection?.onCell,
      } as ColumnType<T>)
    : null;
  const rowSortColumn = shouldShowRowSortColumn
    ? ({
        ...ROW_SORT_COLUMN,
        key: INTERNAL_ROW_SORT_COLUMN_KEY,
        title: rowSortable?.columnTitle,
        columnOverlayTitle: rowSortable?.columnOverlayTitle,
        width: rowSortable?.columnWidth ?? getDefaultInternalColumnWidth(size),
        align: rowSortable?.align ?? 'center',
        fixed: rowSortable?.fixed,
        resizeDisabled: true,
        resizeMinWidth: rowSortable?.resizeMinWidth,
      } as ColumnType<T>)
    : null;

  let expandInserted = false;
  let selectionInserted = false;
  let rowSortInserted = false;
  const nextColumns = columns.reduce((result: ColumnsType<T>, column) => {
    if (isRowSortColumn(column)) {
      if (rowSortColumn) {
        result.push(rowSortColumn);
        rowSortInserted = true;
      }
      return result;
    }

    if (isExpandColumn(column)) {
      if (expandColumn) {
        result.push(expandColumn);
        expandInserted = true;
      }
    } else if (isSelectionColumn(column)) {
      if (selectionColumn) {
        result.push(selectionColumn);
        selectionInserted = true;
      }
    } else {
      result.push(column);
    }

    return result;
  }, []);

  if (expandColumn && !expandInserted) {
    if (selectionColumn && selectionInserted) {
      const selectionIndex = nextColumns.findIndex(isSelectionColumn);
      nextColumns.splice(selectionIndex + 1, 0, expandColumn);
    } else {
      nextColumns.unshift(expandColumn);
    }
  }

  if (selectionColumn && !selectionInserted) {
    const expandIndex = nextColumns.findIndex(isExpandColumn);
    if (expandIndex >= 0) {
      nextColumns.splice(expandIndex, 0, selectionColumn);
    } else {
      nextColumns.unshift(selectionColumn);
    }
  }

  if (rowSortColumn && !rowSortInserted) {
    nextColumns.unshift(rowSortColumn);
  }

  return nextColumns;
};
