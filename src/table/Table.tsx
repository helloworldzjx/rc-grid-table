import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { composeRef } from '@rc-component/util/lib/ref';
import warning from '@rc-component/util/lib/warning';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  CSSProperties,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { SCROLLBAR_SIZE } from '../_utils/const';
import { isNum, isObject, isValidKey } from '../_utils/validate';
import BodyRow from './Body/BodyRow';
import ExpandedRow from './Body/ExpandedRow';
import type { BodyItem, BodyRenderOptions } from './Body/interface';
import useTableVirtualBody from './Body/virtual/useTableVirtualBody';
import Head from './Head/Head';
import HorizontalScrollbar from './HorizontalScrollbar';
import Placeholder from './Placeholder';
import ScrollBarContainer from './ScrollContainer';
import Summary from './Summary/Summary';
import { useComponentsContext } from './componentsContext';
import { useTableContext } from './context';
import { useExpandableContext } from './expandableContext';
import FixedShadowContext from './fixedShadowContext';
import useFixedShadow from './hooks/useFixedShadow';
import useTableRowSort from './hooks/useTableRowSort';
import useTableScroll from './hooks/useTableScroll';
import type { TableProps, TableRef } from './interface';
import { usePrefixClsContext } from './prefixClsContext';
import { useRowSortableContext } from './rowSortableContext';
import { useStyles } from './style';
import { getComponentCls, getCssVar } from './style/classNames';
import {
  flattenDataSource,
  getRecordChildren,
  getRecordKey,
  hasChildrenInData,
} from './utils/expand';
import { parseHeaderRows } from './utils/handle';
import { warningInvalidRecordKey } from './utils/warning';

const getStickyOffset = (
  sticky: TableProps['sticky'],
  key: 'offsetHeader' | 'offsetSummary' | 'offsetStickyScroller',
) => {
  if (!isObject(sticky)) return 0;

  const offset = sticky[key];
  return isNum(offset) ? offset : 0;
};

interface GridTableProps {
  tableRef?: React.Ref<TableRef>;
}

const Table = forwardRef<HTMLDivElement, GridTableProps>(
  ({ tableRef }, ref) => {
    const {
      initialized,
      containerWidth = 0,
      rowKey,
      className,
      rowClassName,
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
    const gridTemplateColumns = flattenColumnsWidths?.length
      ? `${flattenColumnsWidths?.join('px ')}px`
      : '';
    const hasExpandedRowRender =
      typeof expandable?.expandedRowRender === 'function';
    const rowHeight =
      typeof virtual === 'object' &&
      isNum(virtual.rowHeight) &&
      virtual.rowHeight > 0
        ? hasData
          ? virtual.rowHeight
          : undefined
        : undefined;
    const expandedRowHeight =
      typeof virtual === 'object' && virtual.expandedRowHeight === false
        ? undefined
        : typeof virtual === 'object' &&
          isNum(virtual.expandedRowHeight) &&
          virtual.expandedRowHeight > 0
        ? virtual.expandedRowHeight
        : rowHeight;
    const childrenColumnName = expandable?.childrenColumnName ?? 'children';

    const isTreeMode = !hasExpandedRowRender;
    const hasTreeData = useMemo(() => {
      return isTreeMode && hasChildrenInData(dataSource, childrenColumnName);
    }, [isTreeMode, dataSource, childrenColumnName]);

    const headRows = useMemo(() => {
      return parseHeaderRows(columns);
    }, [columns]);

    const flattenData = useMemo(() => {
      return isTreeMode
        ? flattenDataSource(
            dataSource || [],
            rowKey,
            childrenColumnName,
            mergedExpandedRowKeys,
          )
        : (dataSource || []).map((record, rowIndex) => ({
            record,
            rowIndex,
            indent: 0,
            key: getRecordKey(record, rowKey),
          }));
    }, [
      isTreeMode,
      dataSource,
      rowKey,
      childrenColumnName,
      mergedExpandedRowKeys,
    ]);

    const bodyItems = useMemo<BodyItem[]>(() => {
      return flattenData.reduce<BodyItem[]>(
        (items, { record: rowData, rowIndex, indent, key }) => {
          const hasValidKey = isValidKey(key);
          const rowReactKey = hasValidKey ? key : rowIndex;
          const expanded = hasValidKey
            ? mergedExpandedRowKeys.includes(key)
            : false;
          const children = getRecordChildren(rowData, childrenColumnName);
          const treeExpandable = isTreeMode && children.length > 0;
          const rowExpandable = hasExpandedRowRender
            ? expandable?.rowExpandable?.(rowData) !== false
            : treeExpandable;

          items.push({
            type: 'row',
            key: `row-${rowReactKey}`,
            reactKey: rowReactKey,
            record: rowData,
            rowIndex,
            indent,
            rowKeyValue: key,
            expanded,
            treeExpandable,
            rowExpandable,
            invalidRowKey: !hasValidKey,
          });

          if (hasExpandedRowRender && expanded && rowExpandable) {
            const expandedRowClassName =
              typeof expandable?.expandedRowClassName === 'function'
                ? expandable.expandedRowClassName(rowData, rowIndex, indent)
                : expandable?.expandedRowClassName;

            items.push({
              type: 'expanded',
              key: `expanded-${rowReactKey}`,
              reactKey: `${rowReactKey}-expanded`,
              record: rowData,
              rowIndex,
              indent,
              expanded,
              className: expandedRowClassName,
            });
          }

          return items;
        },
        [],
      );
    }, [
      childrenColumnName,
      expandable,
      flattenData,
      hasExpandedRowRender,
      isTreeMode,
      mergedExpandedRowKeys,
    ]);

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
        flattenData.length,
        mergedExpandedRowKeys,
        flattenColumnsWidths,
        scrollY,
      ],
    });

    const rowSort = useTableRowSort({
      bodyItems,
      flattenData,
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
      flattenDataLength: flattenData.length,
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

    const TableComponent = getComponent(['table'], 'div');
    const BodyWrapperComponent = getComponent(['body', 'wrapper'], 'div');
    const BodyRowComponent = getComponent(['body', 'row'], 'div');
    const BodyCellComponent = getComponent(['body', 'cell'], 'div');

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

    const tableStyle = useMemo<CSSProperties>(
      () => ({
        [`${columnsWidthCssVar}`]: gridTemplateColumns,
        [`${columnsWidthTotalCssVar}`]: `${columnsWidthTotal}px`,
        ...style,
      }),
      [
        columnsWidthCssVar,
        columnsWidthTotalCssVar,
        columnsWidthTotal,
        gridTemplateColumns,
        style,
      ],
    );

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

    const renderBodyItem = (
      bodyItem: BodyItem,
      options: BodyRenderOptions = {},
    ) => {
      if (bodyItem.type === 'expanded') {
        return (
          <ExpandedRow
            key={options.renderKey ?? bodyItem.reactKey}
            className={bodyItem.className}
            indent={1}
            style={options.style}
            rowHeight={expandedRowHeight}
            rowRef={options.rowRef}
            onRowResize={options.onRowResize}
            renderMode={options.renderMode}
          >
            {expandable?.expandedRowRender?.(
              bodyItem.record,
              bodyItem.rowIndex,
              bodyItem.indent,
              bodyItem.expanded,
            )}
          </ExpandedRow>
        );
      }

      const {
        record: rowData,
        rowIndex,
        indent,
        rowKeyValue: key,
        expanded,
        treeExpandable,
        rowExpandable,
        invalidRowKey,
      } = bodyItem;

      warning(
        !invalidRowKey,
        'Each record in table should have a unique row key, or set `rowKey` to a string field name or a function that returns a string or finite number.',
      );
      if (invalidRowKey) {
        warningInvalidRecordKey(rowKey, 'row rendering', key);
      }

      const dragDisabled = rowSort.getDragDisabled(rowData, key);
      const dropDisabled = rowSort.getDropDisabled(key);

      return (
        <BodyRow
          key={options.renderKey ?? bodyItem.reactKey}
          flattenColumns={options.flattenColumns ?? flattenColumns}
          fixedOffset={options.fixedOffset ?? fixedOffset}
          rowData={rowData}
          rowIndex={rowIndex}
          rowKeyValue={key}
          indent={indent}
          expanded={expanded}
          expandable={hasTreeData || treeExpandable}
          rowSupportExpand={rowExpandable}
          className={classNames(
            rowClassName?.(rowData, rowIndex),
            options.className,
          )}
          style={options.style}
          rowHeight={rowHeight}
          rowRef={options.rowRef}
          onRowResize={options.onRowResize}
          rowSortOverlay={options.rowSortOverlay}
          renderMode={options.renderMode}
          getRowSpanHeight={options.getRowSpanHeight}
          rowSortDragDisabled={dragDisabled}
          rowSortDropDisabled={dropDisabled}
          rowSortDragging={rowSort.activeKey === key}
        />
      );
    };

    return (
      <div
        className={classNames(wrapperCls, hashId, cssVarCls, {
          [wrapperInitializedCls]: initialized,
        })}
        ref={composeRef(ref, wrapperRef)}
      >
        <Spin prefixCls={`${prefixCls}-spin`} spinning={loading}>
          <TableComponent
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
            style={tableStyle}
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
          </TableComponent>
        </Spin>
      </div>
    );
  },
);

export default Table;
