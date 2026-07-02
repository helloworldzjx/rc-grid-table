import { CheckboxChangeEvent, RadioChangeEvent } from 'antd';
import type {
  CSSProperties,
  Dispatch,
  Key,
  ReactNode,
  SetStateAction,
} from 'react';

import type {
  ColumnInfo,
  ColumnsConfig,
  ColumnsStateChangeType,
  ColumnsStatePreviewOptions,
  ColumnState,
  ColumnStatePatch,
  CustomizeComponent,
  DataSortConfig,
  DataSortOrder,
  ExpandableConfig,
  RowKey,
  RowSortableConfig,
  TableComponents,
  TableLoading,
  TableProps,
  TableRowSelection,
  TableVirtualConfig,
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
  columnStateFixed?: ColumnState<T>['fixed'];
  children?: InternalColumnState<T>[];
};

export interface DataSortContextProps {
  dataSort?: DataSortConfig;
  dataSortOrders?: DataSortOrder[];
}

type TableFeatureContextKey =
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
  virtual: boolean | TableVirtualConfig;
  loading: boolean | TableLoading;
  rowHoverable: boolean;

  containerWidth?: number;
  containerHeight?: number;
  initialized?: boolean;
  columns?: InternalColumnState<T>[];
  flattenColumns?: InternalColumnState<T>[];
  flattenColumnsWidths?: number[];
  columnsWidthTotal: number;
  fixedOffset: StickyOffsets;
  hasFixedColumns: boolean;
  fixColumnsGapped: boolean;
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
  columnsStatePreviewing: boolean;
  columnsStatePreviewMode?: ColumnsStatePreviewOptions['mode'];
  columnsConfig?: ColumnsConfig<T>;
  updateLockContainerWidth: Dispatch<SetStateAction<boolean>>;
  updateFlattenColumnsWidths: Dispatch<SetStateAction<number[]>>;
  clearFlattenColumnsWidthPreview: (nextCalculatedWidths?: number[]) => void;
  commitColumnsStateChange: (
    nextState: ColumnState<T>[],
    type: ColumnsStateChangeType,
    patches: ColumnStatePatch<T>[],
  ) => boolean;
  commitColumnWidthChange: (
    type: Extract<ColumnsStateChangeType, 'resizeWidth' | 'autoFillWidth'>,
    patches: ColumnStatePatch<T>[],
    nextFlattenColumnsWidths: number[],
  ) => boolean;
  startColumnsStatePreview: (options?: ColumnsStatePreviewOptions) => boolean;
  saveColumnsStatePreview: () => boolean;
  cancelColumnsStatePreview: () => void;
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
    event: CheckboxChangeEvent | RadioChangeEvent,
  ) => void;
  onSelectAll: (event: CheckboxChangeEvent) => void;
}
