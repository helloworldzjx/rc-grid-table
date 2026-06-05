import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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
  Key,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
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
import { useColumnSortableContext } from './columnSortableContext';
import { useComponentsContext } from './componentsContext';
import { useTableContext } from './context';
import { useExpandableContext } from './expandableContext';
import FixedShadowContext from './fixedShadowContext';
import useFixedShadow from './hooks/useFixedShadow';
import useTableScroll from './hooks/useTableScroll';
import useVirtualColumns from './hooks/useVirtualColumns';
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
import { getRowSortEntities, reorderDataSource } from './utils/rowSortable';
import { warningInvalidRecordKey } from './utils/warning';

const getStickyOffset = (
  sticky: TableProps['sticky'],
  key: 'offsetHeader' | 'offsetSummary' | 'offsetStickyScroller',
) => {
  if (!isObject(sticky)) return 0;

  const offset = sticky[key];
  return isNum(offset) ? offset : 0;
};

const isValidRowSortId = (key: Key | undefined): key is UniqueIdentifier =>
  isValidKey(key);

const isDescendantOrSelfPath = (
  parentPath: number[],
  maybeDescendantPath: number[],
) =>
  parentPath.length <= maybeDescendantPath.length &&
  parentPath.every((value, index) => value === maybeDescendantPath[index]);

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
    const { sortingColumns } = useColumnSortableContext();

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
      headStickyCls,
      bodyCls,
      bodyInnerCls,
      bodyRowCls,
      bodyGridRowCls,
      bodyRowFixedHeightCls,
      cellCls,
      noDataCellCls,
      noDataCellContentCls,
      summaryStickyCls,
    } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

    const { colsWidthCssVar, colsWidthTotalCssVar, bodyRowFixedHeightCssVar } =
      useMemo(() => getCssVar(prefixCls), [prefixCls]);

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
    const allowCrossLevelSort = !!rowSortable?.allowCrossLevelSort;
    const [activeRowSortKey, setActiveRowSortKey] = useState<Key | null>(null);
    const activeRowSortDataRef = useRef<{
      key: Key;
      index: number;
    } | null>(null);

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

    const rowSortSensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 4,
        },
      }),
    );

    const rowSortEntities = useMemo(
      () => getRowSortEntities(dataSource, rowKey, childrenColumnName),
      [childrenColumnName, dataSource, rowKey],
    );

    const rowSortItems = useMemo(
      () =>
        flattenData
          .map(({ key }) => key)
          .filter((key): key is UniqueIdentifier => isValidRowSortId(key)),
      [flattenData],
    );

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

    const lastRowSortItem = useMemo(
      () => rowSortItems[rowSortItems.length - 1],
      [rowSortItems],
    );

    const activeRowSortBodyItem = useMemo(() => {
      if (!isValidKey(activeRowSortKey)) {
        return null;
      }

      return (
        bodyItems.find(
          (item) =>
            item.type === 'row' && item.rowKeyValue === activeRowSortKey,
        ) ?? null
      );
    }, [activeRowSortKey, bodyItems]);

    const getRowSortDropDisabled = useCallback(
      (key: Key | undefined) => {
        if (!rowSortable || !isValidKey(key)) {
          return true;
        }
        if (!isValidKey(activeRowSortKey) || key === activeRowSortKey) {
          return false;
        }
        const activeEntity = rowSortEntities.get(activeRowSortKey);
        const overEntity = rowSortEntities.get(key);
        if (!activeEntity || !overEntity) {
          return true;
        }

        if (allowCrossLevelSort) {
          return isDescendantOrSelfPath(
            [...activeEntity.parentPath, activeEntity.index],
            overEntity.parentPath,
          );
        }

        return activeEntity.parentKey !== overEntity.parentKey;
      },
      [activeRowSortKey, allowCrossLevelSort, rowSortEntities, rowSortable],
    );

    const getRowSortDragDisabled = useCallback(
      (record: any, key: Key | undefined) => {
        if (!rowSortable || !isValidKey(key)) {
          return true;
        }
        const disabledByRecord = rowSortable?.rowDraggable?.(record) === false;
        return disabledByRecord;
      },
      [rowSortable],
    );

    const handleRowSortStart = useCallback((event: DragStartEvent) => {
      if (event.active.data.current?.type !== 'rowSortable') {
        return;
      }

      const activeEntity = event.active.data?.current;
      if (!activeEntity) return;

      activeRowSortDataRef.current = {
        key: activeEntity.key,
        index: activeEntity.index,
      };
      document.documentElement.style.cursor = 'grabbing';
      setActiveRowSortKey(activeEntity.key);
    }, []);

    const cleanupRowSort = useCallback(() => {
      document.documentElement.style.cursor = '';
      activeRowSortDataRef.current = null;
      setActiveRowSortKey(null);
    }, []);

    const handleRowSortEnd = useCallback(
      (event: DragEndEvent) => {
        const isRowSortEvent =
          event.active.data.current?.type === 'rowSortable' ||
          activeRowSortDataRef.current !== null;
        const activeEntity =
          event.active.data.current?.type === 'rowSortable'
            ? event.active.data.current
            : activeRowSortDataRef.current;

        if (!isRowSortEvent) {
          return;
        }

        try {
          if (!activeEntity) {
            return;
          }

          const overEntity = event.over?.data?.current;
          const activeKey = activeEntity.key;
          const overKey =
            overEntity?.type === 'rowSortable'
              ? overEntity.key
              : event.over?.id;

          if (
            isValidKey(activeKey) &&
            isValidKey(overKey) &&
            activeKey !== overKey
          ) {
            const activeIndex =
              activeEntity.index ?? rowSortEntities.get(activeKey)?.index ?? 0;
            const overIndex =
              overEntity?.index ?? rowSortEntities.get(overKey)?.index ?? 0;
            const placement = activeIndex > overIndex ? 'before' : 'after';
            const result = reorderDataSource({
              dataSource: dataSource || [],
              rowKey,
              childrenColumnName,
              activeKey,
              overKey,
              placement,
              allowCrossLevelSort,
            });

            if (result) {
              rowSortable?.onChange?.(result.dataSource, result.info);
            }
          }
        } finally {
          cleanupRowSort();
        }
      },
      [
        allowCrossLevelSort,
        childrenColumnName,
        cleanupRowSort,
        dataSource,
        rowSortEntities,
        rowKey,
        rowSortable,
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
        flattenData.length,
        mergedExpandedRowKeys,
        flattenColumnsWidths,
        scrollY,
      ],
    });

    const virtualColumns = useVirtualColumns({
      flattenColumns,
      flattenColumnsWidths,
      containerWidth,
      columnsWidthTotal,
      scrollLeft: bodyScrollLeft,
      hasHorizontal,
      virtual,
      disabled: sortingColumns,
    });

    const virtualBodyUpdateDeps = useMemo(
      () => [
        mergedExpandedRowKeys,
        columnsWidthTotal,
        virtualColumns.columns.length,
      ],
      [columnsWidthTotal, mergedExpandedRowKeys, virtualColumns.columns.length],
    );

    const virtualBody = useTableVirtualBody({
      bodyItems,
      flattenDataLength: flattenData.length,
      flattenColumns,
      scrollElement: bodyScrollElement,
      scrollY,
      virtual,
      size,
      onBodyScroll: handleBodyScroll,
      scrollBodyTo,
      scrollBodyToTop,
      extraUpdateDeps: virtualBodyUpdateDeps,
    });

    useImperativeHandle(tableRef, () => ({
      nativeElement: wrapperRef.current!,
      scrollTo: virtualBody.scrollTo,
      scrollToTop: virtualBody.scrollToTop,
      scrollToLeft,
    }));

    const rowSortAutoScroll = useMemo(
      () => ({
        canScroll: (element: Element) =>
          element === bodyScrollElement &&
          (virtualBody.inVirtual ? true : lastRowSortItem === undefined),
      }),
      [bodyScrollElement, lastRowSortItem, virtualBody.inVirtual],
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
            virtualColumns={virtualColumns}
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

      const dragDisabled = getRowSortDragDisabled(rowData, key);
      const dropDisabled = getRowSortDropDisabled(key);

      return (
        <BodyRow
          key={options.renderKey ?? bodyItem.reactKey}
          flattenColumns={flattenColumns}
          fixedOffset={fixedOffset}
          virtualColumns={virtualColumns}
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
          rowSortDragging={activeRowSortKey === key}
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
              },
              className,
            )}
            style={{
              [`${colsWidthCssVar}`]: gridTemplateColumns,
              [`${colsWidthTotalCssVar}`]: `${columnsWidthTotal}px`,
              ...style,
            }}
          >
            <FixedShadowContext.Provider value={fixedShadowContextValue}>
              <Head
                ref={tableHeadRef}
                rows={headRows}
                virtualColumns={virtualColumns}
                className={classNames({ [headStickyCls]: sticky })}
                style={stickyHeaderStyle}
              />

              <ScrollBarContainer
                className={bodyCls}
                classNames={{ inner: bodyInnerCls }}
                contentComponent={BodyWrapperComponent}
                styles={{ content: virtualBody.bodyStyle }}
                showVertical={
                  !!scrollY
                    ? {
                        offsetLeft: `max(0px, min(calc(var(${colsWidthTotalCssVar}) - ${SCROLLBAR_SIZE}px), calc(100% - ${SCROLLBAR_SIZE}px)))`,
                      }
                    : undefined
                }
                ref={setTableBodyRef}
                onScroll={virtualBody.handleBodyScroll}
                onVerticalScroll={virtualBody.handleVerticalScroll}
                onVerticalVisibleChange={setHasVertical}
                updateDeps={virtualBody.updateDeps}
              >
                {!dataSource?.length && (
                  <BodyRowComponent
                    className={classNames(bodyRowCls, {
                      [bodyGridRowCls]: virtualColumns.inVirtual,
                      [bodyRowFixedHeightCls]: rowHeight !== undefined,
                    })}
                    style={
                      rowHeight !== undefined
                        ? ({
                            [`${bodyRowFixedHeightCssVar}`]: `${rowHeight}px`,
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    <BodyCellComponent
                      className={classNames(cellCls, noDataCellCls)}
                      style={{
                        gridColumn: virtualColumns.inVirtual
                          ? `1 / span ${flattenColumns.length || 1}`
                          : `span ${flattenColumns.length || 1}`,
                      }}
                    >
                      <div
                        className={noDataCellContentCls}
                        style={{
                          width: `min(${columnsWidthTotal}px, ${containerWidth}px)`,
                        }}
                      >
                        <Empty prefixCls={`${prefixCls}-empty`} />
                      </div>
                    </BodyCellComponent>
                  </BodyRowComponent>
                )}

                <DndContext
                  sensors={rowSortSensors}
                  collisionDetection={closestCenter}
                  autoScroll={rowSortAutoScroll}
                  onDragStart={handleRowSortStart}
                  onDragEnd={handleRowSortEnd}
                  onDragCancel={cleanupRowSort}
                >
                  <SortableContext
                    items={rowSortItems}
                    strategy={verticalListSortingStrategy}
                  >
                    {hasData && virtualBody.render(renderBodyItem)}
                  </SortableContext>
                  <DragOverlay adjustScale={false} dropAnimation={null}>
                    {activeRowSortBodyItem &&
                      renderBodyItem(activeRowSortBodyItem, {
                        renderMode: virtualBody.inVirtual
                          ? 'virtual'
                          : 'normal',
                        renderKey: `row-sort-overlay-${activeRowSortBodyItem.reactKey}`,
                        style: {
                          display: 'grid',
                          gridTemplateColumns: `var(${colsWidthCssVar})`,
                          width: `var(${colsWidthTotalCssVar})`,
                        },
                        rowSortOverlay: true,
                      })}
                  </DragOverlay>
                </DndContext>
              </ScrollBarContainer>

              {showSummary && (
                <Summary
                  ref={tableSummaryRef}
                  virtualColumns={virtualColumns}
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
