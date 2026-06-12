import type { CSSProperties, Key, ReactNode, Ref, UIEventHandler } from 'react';

import type { TableScrollToOptions } from '../interface';
import type { InternalColumnState, StickyOffsets } from '../internalInterface';

export type BodyRenderMode = 'normal' | 'virtual' | 'rowSpanOverlay';

export type BodyRowItem<T = any> = {
  type: 'row';
  key: Key;
  reactKey: Key;
  record: T;
  rowIndex: number;
  indent: number;
  rowKeyValue?: Key;
  expanded: boolean;
  treeExpandable: boolean;
  rowExpandable: boolean;
  invalidRowKey: boolean;
};

export type BodyExpandedItem<T = any> = {
  type: 'expanded';
  key: Key;
  reactKey: Key;
  record: T;
  rowIndex: number;
  indent: number;
  expanded: boolean;
  className?: string;
};

export type BodyItem<T = any> = BodyRowItem<T> | BodyExpandedItem<T>;

export interface BodyRenderOptions<T = any> {
  renderMode?: BodyRenderMode;
  flattenColumns?: InternalColumnState<T>[];
  fixedOffset?: StickyOffsets;
  style?: CSSProperties;
  rowRef?: Ref<HTMLDivElement>;
  onRowResize?: () => void;
  rowSortOverlay?: boolean;
  renderKey?: Key;
  className?: string;
  getRowSpanHeight?: (rowSpan: number) => number;
}

export type BodyItemRenderer<T = any> = (
  bodyItem: BodyItem<T>,
  options?: BodyRenderOptions<T>,
) => ReactNode;

export interface TableVirtualBodyController<T = any> {
  inVirtual: boolean;
  scrollHeight: number;
  bodyStyle?: CSSProperties;
  updateDeps: unknown[];
  handleBodyScroll: UIEventHandler<HTMLDivElement>;
  handleVerticalScroll?: (scrollTop: number) => boolean | void;
  scrollTo: (options?: TableScrollToOptions | number | null) => void;
  scrollToTop: () => void;
  render: (renderBodyItem: BodyItemRenderer<T>) => ReactNode;
}
