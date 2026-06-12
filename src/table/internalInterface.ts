import type {
  CSSProperties,
  Dispatch,
  Key,
  MouseEvent,
  ReactNode,
  SetStateAction,
} from 'react';

import type {
  ColumnInfo,
  ColumnsConfig,
  ColumnState,
  CustomizeComponent,
  DataSortConfig,
  DataSortOrder,
  ExpandableConfig,
  RowKey,
  RowSortableConfig,
  TableComponents,
  TableProps,
  TableRowSelection,
} from './interface';

export interface CellType<T = any> {
  key?: Key;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  column?: InternalColumnState<T>;
  colSpan?: number;
  rowSpan?: number;
  /** Only used for table header */
  hasSubColumns?: boolean;
  colStart?: number;
  colEnd?: number;
}

export type GetComponent = (
  path: readonly string[],
  defaultComponent?: CustomizeComponent,
) => CustomizeComponent;

export interface StickyOffsets {
  start: readonly number[];
  end: readonly number[];
  widths: readonly number[];
  isSticky?: boolean;
  hasFixColumns: boolean;
  hasFixStartColumns: boolean;
  hasFixEndColumns: boolean;
  fixColumnsGapped: boolean;
}

export type ColumnStateConfigType = Pick<
  ColumnInfo,
  | 'key'
  | 'parentKey'
  | 'ancestorKeys'
  | 'depth'
  | 'order'
  | 'distribute'
  | 'visible'
  | 'hasChildren'
  | 'widthManuallyChanged'
  | 'autoWidthLocked'
>;

export type InternalColumnState<T = any> = Omit<ColumnInfo<T>, 'children'> & {
  children?: InternalColumnState<T>[];
};

export interface DataSortContextProps {
  dataSort?: DataSortConfig;
  dataSortOrders?: DataSortOrder[];
}

type TableFeatureContextKey =
  | 'prefixCls'
  | 'components'
  | 'dataSort'
  | 'expandable'
  | 'rowSelection'
  | 'rowSortable'
  | 'sortableColumns';

export interface TableContextProps<T = any>
  extends Omit<TableProps<T>, TableFeatureContextKey> {
  // base props
  rowKey: RowKey<T>;

  updateLockContainerWidth: Dispatch<SetStateAction<boolean>>;
  containerWidth?: number;
  containerHeight?: number;
  initialized?: boolean;
  columns?: InternalColumnState<T>[];
  flattenColumns?: InternalColumnState<T>[];
  flattenColumnsWidths?: number[];
  columnsWidthTotal: number;
  updateFlattenColumnsWidths: Dispatch<SetStateAction<number[]>>;
  fixedOffset: StickyOffsets;
  hasFixedColumns: boolean;
  fixColumnsGapped: boolean;
  columnsState: ColumnState<T>[];
  updateColumnsState: Dispatch<SetStateAction<ColumnState<T>[]>>;
}

export interface TableDataContextProps<T = any> {
  rowKey: RowKey<T>;
  dataSource?: T[];
}

export interface TableLayoutContextProps<T = any> {
  containerWidth?: number;
  containerHeight?: number;
  columns?: InternalColumnState<T>[];
  flattenColumns?: InternalColumnState<T>[];
  flattenColumnsWidths?: number[];
  columnsWidthTotal: number;
  fixedOffset: StickyOffsets;
  hasFixedColumns: boolean;
  fixColumnsGapped: boolean;
}

export interface TableColumnStateContextProps<T = any> {
  resizableColumns?: boolean;
  fixableColumns?: boolean;
  visibleColumns?: boolean;
  columnMinWidth?: number;
  leafColumnMinWidth?: number;
  columnsState: ColumnState<T>[];
  columnsConfig?: ColumnsConfig<T>;
  updateLockContainerWidth: Dispatch<SetStateAction<boolean>>;
  updateFlattenColumnsWidths: Dispatch<SetStateAction<number[]>>;
  updateColumnsState: Dispatch<SetStateAction<ColumnState<T>[]>>;
}

export interface ComponentsContextProps {
  components?: TableComponents;
  getComponent: GetComponent;
}

export interface ExpandableContextProps<T = any> {
  expandable?: ExpandableConfig<T>;
  mergedExpandedRowKeys?: Key[];
  onTriggerExpand?: (record: T) => void;
}

export interface RowSelectionContextProps<T = any> {
  rowSelection?: TableRowSelection<T>;
  selection?: TableSelectionContextProps<T>;
}

export interface RowSortableContextProps<T = any> {
  rowSortable?: RowSortableConfig<T>;
}

export interface ColumnSortableContextProps<T = any> {
  sortableColumns?: boolean;
  sortableDraftState?: InternalColumnState<T>[] | null;
  updateSortableDraftState: Dispatch<
    SetStateAction<InternalColumnState<T>[] | null>
  >;
  getSortableBaseState: () => InternalColumnState<T>[];
  updateSortableColumnsState: (columnsState: InternalColumnState<T>[]) => void;
  sortingColumns: boolean;
  updateSortingColumns: Dispatch<SetStateAction<boolean>>;
  sortableMotionKeys: ReadonlySet<Key>;
  updateSortableMotionKeys: Dispatch<SetStateAction<Set<Key>>>;
  sortableMotionVersion: number;
  sortableActiveKeys: ReadonlySet<Key>;
  updateSortableActiveKeys: Dispatch<SetStateAction<Set<Key>>>;
  sortableHotKeys: ReadonlySet<Key>;
  updateSortableHotKeys: Dispatch<SetStateAction<Set<Key>>>;
}

export interface TableSelectionContextProps<T = any> {
  selectedRowKeys: Key[];
  isSelected: (record: T) => boolean;
  isHalfSelected: (record: T) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onSelectRecord: (
    record: T,
    rowIndex: number,
    nativeEvent: MouseEvent<HTMLElement>,
  ) => void;
  onSelectAll: (nativeEvent: MouseEvent<HTMLElement>) => void;
}
