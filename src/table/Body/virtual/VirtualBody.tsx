import React, { Key, useMemo } from 'react';

import { usePrefixClsContext } from '../../prefixClsContext';
import { getComponentCls } from '../../style/classNames';
import type { BodyItem, BodyItemRenderer, BodyRowItem } from '../interface';
import type { VirtualItem } from './useVirtualBody';

export interface VirtualRowSpanItem<T = any> {
  bodyItem: BodyRowItem<T>;
  top: number;
  getHeight: (rowSpan: number) => number;
}

interface VirtualBodyProps<T = any> {
  bodyItems: BodyItem<T>[];
  inVirtual: boolean;
  scrollHeight: number;
  offsetY: number;
  visibleItems: VirtualItem<BodyItem<T>>[];
  rowSpanItems: VirtualRowSpanItem<T>[];
  renderBodyItem: BodyItemRenderer<T>;
  setItemRef: (key: Key, element: HTMLDivElement | null) => void;
  onItemResize: () => void;
}

const VirtualBody = <T,>({
  bodyItems,
  inVirtual,
  scrollHeight,
  offsetY,
  visibleItems,
  rowSpanItems,
  renderBodyItem,
  setItemRef,
  onItemResize,
}: VirtualBodyProps<T>) => {
  const prefixCls = usePrefixClsContext();
  const { bodyVirtualFillerCls, bodyVirtualInnerCls, bodyVirtualRowSpanCls } =
    useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  if (!inVirtual) {
    return <>{bodyItems.map((item) => renderBodyItem(item))}</>;
  }

  return (
    <div className={bodyVirtualFillerCls} style={{ height: scrollHeight }}>
      <div
        className={bodyVirtualInnerCls}
        style={{
          transform: `translateY(${offsetY}px)`,
        }}
      >
        {visibleItems.map(({ key, item }) =>
          renderBodyItem(item, {
            renderMode: 'virtual',
            rowRef: (element) => setItemRef(key, element),
            onRowResize: onItemResize,
          }),
        )}
        {rowSpanItems.map(({ bodyItem, top, getHeight }) =>
          renderBodyItem(bodyItem, {
            renderMode: 'rowSpanOverlay',
            renderKey: `rowspan-${bodyItem.reactKey}`,
            className: bodyVirtualRowSpanCls,
            style: { top: top - offsetY },
            getRowSpanHeight: getHeight,
            onRowResize: onItemResize,
          }),
        )}
      </div>
    </div>
  );
};

export default VirtualBody;
