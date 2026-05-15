import type { CSSProperties, Dispatch, HTMLAttributes, Key, MouseEvent, ReactNode, RefObject, SetStateAction } from 'react';
import { ScrollBarContainerRef } from '../scrollContainer/interface';

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

// ================= Fixed Column =================
export interface StickyOffsets {
  start: readonly number[];
  end: readonly number[];
  widths: readonly number[];
  isSticky?: boolean;
  hasFixColumns: boolean
  hasFixStartColumns: boolean
  hasFixEndColumns: boolean
  fixColumnsGapped: boolean
}

export type SizeType = 'small' | 'middle' | 'large'
export type FixedType = 'start' | 'end';
export type AlignType =
  | 'start'
  | 'end'
  | 'left'
  | 'right'
  | 'center'
  | 'justify'
  | 'match-parent';

export type GetComponentProps<DataType> = (data: DataType, rowIndex?: number) => React.HTMLAttributes<any> & { rowSpan?: number; colSpan?: number; align?: AlignType; };

export type  PercentColumnWidthType = `${number}%`

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
  expandedRowClassName?: string | ((record: T, index: number, indent: number) => string);
  expandedRowKeys?: Key[];
  expandedRowRender?: (record: T, index: number, indent: number, expanded: boolean) => ReactNode;
  expandIcon?: (props: ExpandIconProps<T>) => ReactNode;
  expandRowByClick?: boolean;
  fixed?: FixedType;
  indentSize?: number;
  rowExpandable?: (record: T) => boolean;
  showExpandColumn?: boolean;
  onExpand?: (expanded: boolean, record: T) => void;
  onExpandedRowsChange?: (expandedRows: Key[]) => void;
}

export type SelectionType = 'checkbox' | 'radio';
export type SelectionSelectAllMode = 'all' | 'enabled';
export type SelectionInfoType = 'single' | 'all' | 'none';

export type SelectionControlProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> & {
  disabled?: boolean;
};

export interface TableRowSelection<T = any> {
  align?: 'start' | 'end' | 'center';
  checkStrictly?: boolean;
  columnTitle?: ReactNode | ((originalNode: ReactNode) => ReactNode);
  columnWidth?: PercentColumnWidthType | number;
  fixed?: FixedType;
  getRadioProps?: (record: T) => SelectionControlProps;
  getCheckboxProps?: (record: T) => SelectionControlProps;
  getTitleCheckboxProps?: () => SelectionControlProps;
  hideSelectAll?: boolean;
  renderCell?: (checked: boolean, record: T, index: number, originNode: ReactNode) => ReactNode;
  selectedRowKeys?: Key[];
  defaultSelectedRowKeys?: Key[];
  type?: SelectionType;
  onCell?: GetComponentProps<T>;
  onChange?: (selectedRowKeys: Key[], selectedRows: T[], info: { type: SelectionInfoType }) => void;
  onSelect?: (record: T, selected: boolean, selectedRows: T[], nativeEvent: MouseEvent<HTMLElement>) => void;
  selectAllMode?: SelectionSelectAllMode;
}

export interface ColumnProps<T = any> {
  __RC_GRID_TABLE_EXPAND_COLUMN?: true;
  __RC_GRID_TABLE_SELECTION_COLUMN?: true;
  title?: ReactNode;
  render?: (value: any, record: T, rowIndex: number) => ReactNode;
  /** 列宽，仅支持数字和百分比数字，不支持px的字符串写法 */
  width?: number | PercentColumnWidthType;
  align?: AlignType;
  fixed?: FixedType;
  /** 是否完全消失在表格中，连管理列显隐的时候也不会出现 */
  hidden?: boolean;
  className?: string;
  style?: CSSProperties
  ellipsis?: boolean | {
    showTitle?: boolean
  }
  rowSpan?: number
  colSpan?: number
  onCell?: GetComponentProps<T>;
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

export type ColumnType<T> = ColumnProps<T> & { children?: ColumnType<T>[] } & (
  { 
    key?: Key; 
    /** 数据key，数据层级较深时使用render */
    dataIndex: Key 
  } | { 
    key: Key; 
    /** 数据key，数据层级较深时使用render */
    dataIndex?: Key 
  }
);

export type ColumnsType<T = any> = ColumnType<T>[];

export interface TableSummaryRowCell {
  rowSpan?: number
  colSpan?: number
  ellipsis?: boolean | {
    showTitle?: boolean
  }
  children?: ReactNode
}

export interface TableSticky {
  /** header磁吸效果，未实现 */
  offsetHeader?: number
  /** summary磁吸效果，未实现 */
  offsetSummary?: number
  offsetStickyScroller?: number
  /** 目前仅对offsetStickyScroller生效 */
  getContainer?: () => HTMLElement
}

export type ColumnStateConfigType = {
  key: Key
  parentKey: Key
  depth: number
  order: number
  distribute: boolean
  visible: boolean
  hasChildren: boolean
  updatedWidth: boolean
}

export type ColumnState<T = any> = Omit<ColumnType<T>, 'children'> & ColumnStateConfigType & {
  width?: number
  children?: ColumnState<T>[]
}

export type ColumnsConfig<T> = {
  /** 启用storage后才会使用columnsState中的数据，且可以使用onChange事件 */
  useStorage?: boolean
  columnsState?: ColumnState<T>[]
  /** 当外部修改了宽度、顺序，以及修改了列显隐状态后会触发onChange */
  onChange?: (columnsState: ColumnState<T>[]) => void
}

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
  ready?: boolean
  /**
   * @description 加载状态
   * @default false
   */
  loading?: boolean
  /**
   * @description 行的唯一标识符
   * @default "key"
   */
  rowKey?: string;
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
  columnsConfig?: ColumnsConfig<T>
  /**
   * @description 开启调整列宽
   * @default false
   */
  resizableColumns?: boolean
  /**
   * @description 开启列拖拽排序
   * @default false
   */
  sortableColumns?: boolean
  /**
   * @description 开启列固定配置(未实现)
   * @default false
   */
  fixableColumns?: boolean
  /**
   * @description 开启列显隐操作(未实现)
   * @default false
   */
  visibleColumns?: boolean
  /**
   * @description 网格style
   */
  size?: SizeType
  /**
   * @description 网格style
   */
  bordered?: boolean
  /**
   * @description 斑马纹style
   */
  stripe?: boolean
  /**
   * @description tbody高度
   */
  scrollY?: number | { fullHeight?: boolean, y?: number }
  /**
   * @description 总结栏
   */
  summary?: (dataSource: T[], columnsLength: number) => TableSummaryRowCell[][]
  /**
   * @description 展开配置，支持额外展开行和树形数据展示
   */
  expandable?: ExpandableConfig<T>
  /**
   * @description 行选择配置
   */
  rowSelection?: TableRowSelection<T>
  /**
   * @description 横向滚动条可磁吸
   */
  sticky?: boolean | TableSticky
  /**
   * @description 开启虚拟列表(未实现)
   * @default false
   */
  virtual?: boolean
  /**
   * @description 行的高度，在开启虚拟模式时有效(未实现)
   * @default 40
   */
  itemHeight?: number
  /**
   * 滚动条自动隐藏(未实现)
   */
  // scroll?: {
  //   autoHide?: boolean | { delay?: number }
  //   immediatelyShowOnAutoHide?: boolean
  // }
  rowClassName?: (dataSource?: T[], rowIndex?: number) => string
}

export interface TableContextProps<T = any> extends TableProps<T> {
  /** bug ref https://github.com/helloworldzjx/rc-grid-table/issues/1 */
  lockContainerWidth: boolean
  updateLockContainerWidth: Dispatch<SetStateAction<boolean>>,
  mergedExpandedRowKeys?: Key[]
  onTriggerExpand?: (record: T) => void
  containerWidth?: number
  containerHeight?: number
  initialized?: boolean
  columns?: ColumnState[]
  flattenColumns?: ColumnState[];
  flattenColumnsWidths?: number[]
  columnsWidthTotal: number
  updateFlattenColumnsWidths: Dispatch<SetStateAction<number[]>>
  fixedOffset: StickyOffsets
  hasFixedColumns: boolean
  fixColumnsGapped: boolean
  sortableScopeKeys?: Key[]
  updateSortableScopeKeys: Dispatch<SetStateAction<Key[]>>
  overableScopeKeys?: Key[]
  updateOverableScopeKeys: Dispatch<SetStateAction<Key[]>>
  middleState: ColumnState<T>[]
  updateMiddleState: Dispatch<SetStateAction<ColumnState<T>[]>>
  innerColumnsState: ColumnState<T>[]
  selection?: TableSelectionContextProps<T>
}

export interface TableSelectionContextProps<T = any> {
  selectedRowKeys: Key[];
  isSelected: (record: T) => boolean;
  isHalfSelected: (record: T) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onSelectRecord: (record: T, rowIndex: number, nativeEvent: MouseEvent<HTMLElement>) => void;
  onSelectAll: (nativeEvent: MouseEvent<HTMLElement>) => void;
}

export interface TableScrollContextProps extends Pick<HTMLAttributes<HTMLDivElement>, 'onScroll'> {
  scrollRef: RefObject<ScrollBarContainerRef>
  updateScrollLeft: (dispatch: SetStateAction<number>) => void
  isStart?: boolean
  isEnd?: boolean
}

export interface TableScrollProviderProps extends Omit<TableScrollContextProps, 'scrollRef' | 'updateScrollLeft'> {
  
}
