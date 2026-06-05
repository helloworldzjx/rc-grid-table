import type {
  CSSProperties,
  Dispatch,
  ElementType,
  HTMLAttributes,
  Key,
  MouseEvent,
  ReactNode,
  SetStateAction,
} from 'react';

import { ScrollBarContainerRef } from './ScrollContainer/interface';

export interface TableRef {
  nativeElement: HTMLDivElement;
  scrollTo: (options?: TableScrollToOptions | number | null) => void;
  scrollToTop: ScrollBarContainerRef['scrollToTop'];
  scrollToLeft: ScrollBarContainerRef['scrollToLeft'];
}

export type TableScrollAlign = 'top' | 'bottom' | 'auto';

export type TableScrollToOptions = ScrollToOptions & {
  index?: number;
  key?: Key;
  align?: TableScrollAlign;
  offset?: number;
};

export interface TableVirtualConfig {
  /** 帮助虚拟列表预估每行的高度，在实际测量行高前使用 */
  estimatedRowHeight?: number;
  /** 可见垂直范围外追加渲染的行数 */
  rowOverscan?: number;
  /** 固定每行的高度（展开行除外）。设置后，每行不再动态的测量高度，每行高度固定 */
  rowHeight?: number;
  /** 展开行的固定高度。未设置rowHeight或expandedRowHeight设置为false时展开行的高度随内容自适应。expandedRowHeight默认为rowHeight的值 */
  expandedRowHeight?: number | false;
  /** 可见水平范围外追加渲染的宽度(px)，计算水平可见范围时不含固定列的宽度，且默认使用table的容器宽度 */
  columnOverscan?: number;
}

export interface CellType<T = any> {
  key?: Key;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  column?: ColumnState<T>;
  colSpan?: number;
  rowSpan?: number;
  /** Only used for table header */
  hasSubColumns?: boolean;
  colStart?: number;
  colEnd?: number;
}

// ================= Customized =================

export type CustomizeComponent = ElementType<any>;

export interface TableComponents {
  table?: CustomizeComponent;
  header?: {
    wrapper?: CustomizeComponent;
    row?: CustomizeComponent;
    cell?: CustomizeComponent;
    filterRow?: CustomizeComponent;
    filterCell?: CustomizeComponent;
  };
  body?: {
    wrapper?: CustomizeComponent;
    row?: CustomizeComponent;
    cell?: CustomizeComponent;
  };
}

export type GetComponent = (
  path: readonly string[],
  defaultComponent?: CustomizeComponent,
) => CustomizeComponent;

// ================= Fixed Column =================
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

export type SizeType = 'small' | 'middle' | 'large';
export type FixedType = 'start' | 'end';
export type RowKey<T = any> = string | ((record: T) => Key);
export type AlignType =
  | 'start'
  | 'end'
  | 'left'
  | 'right'
  | 'center'
  | 'justify'
  | 'match-parent';

export type GetBodyCellProps<DataType> = (
  data: DataType,
  rowIndex?: number,
) => React.HTMLAttributes<any> & {
  rowSpan?: number;
  colSpan?: number;
  align?: AlignType;
};

export type GetHeaderCellProps<T> = (
  column: ColumnType<T>,
  columnIndex?: number,
) => React.HTMLAttributes<any> & {
  rowSpan?: number;
  colSpan?: number;
  align?: AlignType;
};

export type GetFilterCellProps<T> = (
  column: ColumnState<T>,
  columnIndex?: number,
) => React.HTMLAttributes<any> & {
  align?: AlignType;
};

export type PercentColumnWidthType = `${number}%`;

export interface ExpandIconProps<T = any> {
  expanded: boolean;
  expandable: boolean;
  record: T;
  index: number;
  indent: number;
  onExpand: (record: T, event: MouseEvent<HTMLElement>) => void;
}

export interface ExpandableConfig<T = any> {
  childrenColumnName?: string;
  columnTitle?: ReactNode;
  columnWidth?: PercentColumnWidthType | number;
  defaultExpandAllRows?: boolean;
  defaultExpandedRowKeys?: Key[];
  expandedRowClassName?:
    | string
    | ((record: T, index: number, indent: number) => string);
  expandedRowKeys?: Key[];
  expandedRowRender?: (
    record: T,
    index: number,
    indent: number,
    expanded: boolean,
  ) => ReactNode;
  expandIcon?: (props: ExpandIconProps<T>) => ReactNode;
  expandRowByClick?: boolean;
  fixed?: FixedType;
  align?: 'start' | 'end' | 'center';
  indentSize?: number;
  /** 禁止展开列重新调整宽度 */
  resizeDisabled?: boolean;
  /** 拖拽调整列宽时的最小宽度 */
  resizeMinWidth?: PercentColumnWidthType | number;
  rowExpandable?: (record: T) => boolean;
  showExpandColumn?: boolean;
  onExpand?: (expanded: boolean, record: T) => void;
  onExpandedRowsChange?: (expandedRows: Key[]) => void;
}

export type RowSortPlacement = 'before' | 'after';

export interface RowSortIconProps<T = any> {
  disabled: boolean;
  dragging: boolean;
  record: T;
  index: number;
  indent: number;
}

export interface RowSortChangeInfo<T = any> {
  activeKey: Key;
  overKey: Key;
  activeRecord: T;
  overRecord: T;
  fromParentKey?: Key;
  toParentKey?: Key;
  fromIndex: number;
  toIndex: number;
  placement: RowSortPlacement;
}

export interface RowSortableConfig<T = any> {
  align?: 'start' | 'end' | 'center';
  columnTitle?: ReactNode;
  columnWidth?: PercentColumnWidthType | number;
  fixed?: FixedType;
  /** 拖拽调整列宽时的最小宽度 */
  resizeMinWidth?: PercentColumnWidthType | number;
  allowCrossLevelSort?: boolean;
  sortIcon?: (props: RowSortIconProps<T>) => ReactNode;
  rowDraggable?: (record: T) => boolean;
  onChange?: (dataSource: T[], info: RowSortChangeInfo<T>) => void;
}

export type SelectionType = 'checkbox' | 'radio';
export type SelectionSelectAllMode = 'all' | 'enabled';
export type SelectionInfoType = 'single' | 'all' | 'none';

export type SelectionControlProps = Omit<
  HTMLAttributes<HTMLElement>,
  'onChange'
> & {
  disabled?: boolean;
};

export interface TableRowSelection<T = any> {
  align?: 'start' | 'end' | 'center';
  checkStrictly?: boolean;
  columnTitle?: ReactNode | ((originalNode: ReactNode) => ReactNode);
  columnWidth?: PercentColumnWidthType | number;
  fixed?: FixedType;
  /** 禁止选择列重新调整宽度 */
  resizeDisabled?: boolean;
  /** 拖拽调整列宽时的最小宽度 */
  resizeMinWidth?: PercentColumnWidthType | number;
  getRadioProps?: (record: T) => SelectionControlProps;
  getCheckboxProps?: (record: T) => SelectionControlProps;
  getTitleCheckboxProps?: () => SelectionControlProps;
  hideSelectAll?: boolean;
  renderCell?: (
    checked: boolean,
    record: T,
    index: number,
    originNode: ReactNode,
  ) => ReactNode;
  selectedRowKeys?: Key[];
  defaultSelectedRowKeys?: Key[];
  type?: SelectionType;
  onCell?: GetBodyCellProps<T>;
  onChange?: (
    selectedRowKeys: Key[],
    selectedRows: T[],
    info: { type: SelectionInfoType },
  ) => void;
  onSelect?: (
    record: T,
    selected: boolean,
    selectedRows: T[],
    nativeEvent: MouseEvent<HTMLElement>,
  ) => void;
  selectAllMode?: SelectionSelectAllMode;
}

export interface ColumnProps<T = any> {
  __RC_GRID_TABLE_EXPAND_COLUMN?: true;
  __RC_GRID_TABLE_SELECTION_COLUMN?: true;
  __RC_GRID_TABLE_ROW_SORT_COLUMN?: true;
  title?: ReactNode;
  render?: (value: any, record: T, rowIndex: number) => ReactNode;
  filterRender?: (column: ColumnState<T>, columnIndex: number) => ReactNode;
  /** 列宽，仅支持数字和百分比数字，不支持px的字符串写法 */
  width?: number | PercentColumnWidthType;
  /** 禁止表格重新调整叶子列宽度 */
  resizeDisabled?: boolean;
  /** 拖拽调整列宽时的最小宽度 */
  resizeMinWidth?: PercentColumnWidthType | number;
  /** 禁止列拖拽排序 */
  dragSortDisabled?: boolean;
  align?: AlignType;
  fixed?: FixedType;
  /** 是否完全消失在表格中，连管理列显隐的时候也不会出现 */
  hidden?: boolean;
  className?: string;
  style?: CSSProperties;
  ellipsis?:
    | boolean
    | {
        showTitle?: boolean;
      };
  rowSpan?: number;
  colSpan?: number;
  onCell?: GetBodyCellProps<T>;
  onHeaderCell?: GetHeaderCellProps<T>;
  onFilterCell?: GetFilterCellProps<T>;
}

export type ExpandColumnType = ColumnProps<any> & {
  key: Key;
  dataIndex?: Key;
  children?: never;
  __RC_GRID_TABLE_EXPAND_COLUMN: true;
};

export type SelectionColumnType = ColumnProps<any> & {
  key: Key;
  dataIndex?: Key;
  children?: never;
  __RC_GRID_TABLE_SELECTION_COLUMN: true;
};

export type RowSortColumnType = ColumnProps<any> & {
  key: Key;
  dataIndex?: Key;
  children?: never;
  __RC_GRID_TABLE_ROW_SORT_COLUMN: true;
};

export type ColumnType<T> = ColumnProps<T> & { children?: ColumnType<T>[] } & (
    | {
        key?: Key;
        /** 数据key，数据层级较深时使用render */
        dataIndex: Key;
      }
    | {
        key: Key;
        /** 数据key，数据层级较深时使用render */
        dataIndex?: Key;
      }
  );

export type ColumnsType<T = any> = ColumnType<T>[];

export interface TableSummaryRowCell {
  key?: Key;
  rowSpan?: number;
  colSpan?: number;
  ellipsis?:
    | boolean
    | {
        showTitle?: boolean;
      };
  children?: ReactNode;
}

export interface TableSticky {
  /** header磁吸顶部距离 */
  offsetHeader?: number;
  /** summary磁吸底部距离 */
  offsetSummary?: number;
  /** 横向滚动条磁吸底部距离 */
  offsetStickyScroller?: number;
}

export type ColumnStateConfigType = {
  key: Key;
  parentKey: Key;
  ancestorKeys: Key[];
  depth: number;
  order: number;
  distribute: boolean;
  visible: boolean;
  hasChildren: boolean;
  widthManuallyChanged: boolean;
  autoWidthLocked: boolean;
};

export type ColumnState<T = any> = Omit<ColumnType<T>, 'children'> &
  ColumnStateConfigType & {
    width?: number;
    resizeMinWidth?: number;
    children?: ColumnState<T>[];
  };

export type ColumnsConfig<T> = {
  /** 启用storage后才会使用columnsState中的数据，且可以使用onChange事件 */
  useStorage?: boolean;
  columnsState?: ColumnState<T>[];
  /** 当外部修改了宽度、顺序、固定列，以及修改了列显隐状态后会触发onChange */
  onChange?: (columnsState: ColumnState<T>[]) => void;
};

export interface TableProps<T = any> extends HTMLAttributes<HTMLDivElement> {
  /**
   * @description className 前缀
   * @default "rc-grid-table"
   */
  prefixCls?: string;
  /**
   * @description 如果希望table在一些操作之后再显示可以使用ready参数
   * @default true
   */
  ready?: boolean;
  /**
   * @description 加载状态
   * @default false
   */
  loading?: boolean;
  /**
   * @description 行的唯一标识符
   * @default "key"
   */
  rowKey?: RowKey<T>;
  /**
   * @description 列数组
   */
  columns?: ColumnsType<T>;
  /**
   * @description 数据源
   */
  dataSource?: T[];
  /**
   * @description 列初始最小列宽
   * @default 100
   */
  columnMinWidth?: number;
  /**
   * @description 叶子列初始最小列宽，仅在表头分组时生效
   * @default 80
   */
  leafColumnMinWidth?: number;
  /**
   * @description 列配置，四个属性至少有一个启用则生效：resizableColumns、sortableColumns、fixableColumns、visibleColumns
   */
  columnsConfig?: ColumnsConfig<T>;
  /**
   * @description 开启调整列宽
   * @default false
   */
  resizableColumns?: boolean;
  /**
   * @description 开启列拖拽排序
   * @default false
   */
  sortableColumns?: boolean;
  /**
   * @description 开启列固定配置(未实现)
   * @default false
   */
  fixableColumns?: boolean;
  /**
   * @description 开启列显隐操作(未实现)
   * @default false
   */
  visibleColumns?: boolean;
  /**
   * @description 表格大小
   * @default large
   */
  size?: SizeType;
  /**
   * @description 网格style
   */
  bordered?: boolean;
  /**
   * @description 斑马纹style
   */
  stripe?: boolean;
  /**
   * @description table body高度
   */
  scrollY?: number;
  /**
   * @description 总结栏
   */
  summary?: (
    dataSource: T[],
    flattenColumns?: ColumnState<T>[],
  ) => TableSummaryRowCell[][];
  /**
   * @description 展开配置，支持额外展开行和树形数据展示
   */
  expandable?: ExpandableConfig<T>;
  /**
   * @description 行选择配置
   */
  rowSelection?: TableRowSelection<T>;
  /**
   * @description 行拖拽配置
   */
  rowSortable?: RowSortableConfig<T>;
  /**
   * @description 横向滚动条可磁吸
   */
  sticky?: boolean | TableSticky;
  /**
   * @description 开启虚拟列表(未实现)
   * @default true
   */
  virtual?: boolean | TableVirtualConfig;
  /**
   * @description 覆盖默认的元素
   */
  components?: TableComponents;
  /**
   * 滚动条自动隐藏(未实现)
   */
  // scroll?: {
  //   autoHide?: boolean | { delay?: number }
  //   immediatelyShowOnAutoHide?: boolean
  // }
  rowClassName?: (record?: T, rowIndex?: number) => string;
}

type TableFeatureContextKey =
  | 'prefixCls'
  | 'components'
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
  columns?: ColumnState<T>[];
  flattenColumns?: ColumnState<T>[];
  flattenColumnsWidths?: number[];
  columnsWidthTotal: number;
  updateFlattenColumnsWidths: Dispatch<SetStateAction<number[]>>;
  fixedOffset: StickyOffsets;
  hasFixedColumns: boolean;
  fixColumnsGapped: boolean;
  middleState: ColumnState<T>[];
  updateMiddleState: Dispatch<SetStateAction<ColumnState<T>[]>>;
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
  sortableDraftState?: ColumnState<T>[] | null;
  updateSortableDraftState: Dispatch<SetStateAction<ColumnState<T>[] | null>>;
  getSortableBaseState: () => ColumnState<T>[];
  updateSortableColumnsState: (columnsState: ColumnState<T>[]) => void;
  sortingColumns: boolean;
  updateSortingColumns: Dispatch<SetStateAction<boolean>>;
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
