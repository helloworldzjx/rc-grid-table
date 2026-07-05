import type { CSSProperties, Key, ReactNode, Ref, UIEventHandler } from 'react';

import type { TableScrollToOptions } from '../interface';
import type { InternalColumnState, StickyOffsets } from '../internalInterface';

export type BodyRenderMode = 'normal' | 'virtual' | 'rowSpanOverlay';
export type BodyNodeRenderKind =
  | 'normal'
  | 'virtual'
  | 'preserved'
  | 'rowSpanOverlay'
  | 'rowSortOverlay';

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

export interface BodyNodeColumnsInfo<T = any> {
  flattenColumns: InternalColumnState<T>[];
  fixedOffset: StickyOffsets;
}

export interface BodyNodeRowSpanInfo {
  getHeight: (rowSpan: number) => number;
}

export interface BodyNodeRowSortInfo {
  overlay: boolean;
}

interface BodyNodeRenderInfoBase<T = any> {
  kind: BodyNodeRenderKind;
  renderMode: BodyRenderMode;
  style?: CSSProperties;
  rowRef?: Ref<HTMLDivElement>;
  onRowResize?: () => void;
  renderKey?: Key;
  className?: string;
  columns?: BodyNodeColumnsInfo<T>;
  rowSpan?: BodyNodeRowSpanInfo;
  rowSort?: BodyNodeRowSortInfo;
}

export type BodyNodeRenderInfo<T = any> =
  | (BodyNodeRenderInfoBase<T> & {
      kind: 'normal';
      renderMode: 'normal';
    })
  | (BodyNodeRenderInfoBase<T> & {
      kind: 'virtual';
      renderMode: 'virtual';
    })
  | (BodyNodeRenderInfoBase<T> & {
      kind: 'preserved';
      renderMode: 'virtual';
    })
  | (BodyNodeRenderInfoBase<T> & {
      kind: 'rowSpanOverlay';
      renderMode: 'rowSpanOverlay';
      rowSpan: BodyNodeRowSpanInfo;
    })
  | (BodyNodeRenderInfoBase<T> & {
      kind: 'rowSortOverlay';
      renderMode: 'normal' | 'virtual';
      columns: BodyNodeColumnsInfo<T>;
      rowSort: BodyNodeRowSortInfo;
    });

export type BodyNodeRenderer<T = any> = (
  bodyItem: BodyItem<T>,
  renderInfo: BodyNodeRenderInfo<T>,
) => ReactNode;

export interface VirtualRowSpanItem<T = any> {
  bodyItem: BodyRowItem<T>;
  top: number;
  getHeight: (rowSpan: number) => number;
}

export interface VirtualBodyRenderProps<T = any> {
  bodyItems: BodyItem<T>[];
  inVirtual: boolean;
  scrollHeight: number;
  offsetY: number;
  visibleItems: BodyItem<T>[];
  preservedItem?: (BodyItem<T> & { top: number }) | null;
  rowSpanItems: VirtualRowSpanItem<T>[];
  setItemRef: (key: Key, element: HTMLDivElement | null) => void;
  onItemResize: () => void;
}

export interface TableVirtualBodyController<T = any> {
  inVirtual: boolean;
  scrollHeight: number;
  bodyHeight?: number;
  bodyStyle?: CSSProperties;
  virtualBodyProps: VirtualBodyRenderProps<T>;
  updateDeps: unknown[];
  handleBodyScroll: UIEventHandler<HTMLDivElement>;
  handleVerticalScroll?: (scrollTop: number) => boolean | void;
  scrollTo: (options?: TableScrollToOptions | number | null) => void;
  scrollToTop: () => void;
}
