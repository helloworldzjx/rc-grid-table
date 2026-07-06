import type {
  CheckboxChangeEvent as AntdCheckboxChangeEvent,
  CheckboxProps as AntdCheckboxProps,
  RadioChangeEvent as AntdRadioChangeEvent,
  RadioProps as AntdRadioProps,
  EmptyProps,
  SpinProps,
} from 'antd';
import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  Key,
  MouseEvent,
  ReactNode,
} from 'react';

export type {
  AntdCheckboxChangeEvent,
  AntdCheckboxProps,
  AntdRadioChangeEvent,
  AntdRadioProps,
};

export interface TableRef {
  nativeElement: HTMLDivElement;
  scrollTo: (options?: TableScrollToOptions | number | null) => void;
  scrollToTop: () => void;
  scrollToLeft: () => void;
  startColumnsStatePreview: (options?: ColumnsStatePreviewOptions) => boolean;
  saveColumnsStatePreview: () => boolean;
  cancelColumnsStatePreview: () => void;
  setColumnVisible: (key: Key, visible: boolean) => boolean;
  setColumnFixed: (key: Key, fixed: FixedType | false) => boolean;
}

export type ColumnsStatePreviewMode = 'full' | 'visibleHotOnly';

export interface ColumnsStatePreviewOptions {
  mode?: ColumnsStatePreviewMode;
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

export type SizeType = 'small' | 'middle' | 'large';
export type TitleEllipsisType = boolean | { showTitle?: boolean };
export type FixedType = 'start' | 'end';
export type RowKey<T = any> = string | ((record: T) => Key);
export type SortOrder = 'ascend' | 'descend';
export type SortDirection = SortOrder | null;
export type DataSortOrder = {
  columnKey: Key;
  order: SortDirection;
};
export type DataSortOrderType = DataSortOrder | DataSortOrder[] | null;
export type AlignType =
  | 'start'
  | 'end'
  | 'left'
  | 'right'
  | 'center'
  | 'justify'
  | 'match-parent';

export type AlignTypeSimple = Exclude<AlignType, 'justify' | 'match-parent'>;

export type CellAttributes = HTMLAttributes<any> & {
  align?: AlignType;
};

export type SpanCellAttributes = CellAttributes & {
  rowSpan?: number;
  colSpan?: number;
};

export type GetBodyCellProps<DataType> = (
  data: DataType,
  rowIndex?: number,
) => SpanCellAttributes;

export type GetTableBodyCellProps<DataType> = (
  data: DataType,
  rowIndex: number | undefined,
  column: ColumnInfo<DataType>,
  columnIndex?: number,
) => CellAttributes;

export type GetHeaderCellProps<T> = (
  column: ColumnInfo<T>,
  columnIndex?: number,
) => SpanCellAttributes;

export type GetTableHeaderCellProps<T> = (
  column: ColumnInfo<T>,
  columnIndex?: number,
) => CellAttributes;

export type GetHeadFilterRowCellProps<T> = (
  column: ColumnInfo<T>,
  columnIndex?: number,
) => CellAttributes;

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
  columnOverlayTitle?: ReactNode;
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
  align?: AlignTypeSimple;
  indentSize?: number;
  /** 禁止展开列重新调整宽度 */
  resizeDisabled?: boolean;
  /** 拖拽可调整展开列的最小宽度，未设置时按表格 size 使用默认拖拽下限 */
  resizeMinWidth?: number;
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
  align?: AlignTypeSimple;
  columnTitle?: ReactNode;
  columnOverlayTitle?: ReactNode;
  columnWidth?: PercentColumnWidthType | number;
  fixed?: FixedType;
  /** 拖拽可调整行拖拽列的最小宽度，未设置时按表格 size 使用默认拖拽下限 */
  resizeMinWidth?: number;
  allowCrossLevelSort?: boolean;
  /** 行拖拽overlay中渲染的列。通过columns中的key或dataIndex匹配 */
  overlayColumnKeys?: Key[];
  sortIcon?: (props: RowSortIconProps<T>) => ReactNode;
  rowDraggable?: (record: T) => boolean;
  onChange?: (dataSource: T[], info: RowSortChangeInfo<T>) => void;
}

export type SelectionType = 'checkbox' | 'radio';
export type SelectionSelectAllMode = 'all' | 'enabled';
export type SelectionInfoType = 'single' | 'all' | 'none';
export type SelectionEventType = AntdCheckboxChangeEvent | AntdRadioChangeEvent;

export type SelectionCheckboxControlProps = Omit<AntdCheckboxProps, 'onChange'>;

export type SelectionRadioControlProps = Omit<AntdRadioProps, 'onChange'>;

export interface TableRowSelection<T = any> {
  align?: AlignTypeSimple;
  checkStrictly?: boolean;
  columnTitle?: ReactNode | ((originalNode: ReactNode) => ReactNode);
  columnOverlayTitle?: ReactNode;
  columnWidth?: PercentColumnWidthType | number;
  fixed?: FixedType;
  /** 禁止选择列重新调整宽度 */
  resizeDisabled?: boolean;
  /** 拖拽可调整选择列的最小宽度，未设置时按表格 size 使用默认拖拽下限 */
  resizeMinWidth?: number;
  getRadioProps?: (record: T) => SelectionRadioControlProps;
  getCheckboxProps?: (record: T) => SelectionCheckboxControlProps;
  getTitleCheckboxProps?: () => SelectionCheckboxControlProps;
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
    event: SelectionEventType,
  ) => void;
  /**
   * @description 全选/取消全选 操作是否包含禁用行，仅在 rowSelection.type === 'checkbox' 时起效
   * @default "enabled"
   */
  selectAllMode?: SelectionSelectAllMode;
}

export type ColumnSorter<T = any> = (a: T, b: T) => number;
export type ColumnSorterInput<T = any> = boolean | ColumnSorter<T>;

export interface DataSortRenderInfo {
  columnKey: Key;
  columnIndex: number;
  active: boolean;
  sortOrder: SortDirection;
  sortPriority?: number;
  sortOrders: DataSortOrder[];
  sortDirections: SortDirection[];
}

export interface DataSortConfig {
  sortOrder?: DataSortOrderType;
  sortRender?: (info: DataSortRenderInfo) => ReactNode;
}

export interface ColumnProps<T = any> {
  __RC_GRID_TABLE_EXPAND_COLUMN?: true;
  __RC_GRID_TABLE_SELECTION_COLUMN?: true;
  __RC_GRID_TABLE_ROW_SORT_COLUMN?: true;
  title?: ReactNode;
  sorter?: ColumnSorterInput<T>;
  sortDirections?: SortDirection[];
  sortRender?: (info: DataSortRenderInfo) => ReactNode;
  render?: (value: any, record: T, rowIndex: number) => ReactNode;
  filterRender?: (column: ColumnInfo<T>, columnIndex: number) => ReactNode;
  /** 列宽，仅支持数字和百分比数字，不支持px的字符串写法 */
  width?: number | PercentColumnWidthType;
  /** 禁止表格重新调整叶子列宽度 */
  resizeDisabled?: boolean;
  /** 拖拽调整列宽时的最小宽度，未设置时按表格 size 使用默认拖拽下限 */
  resizeMinWidth?: number;
  /** 禁止列拖拽排序 */
  dragSortDisabled?: boolean;
  align?: AlignType;
  fixed?: FixedType;
  /** 是否完全消失在表格中，一般用于整列的数据权限控制 */
  hidden?: boolean;
  className?: string;
  style?: CSSProperties;
  ellipsis?: TitleEllipsisType;
  rowSpan?: number;
  colSpan?: number;
  onCell?: GetBodyCellProps<T>;
  onHeaderCell?: GetHeaderCellProps<T>;
  onHeadFilterRowCell?: GetHeadFilterRowCellProps<T>;
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

export type ColumnKeyType =
  | {
      key?: Key;
      /** 数据索引，数据层级较深时使用render */
      dataIndex: Key;
    }
  | {
      key: Key;
      /** 数据索引，数据层级较深时使用render */
      dataIndex?: Key;
    };

export type ColumnType<T> = ColumnProps<T> &
  ColumnKeyType & { children?: ColumnType<T>[] };

export type ColumnsType<T = any> = ColumnType<T>[];

type ColumnInfoState = {
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
  previewVisible?: boolean;
  previewHidden?: boolean;
  previewRestored?: boolean;
};

export type ColumnInfo<T = any> = Omit<ColumnType<T>, 'children'> &
  ColumnInfoState & {
    columnOverlayTitle?: ReactNode;
    width?: number;
    resizeMinWidth?: number;
    children?: ColumnInfo<T>[];
  };

export interface TableSummaryRowCell {
  key?: Key;
  rowSpan?: number;
  colSpan?: number;
  ellipsis?: TitleEllipsisType;
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

export type TableLoadingProps = Omit<SpinProps, 'prefixCls'>;

export type TableLoading = boolean | TableLoadingProps;

export type TableEmptyProps = Pick<
  EmptyProps,
  'children' | 'description' | 'image'
>;

export type TableEmpty = TableEmptyProps;

export interface TableReadySkeletonConfig {
  showFilterRow?: boolean;
  bodyHeight?: number;
}

export type TableReadySkeleton = boolean | TableReadySkeletonConfig;

export type GetScrollContainer = () => Window | HTMLElement | null;

export type ColumnState<T = any> = {
  key: Key;
  dataIndex?: Key;
  order?: number;
  visible?: boolean;
  fixed?: FixedType | false;
  width?: number;
  widthManuallyChanged?: boolean;
  autoWidthLocked?: boolean;
  children?: ColumnState<T>[];
};

export type ColumnViewState<T = any> = {
  key: Key;
  dataIndex?: Key;
  title?: ReactNode;
  parentKey: Key;
  ancestorKeys: Key[];
  depth: number;
  order: number;
  visible: boolean;
  fixed?: FixedType | false;
  width?: number;
  resizeMinWidth?: number;
  widthManuallyChanged: boolean;
  autoWidthLocked: boolean;
  hasChildren: boolean;
  internal: boolean;
  previewVisible?: boolean;
  previewHidden?: boolean;
  previewRestored?: boolean;
  children?: ColumnViewState<T>[];
};

export type ColumnStatePatch<T = any> = {
  key: Key;
  partial: Partial<
    Omit<ColumnState<T>, 'key' | 'children' | 'autoWidthLocked'>
  >;
};

export type ColumnsStateChangeType =
  | 'resizeWidth'
  | 'autoFillWidth'
  | 'sort'
  | 'visible'
  | 'fixed'
  | 'previewSave';

export interface ColumnsStateChangeInfo<T = any> {
  type: ColumnsStateChangeType;
  patches: ColumnStatePatch<T>[];
  previousState: ColumnState<T>[];
  nextState: ColumnState<T>[];
  viewState: ColumnViewState<T>[];
  changedKeys: Key[];
}

export type ColumnsConfig<T> = {
  /** storage/localStorage 读取后的初始化快照，只在 ready 后首次消费 */
  storageColumnsState?: ColumnState<T>[];
  /** columns state 的身份标识，变化时重新按 storageColumnsState 或当前 columns 初始化 */
  columnsStateKey?: Key | boolean | null;
  onColumnsStateReady?: (payload: {
    columnsState: ColumnState<T>[];
    viewState: ColumnViewState<T>[];
  }) => void;
  onColumnsStateChange?: (
    columnsState: ColumnState<T>[],
    info: ColumnsStateChangeInfo<T>,
  ) => void;
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
   * @description 在ready阶段显示table骨架屏
   * @default false
   */
  readySkeleton?: TableReadySkeleton;
  /**
   * @description 加载状态
   * @default false
   */
  loading?: TableLoading;
  /**
   * @description 空状态
   */
  empty?: TableEmpty;
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
   * @description 受控的排序配置
   */
  dataSort?: DataSortConfig;
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
   * @description 列配置持久化入口。显式传入 storageColumnsState，或任一列状态特性开启时，会初始化列状态管线。
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
   * @default "large"
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
   * @description 是否启用 body hover 高亮
   * @default true
   */
  rowHoverable?: boolean;
  /**
   * @description table body高度
   */
  scrollY?: number;
  /**
   * @description 自定义 rowHoverable scroll follow 所依赖的外部滚动容器。
   * 未传入时默认使用 window；当 table 跟随非 window 的外层容器滚动时可显式传入。
   */
  getScrollContainer?: GetScrollContainer;
  /**
   * @description 总结栏
   */
  summary?: (
    dataSource: T[],
    flattenColumns?: ColumnInfo<T>[],
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
   * @description 固定表头/滚动条
   */
  sticky?: boolean | TableSticky;
  /**
   * @description 开启虚拟列表
   * @default true
   */
  virtual?: boolean | TableVirtualConfig;
  /**
   * @description 覆盖默认的元素
   */
  components?: TableComponents;
  /**
   * @description 设置头部行属性
   */
  onHeaderRow?: (
    columns: ColumnInfo<T>[],
    index?: number,
  ) => HTMLAttributes<any>;
  /**
   * @description 设置头部单元格属性
   */
  onHeaderCell?: GetTableHeaderCellProps<T>;
  /**
   * @description 设置筛选行属性
   */
  onHeaderFilterRow?: (
    columns: ColumnInfo<T>[],
    index?: number,
  ) => HTMLAttributes<any>;
  /**
   * @description 设置筛选行单元格属性
   */
  onHeadFilterRowCell?: GetHeadFilterRowCellProps<T>;
  /**
   * @description 设置body单元格属性
   */
  onCell?: GetTableBodyCellProps<T>;
  /**
   * @description 设置body行属性
   */
  onRow?: (record: T, index?: number) => HTMLAttributes<any>;
  /**
   * @description 设置body行的类名
   */
  rowClassName?: (record?: T, rowIndex?: number) => string;
}
