import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { composeRef } from '@rc-component/util/lib/ref';
import type { SpinProps } from 'antd';
import { Empty, Spin } from 'antd';
import { ConfigContext as AntdConfigContext } from 'antd/es/config-provider';
import classNames from 'classnames';
import React, {
  CSSProperties,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { isNum, isObject } from '../_utils/validate';
import BodyItem from './Body/BodyItem';
import type { BodyNodeRenderer } from './Body/interface';
import VirtualBody from './Body/virtual/VirtualBody';
import useTableVirtualBody from './Body/virtual/useTableVirtualBody';
import ColumnPreviewStyleScope, {
  getGridTemplateColumns,
} from './ColumnPreviewStyleScope';
import Head from './Head/Head';
import HorizontalScrollbar from './HorizontalScrollbar';
import Placeholder from './Placeholder';
import ReadySkeletonTable from './ReadySkeletonTable';
import ScrollBarContainer from './ScrollContainer';
import Summary from './Summary/Summary';
import { useColumnSortableContext } from './contexts';
import BodyHoverContext from './contexts/BodyHoverContext';
import { useComponentsContext } from './contexts/ComponentsContext';
import { useExpandableContext } from './contexts/ExpandableContext';
import FixedShadowContext from './contexts/FixedShadowContext';
import { usePrefixClsContext } from './contexts/PrefixClsContext';
import { useRowSortableContext } from './contexts/RowSortableContext';
import { useTableContext } from './contexts/TableContext';
import useBodyHoverController from './hooks/useBodyHoverController';
import useBodyHoverPointerPlugin from './hooks/useBodyHoverPointerPlugin';
import useBodyHoverScrollFollowPlugin from './hooks/useBodyHoverScrollFollowPlugin';
import useBodyItems from './hooks/useBodyItems';
import useFixedShadow from './hooks/useFixedShadow';
import useTableRowSort from './hooks/useTableRowSort';
import useTableScroll from './hooks/useTableScroll';
import type { TableProps, TableRef } from './interface';
import { useStyles } from './style';
import { getComponentCls, getCssVar } from './style/classNames';
import {
  READY_SKELETON_BODY_HEIGHT,
  SCROLLBAR_SIZE,
  SCROLLBAR_VISIBLE_TOLERANCE,
} from './utils/const';
import { parseHeaderRows } from './utils/handle';
import {
  getReadySkeletonHeadHeight,
  normalizeReadySkeletonConfig,
} from './utils/readySkeleton';
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
  imperativeRef?: React.Ref<TableRef>;
  startColumnsStatePreview?: TableRef['startColumnsStatePreview'];
  saveColumnsStatePreview?: TableRef['saveColumnsStatePreview'];
  cancelColumnsStatePreview?: TableRef['cancelColumnsStatePreview'];
  setColumnVisible?: TableRef['setColumnVisible'];
  setColumnFixed?: TableRef['setColumnFixed'];
}

const Table = forwardRef<HTMLDivElement, GridTableProps>(
  (
    {
      nativeProps,
      imperativeRef,
      startColumnsStatePreview,
      saveColumnsStatePreview,
      cancelColumnsStatePreview,
      setColumnVisible,
      setColumnFixed,
    },
    ref,
  ) => {
    const {
      initialized,
      ready,
      readySkeleton,
      containerWidth,
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
      rowHoverable,
      scrollY,
      getScrollContainer,
      summary,
      sticky,
      virtual,
      loading,
      empty,
      style,
      columnsWidthTotal,
      onScroll,
    } = useTableContext();

    const prefixCls = usePrefixClsContext();
    const { renderEmpty } = useContext(AntdConfigContext);
    const { getComponent } = useComponentsContext();
    const { expandable, mergedExpandedRowKeys = [] } = useExpandableContext();
    const { rowSortable } = useRowSortableContext();
    const { sortingColumns } = useColumnSortableContext();

    const { hashId, cssVarCls } = useStyles();

    const {
      wrapperCls,
      wrapperReadySkeletonCls,
      wrapperInitializedCls,
      spinReadySkeletonWrapperCls,
      componentSMCls,
      componentMDCls,
      borderedCls,
      virtualCls,
      stripeCls,
      noDataCls,
      hasFixColumnsCls,
      fixColumnsGappedCls,
      pingStartCls,
      pingEndCls,
      hasSummaryCls,
      hasXScrollbarCls,
      hasYScrollbarCls,
      hasStickyCls,
      previewColumnsSortingCls,
      rowSortingCls,
      headStickyCls,
      bodyCls,
      bodyInnerCls,
      bodyRowCls,
      bodyNoDataRowCls,
      cellCls,
      fixedStartShadowCls,
      fixedStartShadowActiveCls,
      fixedEndShadowCls,
      fixedEndShadowActiveCls,
      noDataCellCls,
      noDataCellContentCls,
      summaryStickyCls,
    } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

    const { columnsWidthCssVar, columnsWidthTotalCssVar } = useMemo(
      () => getCssVar(prefixCls),
      [prefixCls],
    );

    const wrapperRef = useRef<HTMLDivElement>(null);

    const hasData = !!dataSource?.length;
    const hasSummary = typeof summary === 'function';
    const showSummary = hasSummary && hasData;
    const gridTemplateColumns = getGridTemplateColumns(flattenColumnsWidths);
    const hasExpandedRowRender =
      typeof expandable?.expandedRowRender === 'function';
    const { rowHeight, expandedRowHeight } = useMemo(
      () => getVirtualFixedHeightConfig(virtual),
      [virtual],
    );
    const childrenColumnName = expandable?.childrenColumnName ?? 'children';
    const readySkeletonConfig = useMemo(
      () => normalizeReadySkeletonConfig(readySkeleton),
      [readySkeleton],
    );
    const showReadySkeleton = !initialized && !ready && !!readySkeletonConfig;

    const isTreeMode = !hasExpandedRowRender;
    const headRows = useMemo(() => {
      return parseHeaderRows(columns);
    }, [columns]);

    const { bodyItems, normalBodyItems, rowDataItemCount, hasTreeData } =
      useBodyItems({
        dataSource,
        rowKey,
        childrenColumnName,
        mergedExpandedRowKeys,
        expandable,
        hasExpandedRowRender,
        isTreeMode,
      });

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
      handleHorizontalPointerDown,
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
      bodyScrollLeft,
    });

    const virtualBody = useTableVirtualBody({
      bodyItems,
      normalBodyItems,
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

    const resolveBodyHoverScrollContainer = useCallback(() => {
      if (getScrollContainer) {
        return getScrollContainer();
      }

      return bodyScrollElement?.ownerDocument.defaultView ?? null;
    }, [bodyScrollElement, getScrollContainer]);

    const bodyHover = useBodyHoverController({
      enabled: rowHoverable,
    });
    const bodyHoverPointerProps = useBodyHoverPointerPlugin({
      enabled: rowHoverable,
      controller: bodyHover,
      bodyElement: bodyScrollElement,
    });
    const bodyHoverScrollFollow = useBodyHoverScrollFollowPlugin({
      enabled: rowHoverable,
      controller: bodyHover,
      bodyElement: bodyScrollElement,
      getScrollContainer: resolveBodyHoverScrollContainer,
    });

    useImperativeHandle(imperativeRef, () => ({
      nativeElement: wrapperRef.current!,
      scrollTo: virtualBody.scrollTo,
      scrollToTop: virtualBody.scrollToTop,
      scrollToLeft,
      startColumnsStatePreview: (options) => {
        return startColumnsStatePreview?.(options) ?? false;
      },
      saveColumnsStatePreview: () => {
        return saveColumnsStatePreview?.() ?? false;
      },
      cancelColumnsStatePreview: () => {
        cancelColumnsStatePreview?.();
      },
      setColumnVisible: (key, visible) => {
        return setColumnVisible?.(key, visible) ?? false;
      },
      setColumnFixed: (key, fixed, options) => {
        return setColumnFixed?.(key, fixed, options) ?? false;
      },
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

    const remainingBodyScrollLeft = bodyMaxScrollLeft - bodyScrollLeft;
    const showFixedStartShadow = fixColumnsGapped
      ? bodyScrollLeft > SCROLLBAR_VISIBLE_TOLERANCE &&
        fixedShadowContextValue.activeFixedStartShadowOffset === undefined
      : !isStart && !fixedOffset.hasFixStartColumns;
    const showFixedEndShadow = fixColumnsGapped
      ? remainingBodyScrollLeft > SCROLLBAR_VISIBLE_TOLERANCE &&
        fixedShadowContextValue.activeFixedEndShadowOffset === undefined
      : !isEnd && !fixedOffset.hasFixEndColumns;

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

    const bodyHeight = useMemo(() => {
      if (!showReadySkeleton) return 0;

      if (virtualBody.bodyHeight) return virtualBody.bodyHeight;
      if (
        readySkeletonConfig?.bodyHeight &&
        readySkeletonConfig.bodyHeight > 0
      ) {
        return readySkeletonConfig.bodyHeight;
      }

      return READY_SKELETON_BODY_HEIGHT;
    }, [readySkeletonConfig, showReadySkeleton, virtualBody.bodyHeight]);

    const readySkeletonWrapperStyle = useMemo<CSSProperties | undefined>(() => {
      if (bodyHeight > 0) {
        const head = getReadySkeletonHeadHeight(
          bodyHeight,
          size,
          readySkeletonConfig,
        );
        return {
          height: head + bodyHeight,
        };
      }

      return undefined;
    }, [bodyHeight, readySkeletonConfig, size]);

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

    const spinProps = useMemo<SpinProps>(() => {
      if (typeof loading === 'boolean') {
        return {
          spinning: loading,
        };
      }

      if (isObject(loading)) {
        return {
          spinning: true,
          ...loading,
        };
      }

      return {
        spinning: false,
      };
    }, [loading]);

    const renderEmptyText = useCallback(() => {
      if (empty !== undefined) {
        const image =
          empty.image === undefined
            ? Empty.PRESENTED_IMAGE_SIMPLE
            : empty.image;

        return (
          <Empty {...empty} image={image} prefixCls={`${prefixCls}-empty`} />
        );
      }

      return (
        renderEmpty?.('Table') || (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            prefixCls={`${prefixCls}-empty`}
          />
        )
      );
    }, [empty, prefixCls, renderEmpty]);

    const renderBodyNode: BodyNodeRenderer = useCallback(
      (bodyItem, renderInfo) => (
        <BodyItem
          key={renderInfo.renderKey ?? bodyItem.reactKey}
          item={bodyItem}
          renderInfo={renderInfo}
          rowHeight={rowHeight}
          expandedRowHeight={expandedRowHeight}
          hasTreeData={hasTreeData}
          rowSort={rowSort}
        />
      ),
      [rowHeight, expandedRowHeight, hasTreeData, rowSort],
    );

    const handleTableBodyScroll = useCallback<
      React.UIEventHandler<HTMLDivElement>
    >(
      (event) => {
        virtualBody.handleBodyScroll(event);
        bodyHoverScrollFollow.notifyScroll();
      },
      [bodyHoverScrollFollow, virtualBody],
    );

    const handleTableVerticalScroll = useCallback(
      (scrollTop: number) => {
        if (!virtualBody.handleVerticalScroll) return undefined;

        const handled = virtualBody.handleVerticalScroll?.(scrollTop);
        bodyHoverScrollFollow.notifyScroll();
        return handled;
      },
      [bodyHoverScrollFollow, virtualBody.handleVerticalScroll],
    );

    return (
      <div
        {...nativeProps}
        className={classNames(wrapperCls, hashId, cssVarCls, {
          [wrapperReadySkeletonCls]: showReadySkeleton,
          [wrapperInitializedCls]: initialized,
        })}
        ref={composeRef(ref, wrapperRef)}
        style={readySkeletonWrapperStyle}
      >
        <Spin
          {...spinProps}
          prefixCls={`${prefixCls}-spin`}
          wrapperClassName={spinReadySkeletonWrapperCls}
        >
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
                [noDataCls]: !hasData,
                [hasSummaryCls]: showSummary,
                [hasXScrollbarCls]: hasHorizontal,
                [hasYScrollbarCls]: hasVertical,
                [hasFixColumnsCls]: hasFixedColumns,
                [fixColumnsGappedCls]: fixColumnsGapped,
                [pingStartCls]: !isStart,
                [pingEndCls]: !isEnd,
                [hasStickyCls]: sticky,
                [previewColumnsSortingCls]: sortingColumns,
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

              <BodyHoverContext.Provider value={bodyHover.contextValue}>
                <ScrollBarContainer
                  className={bodyCls}
                  classNames={{ inner: bodyInnerCls }}
                  contentComponent={BodyWrapperComponent}
                  styles={{ content: virtualBody.bodyStyle }}
                  showVertical={bodyShowVertical}
                  ref={setTableBodyRef}
                  onScroll={handleTableBodyScroll}
                  onVerticalScroll={handleTableVerticalScroll}
                  onVerticalVisibleChange={setHasVertical}
                  updateDeps={virtualBody.updateDeps}
                  {...bodyHoverPointerProps}
                >
                  {!hasData && (
                    <BodyRowComponent
                      className={classNames(bodyRowCls, bodyNoDataRowCls)}
                    >
                      <BodyCellComponent
                        className={classNames(cellCls, noDataCellCls)}
                        style={emptyCellStyle}
                      >
                        <div
                          className={noDataCellContentCls}
                          style={emptyCellContentStyle}
                        >
                          {renderEmptyText()}
                        </div>
                      </BodyCellComponent>
                    </BodyRowComponent>
                  )}

                  <DndContext
                    sensors={rowSort.sensors}
                    collisionDetection={closestCenter}
                    onDragStart={rowSort.onDragStart}
                    onDragEnd={rowSort.onDragEnd}
                    onDragCancel={rowSort.onDragCancel}
                  >
                    <SortableContext
                      items={rowSort.items}
                      strategy={verticalListSortingStrategy}
                    >
                      {hasData && (
                        <VirtualBody
                          {...virtualBody.virtualBodyProps}
                          renderBodyNode={renderBodyNode}
                        />
                      )}
                    </SortableContext>
                    <DragOverlay
                      adjustScale={false}
                      dropAnimation={null}
                      modifiers={rowSortRuntime.overlayModifiers}
                    >
                      {rowSort.activeBodyItem &&
                        rowSortRuntime.overlayRenderInfo &&
                        renderBodyNode(
                          rowSort.activeBodyItem,
                          rowSortRuntime.overlayRenderInfo,
                        )}
                    </DragOverlay>
                  </DndContext>
                </ScrollBarContainer>
              </BodyHoverContext.Provider>

              {showSummary && (
                <Summary
                  ref={tableSummaryRef}
                  summary={summary}
                  className={classNames({ [summaryStickyCls]: sticky })}
                  style={stickySummaryStyle}
                />
              )}
            </FixedShadowContext.Provider>

            <div
              aria-hidden
              className={classNames(fixedStartShadowCls, {
                [fixedStartShadowActiveCls]: showFixedStartShadow,
              })}
            />
            <div
              aria-hidden
              className={classNames(fixedEndShadowCls, {
                [fixedEndShadowActiveCls]: showFixedEndShadow,
              })}
            />

            <HorizontalScrollbar
              prefixCls={prefixCls}
              visible={hasHorizontal}
              sticky={sticky}
              trackRef={horizontalTrackRef}
              thumbRef={horizontalThumbRef}
              thumbWidth={horizontalThumbWidth}
              onThumbPointerDown={handleHorizontalPointerDown}
            />

            <Placeholder />
          </ColumnPreviewStyleScope>
        </Spin>
        {showReadySkeleton && (
          <ReadySkeletonTable
            hashId={hashId}
            bodyHeight={bodyHeight}
            readySkeletonConfig={readySkeletonConfig}
          />
        )}
      </div>
    );
  },
);

export default Table;
