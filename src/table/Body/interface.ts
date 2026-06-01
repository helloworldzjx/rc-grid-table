import type { CSSProperties, Key, ReactNode, Ref, UIEventHandler } from 'react';

import type { TableScrollToOptions } from '../interface';

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

export interface BodyRenderOptions {
  renderMode?: BodyRenderMode;
  style?: CSSProperties;
  rowRef?: Ref<HTMLDivElement>;
  onRowResize?: () => void;
  renderKey?: Key;
  className?: string;
  getRowSpanHeight?: (rowSpan: number) => number;
}

export type BodyItemRenderer<T = any> = (
  bodyItem: BodyItem<T>,
  options?: BodyRenderOptions,
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
