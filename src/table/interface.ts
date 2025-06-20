import type { CSSProperties, HTMLAttributes, Key, ReactNode } from 'react';

export interface CellType<T> {
  key?: Key;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  column?: ColumnType<T>;
  colSpan?: number;
  rowSpan?: number;
  /** Only used for table header */
  hasSubColumns?: boolean;
  colStart?: number;
  colEnd?: number;
}

export interface RenderedCell<T> {
  props?: CellType<T>;
  children?: ReactNode;
}

// ================= Fixed Column =================
export interface StickyOffsets {
  start: readonly number[];
  end: readonly number[];
  widths: readonly number[];
  isSticky?: boolean;
}

export type FixedType = 'start' | 'end';
export type AlignType =
  | 'start'
  | 'end'
  | 'left'
  | 'right'
  | 'center'
  | 'justify'
  | 'match-parent';

export type GetComponentProps<DataType> = (data: DataType, rowIndex?: number) => React.HTMLAttributes<any> & {rowSpan?: number; colSpan?: number;align?: AlignType;};

export interface ColumnStyle<T> {
  width?: string | number;
  align?: AlignType;
  fixed?: FixedType;
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

export interface ColumnType<T = any> extends ColumnStyle<T> {
  key?: string;
  dataIndex?: string;
  title?: ReactNode;
  render?: (value: any, record: T, index: number) => ReactNode;
  children?: ColumnType<T>[]
}

export type ColumnsType<T> = ColumnType<T>[];

export type TableLayout = 'auto' | 'fixed';

export interface TableSummaryRowCell {
  rowSpan?: number
  colSpan?: number
  ellipsis?: boolean | {
    showTitle?: boolean
  }
  children?: ReactNode
}

export interface TableSticky {
  offsetHeader?: number
  offsetSummary?: number
}

export interface TableProps<T = any> extends HTMLAttributes<HTMLDivElement> {
  /**
   * @description className 前缀
   * @default "rc-grid-table"
   */
  prefixCls?: string;
  /**
   * @description 行的唯一标识符
   * @default "key"
   */
  rowKey?: string;
  /**
   * @description 列配置
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
   * @description 叶子列初始最小列宽
   * @default 80
   */
  leafColumnMinWidth?: number;
  /**
   * @description 网格style
   */
  bordered?: boolean
  /**
   * @description tbody高度
   */
  scrollY?: number | { fullHeight?: boolean, y?: number }
  /**
   * @description 总结栏
   */
  summary?: (columnsLength: number, dataSource?: T[]) => TableSummaryRowCell[][]
  /**
   * @description 磁吸模式
   */
  sticky?: boolean | TableSticky
  /**
   * 滚动条自动隐藏(未实现)
   */
  scroll?: {
    autoHide?: boolean | { delay?: number }
    immediatelyShowOnAutoHide?: boolean
  }
}

export interface TableContextProps<T = any> extends TableProps<T> {
  containerWidth?: number
  initialized?: boolean
  flattenColumns?: ColumnsType<T>;
  flattenColumnsWidths?: number[]
  isStart?: boolean
  isEnd?: boolean
}