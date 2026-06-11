import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { composeRef } from '@rc-component/util/lib/ref';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  CSSProperties,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { SCROLLBAR_SIZE } from '../_utils/const';
import { isNum, isObject } from '../_utils/validate';
import BodyItem from './Body/BodyItem';
import type { BodyItemRenderer } from './Body/interface';
import useTableVirtualBody from './Body/virtual/useTableVirtualBody';
import ColumnPreviewStyleScope, {
  getGridTemplateColumns,
} from './ColumnPreviewStyleScope';
import Head from './Head/Head';
import HorizontalScrollbar from './HorizontalScrollbar';
import Placeholder from './Placeholder';
import ScrollBarContainer from './ScrollContainer';
import Summary from './Summary/Summary';
import { useComponentsContext } from './contexts/ComponentsContext';
import { useExpandableContext } from './contexts/ExpandableContext';
import FixedShadowContext from './contexts/FixedShadowContext';
import { usePrefixClsContext } from './contexts/PrefixClsContext';
import { useRowSortableContext } from './contexts/RowSortableContext';
import { useTableContext } from './contexts/TableContext';
import useFixedShadow from './hooks/useFixedShadow';
import useTableRowSort from './hooks/useTableRowSort';
import useTableScroll from './hooks/useTableScroll';
import type { TableProps, TableRef } from './interface';
import { useStyles } from './style';
import { getComponentCls, getCssVar } from './style/classNames';
import { getBodyItems } from './utils/bodyItems';
import { parseHeaderRows } from './utils/handle';
import { getVirtualFixedHeightConfig } from './utils/virtual';

const getStickyOffset = (
  sticky: TableProps['sticky'],
  key: 'offsetHeader' | 'offsetSummary' | 'offsetStickyScroller',
) => {
  if (!isObject(sticky)) return 0;

  const offset = sticky[key];
  return isNum(offset) ? offset : 0;
};

interface GridTableProps {
  nativeProps?: React.HTMLAttributes<HTMLDivElement>;
  tableRef?: React.Ref<TableRef>;
}

const Table = forwardRef<HTMLDivElement, GridTableProps>(
  ({ nativeProps, tableRef }, ref) => {
    const {
      initialized,
      containerWidth = 0,
      rowKey,
      className,
      dataSource,
      columns,
      flattenColumns = [],
      flattenColumnsWidths = [],
      fixedOffset,
      hasFixedColumns,
      fixColumnsGapped,
      size,
      bordered,
      stripe,
      scrollY,
      summary,
      sticky,
      virtual = true,
      loading = false,
      style,
      columnsWidthTotal,
      onScroll,
    } = useTableContext();

    const prefixCls = usePrefixClsContext();
    const { getComponent } = useComponentsContext();
    const { expandable, mergedExpandedRowKeys = [] } = useExpandableContext();
    const { rowSortable } = useRowSortableContext();

    const { hashId, cssVarCls } = useStyles();

    const {
      wrapperCls,
      wrapperInitializedCls,
      componentSMCls,
      componentMDCls,
      borderedCls,
      virtualCls,
      stripeCls,
      noDataCls,
      hasFixColumnsCls,
      hasFixStartColumnsCls,
      hasFixEndColumnsCls,
      fixColumnsGappedCls,
      pingStartCls,
      pingEndCls,
      hasSummaryCls,
      hasXScrollbarCls,
      hasYScrollbarCls,
      hasStickyCls,
      rowSortingCls,
      headStickyCls,
      bodyCls,
      bodyInnerCls,
      bodyRowCls,
      bodyFixedHeightRowCls,
      cellCls,
      noDataCellCls,
      noDataCellContentCls,
      summaryStickyCls,
    } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

    const {
      columnsWidthCssVar,
      columnsWidthTotalCssVar,
      bodyFixedHeightRowCssVar,
    } = useMemo(() => getCssVar(prefixCls), [prefixCls]);

    const wrapperRef = useRef<HTMLDivElement>(null);

    const hasData = !!dataSource?.length;
    const hasSummary = typeof summary === 'function';
    const showSummary = hasSummary && hasData;
    const gridTemplateColumns = getGridTemplateColumns(flattenColumnsWidths);
    const hasExpandedRowRender =
      typeof expandable?.expandedRowRender === 'function';
    const { rowHeight, expandedRowHeight } = useMemo(
      () => getVirtualFixedHeightConfig(virtual, hasData),
      [hasData, virtual],
    );
    const childrenColumnName = expandable?.childrenColumnName ?? 'children';

    const isTreeMode = !hasExpandedRowRender;
    const headRows = useMemo(() => {
      return parseHeaderRows(columns);
    }, [columns]);

    const expandedRowKeySet = useMemo(
      () => new Set(mergedExpandedRowKeys),
      [mergedExpandedRowKeys],
    );

    const { bodyItems, rowDataItemCount, hasTreeData } = useMemo(
      () =>
        getBodyItems({
          dataSource,
          rowKey,
          childrenColumnName,
          expandedRowKeySet,
          expandable,
          hasExpandedRowRender,
          isTreeMode,
        }),
      [
        childrenColumnName,
        dataSource,
        expandable,
        expandedRowKeySet,
        hasExpandedRowRender,
        isTreeMode,
        rowKey,
      ],
    );

    const {
      tableHeadRef,
      tableSummaryRef,
      setTableBodyRef,
      horizontalTrackRef,
      horizontalThumbRef,
      horizontalThumbWidth,
      bodyScrollElement,
      scrollLeft: bodyScrollLeft,
      maxScrollLeft: bodyMaxScrollLeft,
      hasHorizontal,
      hasVertical,
      isStart,
      isEnd,
      setHasVertical,
      handleBodyScroll,
      handleHorizontalDrag,
      scrollTo: scrollBodyTo,
      scrollToTop: scrollBodyToTop,
      scrollToLeft,
    } = useTableScroll({
      containerWidth,
      columnsWidthTotal,
      fixColumnsGapped,
      showSummary,
      onScroll,
      deps: [
        rowDataItemCount,
        mergedExpandedRowKeys,
        flattenColumnsWidths,
        scrollY,
      ],
    });

    const rowSort = useTableRowSort({
      bodyItems,
      dataSource,
      rowKey,
      childrenColumnName,
      rowSortable,
      flattenColumns,
      bodyScrollElement,
      bodyScrollLeft,
    });

    const virtualBody = useTableVirtualBody({
      bodyItems,
      flattenDataLength: rowDataItemCount,
      flattenColumns,
      preserveItemKey: rowSort.preserveItemKey,
      scrollElement: bodyScrollElement,
      scrollY,
      virtual,
      size,
      onBodyScroll: handleBodyScroll,
      scrollBodyTo,
      scrollBodyToTop,
      extraUpdateDeps: [mergedExpandedRowKeys, columnsWidthTotal],
    });

    useImperativeHandle(tableRef, () => ({
      nativeElement: wrapperRef.current!,
      scrollTo: virtualBody.scrollTo,
      scrollToTop: virtualBody.scrollToTop,
      scrollToLeft,
    }));

    const rowSortRuntime = useMemo(
      () => rowSort.getRuntime(virtualBody.inVirtual),
      [rowSort, virtualBody.inVirtual],
    );

    const fixedShadowContextValue = useFixedShadow({
      scrollLeft: bodyScrollLeft,
      maxScrollLeft: bodyMaxScrollLeft,
      fixColumnsGapped,
      flattenColumns,
      flattenColumnsWidths,
    });

    const TableComponent = useMemo(
      () => getComponent(['table'], 'div'),
      [getComponent],
    );
    const BodyWrapperComponent = useMemo(
      () => getComponent(['body', 'wrapper'], 'div'),
      [getComponent],
    );
    const BodyRowComponent = useMemo(
      () => getComponent(['body', 'row'], 'div'),
      [getComponent],
    );
    const BodyCellComponent = useMemo(
      () => getComponent(['body', 'cell'], 'div'),
      [getComponent],
    );

    const stickyHeaderStyle = useMemo<CSSProperties | undefined>(() => {
      if (!sticky) return undefined;

      return {
        top: getStickyOffset(sticky, 'offsetHeader'),
      };
    }, [sticky]);

    const stickySummaryStyle = useMemo<CSSProperties | undefined>(() => {
      if (!sticky) return undefined;

      return {
        bottom: getStickyOffset(sticky, 'offsetSummary'),
      };
    }, [sticky]);

    const bodyShowVertical = useMemo(
      () =>
        !!scrollY
          ? {
              offsetLeft: `max(0px, min(calc(var(${columnsWidthTotalCssVar}) - ${SCROLLBAR_SIZE}px), calc(100% - ${SCROLLBAR_SIZE}px)))`,
            }
          : undefined,
      [columnsWidthTotalCssVar, scrollY],
    );

    const emptyRowStyle = useMemo<CSSProperties | undefined>(
      () =>
        rowHeight !== undefined
          ? ({
              [`${bodyFixedHeightRowCssVar}`]: `${rowHeight}px`,
            } as CSSProperties)
          : undefined,
      [bodyFixedHeightRowCssVar, rowHeight],
    );

    const emptyCellStyle = useMemo<CSSProperties>(
      () => ({
        gridColumn: `span ${flattenColumns.length || 1}`,
      }),
      [flattenColumns.length],
    );

    const emptyCellContentStyle = useMemo<CSSProperties>(
      () => ({
        width: `min(${columnsWidthTotal}px, ${containerWidth}px)`,
      }),
      [columnsWidthTotal, containerWidth],
    );

    const renderBodyItem: BodyItemRenderer = useCallback(
      (bodyItem, options) => (
        <BodyItem
          key={options?.renderKey ?? bodyItem.reactKey}
          item={bodyItem}
          options={options}
          rowHeight={rowHeight}
          expandedRowHeight={expandedRowHeight}
          hasTreeData={hasTreeData}
          rowSort={rowSort}
        />
      ),
      [rowHeight, expandedRowHeight, hasTreeData, rowSort],
    );

    return (
      <div
        {...nativeProps}
        className={classNames(wrapperCls, hashId, cssVarCls, {
          [wrapperInitializedCls]: initialized,
        })}
        ref={composeRef(ref, wrapperRef)}
      >
        <Spin prefixCls={`${prefixCls}-spin`} spinning={loading}>
          <ColumnPreviewStyleScope
            component={TableComponent}
            className={classNames(
              prefixCls,
              hashId,
              {
                [componentSMCls]: size === 'small',
                [componentMDCls]: size === 'middle',
                [borderedCls]: bordered,
                [virtualCls]: virtualBody.inVirtual,
                [stripeCls]: stripe,
                [noDataCls]: !dataSource?.length,
                [hasSummaryCls]: showSummary,
                [hasXScrollbarCls]: hasHorizontal,
                [hasYScrollbarCls]: hasVertical,
                [hasFixColumnsCls]: hasFixedColumns,
                [hasFixStartColumnsCls]: fixedOffset.hasFixStartColumns,
                [hasFixEndColumnsCls]: fixedOffset.hasFixEndColumns,
                [fixColumnsGappedCls]: fixColumnsGapped,
                [pingStartCls]: !isStart,
                [pingEndCls]: !isEnd,
                [hasStickyCls]: sticky,
                [rowSortingCls]: rowSort.activeKey !== null,
              },
              className,
            )}
            columnsWidthCssVar={columnsWidthCssVar}
            columnsWidthTotalCssVar={columnsWidthTotalCssVar}
            gridTemplateColumns={gridTemplateColumns}
            columnsWidthTotal={columnsWidthTotal}
            style={style}
          >
            <FixedShadowContext.Provider value={fixedShadowContextValue}>
              <Head
                ref={tableHeadRef}
                rows={headRows}
                className={classNames({ [headStickyCls]: sticky })}
                style={stickyHeaderStyle}
              />

              <ScrollBarContainer
                className={bodyCls}
                classNames={{ inner: bodyInnerCls }}
                contentComponent={BodyWrapperComponent}
                styles={{ content: virtualBody.bodyStyle }}
                showVertical={bodyShowVertical}
                ref={setTableBodyRef}
                onScroll={virtualBody.handleBodyScroll}
                onVerticalScroll={virtualBody.handleVerticalScroll}
                onVerticalVisibleChange={setHasVertical}
                updateDeps={virtualBody.updateDeps}
              >
                {!dataSource?.length && (
                  <BodyRowComponent
                    className={classNames(bodyRowCls, {
                      [bodyFixedHeightRowCls]: rowHeight !== undefined,
                    })}
                    style={emptyRowStyle}
                  >
                    <BodyCellComponent
                      className={classNames(cellCls, noDataCellCls)}
                      style={emptyCellStyle}
                    >
                      <div
                        className={noDataCellContentCls}
                        style={emptyCellContentStyle}
                      >
                        <Empty prefixCls={`${prefixCls}-empty`} />
                      </div>
                    </BodyCellComponent>
                  </BodyRowComponent>
                )}

                <DndContext
                  sensors={rowSort.sensors}
                  collisionDetection={closestCenter}
                  autoScroll={rowSortRuntime.autoScroll}
                  onDragStart={rowSort.onDragStart}
                  onDragEnd={rowSort.onDragEnd}
                  onDragCancel={rowSort.onDragCancel}
                >
                  <SortableContext
                    items={rowSort.items}
                    strategy={verticalListSortingStrategy}
                  >
                    {hasData && virtualBody.render(renderBodyItem)}
                  </SortableContext>
                  <DragOverlay
                    adjustScale={false}
                    dropAnimation={null}
                    modifiers={rowSortRuntime.overlayModifiers}
                  >
                    {rowSort.activeBodyItem &&
                      rowSortRuntime.overlayRenderOptions &&
                      renderBodyItem(
                        rowSort.activeBodyItem,
                        rowSortRuntime.overlayRenderOptions,
                      )}
                  </DragOverlay>
                </DndContext>
              </ScrollBarContainer>

              {showSummary && (
                <Summary
                  ref={tableSummaryRef}
                  summary={summary}
                  className={classNames({ [summaryStickyCls]: sticky })}
                  style={stickySummaryStyle}
                />
              )}
            </FixedShadowContext.Provider>

            <HorizontalScrollbar
              prefixCls={prefixCls}
              visible={hasHorizontal}
              sticky={sticky}
              trackRef={horizontalTrackRef}
              thumbRef={horizontalThumbRef}
              thumbWidth={horizontalThumbWidth}
              onMouseDown={handleHorizontalDrag}
            />

            <Placeholder />
          </ColumnPreviewStyleScope>
        </Spin>
      </div>
    );
  },
);

export default Table;
