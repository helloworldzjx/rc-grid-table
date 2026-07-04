import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { usePrefixClsContext } from '../../contexts/PrefixClsContext';
import { getComponentCls } from '../../style/classNames';
import type {
  BodyNodeRenderer,
  BodyRowItem,
  VirtualBodyRenderProps,
} from '../interface';

interface VirtualBodyProps<T = any> extends VirtualBodyRenderProps<T> {
  renderBodyNode: BodyNodeRenderer<T>;
}

const VirtualBody = <T,>({
  bodyItems,
  inVirtual,
  scrollHeight,
  offsetY,
  visibleItems,
  preservedItem,
  rowSpanItems,
  renderBodyNode,
  setItemRef,
  onItemResize,
}: VirtualBodyProps<T>) => {
  const prefixCls = usePrefixClsContext();
  const {
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    bodyVirtualPreservedRowCls,
    bodyVirtualRowSpanRowCls,
    bodyVirtualRowSpanTopRowCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const getRowSpanRenderInfo = useCallback(
    (
      bodyItem: BodyRowItem<T>,
      top: number,
      getHeight: (rowSpan: number) => number,
    ) => {
      const offsetTop = top - offsetY;

      return {
        kind: 'rowSpanOverlay' as const,
        renderMode: 'rowSpanOverlay' as const,
        renderKey: `rowspan-${bodyItem.reactKey}`,
        className: classNames(bodyVirtualRowSpanRowCls, {
          [bodyVirtualRowSpanTopRowCls]: offsetTop === 0,
        }),
        style: { top: offsetTop },
        rowSpan: {
          getHeight,
        },
        onRowResize: onItemResize,
      };
    },
    [
      bodyVirtualRowSpanRowCls,
      bodyVirtualRowSpanTopRowCls,
      offsetY,
      onItemResize,
    ],
  );

  if (!inVirtual) {
    return (
      <>
        {bodyItems.map((item) =>
          renderBodyNode(item, {
            kind: 'normal',
            renderMode: 'normal',
          }),
        )}
      </>
    );
  }

  return (
    <div className={bodyVirtualFillerCls} style={{ height: scrollHeight }}>
      <div
        className={bodyVirtualInnerCls}
        style={{ transform: `translateY(${offsetY}px)` }}
      >
        {visibleItems.map((item) =>
          renderBodyNode(item, {
            kind: 'virtual',
            renderMode: 'virtual',
            rowRef: (element) => setItemRef(item.key, element),
            onRowResize: onItemResize,
          }),
        )}
        {preservedItem &&
          renderBodyNode(preservedItem, {
            kind: 'preserved',
            renderMode: 'virtual',
            renderKey: `preserved-${preservedItem.key}`,
            className: bodyVirtualPreservedRowCls,
            style: { top: preservedItem.top - offsetY },
            rowRef: (element) => setItemRef(preservedItem.key, element),
            onRowResize: onItemResize,
          })}
        {rowSpanItems.map(({ bodyItem, top, getHeight }) =>
          renderBodyNode(
            bodyItem,
            getRowSpanRenderInfo(bodyItem, top, getHeight),
          ),
        )}
      </div>
    </div>
  );
};

export default VirtualBody;
