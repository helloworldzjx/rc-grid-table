import classNames from 'classnames';
import React, { Key, useCallback, useMemo } from 'react';
import { usePrefixClsContext } from '../../prefixClsContext';
import { getComponentCls } from '../../style/classNames';
import type { BodyItem, BodyItemRenderer, BodyRowItem } from '../interface';

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
  visibleItems: BodyItem<T>[];
  preservedItem?: (BodyItem<T> & { top: number }) | null;
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
  preservedItem,
  rowSpanItems,
  renderBodyItem,
  setItemRef,
  onItemResize,
}: VirtualBodyProps<T>) => {
  const prefixCls = usePrefixClsContext();
  const {
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    bodyVirtualPreservedCls,
    bodyVirtualRowSpanCls,
    bodyVirtualRowSpanTopCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const getRowSpanRenderOptions = useCallback(
    (
      bodyItem: BodyRowItem<T>,
      top: number,
      getHeight: (rowSpan: number) => number,
    ) => {
      const offsetTop = top - offsetY;

      return {
        renderMode: 'rowSpanOverlay' as const,
        renderKey: `rowspan-${bodyItem.reactKey}`,
        className: classNames(bodyVirtualRowSpanCls, {
          [bodyVirtualRowSpanTopCls]: offsetTop === 0,
        }),
        style: { top: offsetTop },
        getRowSpanHeight: getHeight,
        onRowResize: onItemResize,
      };
    },
    [bodyVirtualRowSpanCls, bodyVirtualRowSpanTopCls, offsetY, onItemResize],
  );

  if (!inVirtual) {
    return <>{bodyItems.map((item) => renderBodyItem(item))}</>;
  }

  return (
    <div className={bodyVirtualFillerCls} style={{ height: scrollHeight }}>
      <div
        className={bodyVirtualInnerCls}
        style={{ transform: `translateY(${offsetY}px)` }}
      >
        {visibleItems.map((item) =>
          renderBodyItem(item, {
            renderMode: 'virtual',
            rowRef: (element) => setItemRef(item.key, element),
            onRowResize: onItemResize,
          }),
        )}
        {preservedItem &&
          renderBodyItem(preservedItem, {
            renderMode: 'virtual',
            renderKey: `preserved-${preservedItem.key}`,
            className: bodyVirtualPreservedCls,
            style: { top: preservedItem.top - offsetY },
            rowRef: (element) => setItemRef(preservedItem.key, element),
            onRowResize: onItemResize,
          })}
        {rowSpanItems.map(({ bodyItem, top, getHeight }) =>
          renderBodyItem(
            bodyItem,
            getRowSpanRenderOptions(bodyItem, top, getHeight),
          ),
        )}
      </div>
    </div>
  );
};

export default VirtualBody;
