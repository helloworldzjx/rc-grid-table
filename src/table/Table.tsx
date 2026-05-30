import {
  closestCenter,
  DndContext,
  DragEndEvent,
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

import { isNum, isObject, isValidKey } from '../_utils/validate';
import ScrollBarContainer from '../scrollContainer';
import BodyRow from './Body/BodyRow';
import ExpandedRow from './Body/ExpandedRow';
import Head from './Head/Head';
import HorizontalScrollbar from './HorizontalScrollbar';
import Placeholder from './Placeholder';
import Summary from './Summary/Summary';
import { useTableContext } from './context';
import useTableScroll from './hooks/useTableScroll';
import useVirtualBody from './hooks/useVirtualBody';
import type { TableProps, TableRef, TableScrollToOptions } from './interface';
import { useStyles } from './style';
import {
  flattenDataSource,
  getRecordChildren,
  getRecordKey,
  hasChildrenInData,
} from './utils/expand';
import { getCellSpan, parseHeaderRows } from './utils/handle';
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

type BodyItem<T = any> =
  | {
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
    }
  | {
      type: 'expanded';
      key: Key;
      reactKey: Key;
      record: T;
      rowIndex: number;
      indent: number;
      expanded: boolean;
      className?: string;
    };

const Table = forwardRef<HTMLDivElement, GridTableProps>(
  ({ tableRef }, ref) => {
    const {
      prefixCls,
      initialized,
      containerWidth = 0,
      rowKey,
      className,
      rowClassName,
      expandable,
      rowSortable,
      mergedExpandedRowKeys = [],
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
      getComponent,
    } = useTableContext();

    const {
      hashId,
      wrapperCls,
      cssVarCls,
      wrapperInitializedCls,
      componentSMCls,
      componentMDCls,
      borderedCls,
      stripeCls,
      hasSummaryCls,
      noDataCls,
      hasXScrollbarCls,
      hasYScrollbarCls,
      hasStickyCls,
      hasFixColumnsCls,
      hasFixStartColumnsCls,
      hasFixEndColumnsCls,
      fixColumnsGappedCls,
      pingStartCls,
      pingEndCls,
      headStickyCls,
      bodyCls,
      bodyInnerCls,
      bodyVirtualFillerCls,
      bodyVirtualInnerCls,
      bodyVirtualRowSpanCls,
      bodyRowCls,
      summaryStickyCls,
      cellCls,
      noDataCellCls,
      noDataCellContentCls,
    } = useStyles();

    const wrapperRef = useRef<HTMLDivElement>(null);

    const hasSummary = typeof summary === 'function';
    const showSummary = hasSummary && !!dataSource?.length;
    const gridTemplateColumns = flattenColumnsWidths?.length
      ? `${flattenColumnsWidths?.join('px ')}px`
      : '';
    const hasExpandedRowRender =
      typeof expandable?.expandedRowRender === 'function';
    const childrenColumnName = expandable?.childrenColumnName ?? 'children';
    const allowCrossLevelSort = !!rowSortable?.allowCrossLevelSort;
    const [activeRowSortKey, setActiveRowSortKey] = useState<Key | null>(null);

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

    const virtualData = useMemo(
      () =>
        bodyItems.map((item) => ({
          key: item.key,
          item,
        })),
      [bodyItems],
    );

    const rowItemIndexMap = useMemo(() => {
      const map = new Map<number, number>();
      bodyItems.forEach((item, index) => {
        if (item.type === 'row') {
          map.set(item.rowIndex, index);
        }
      });
      return map;
    }, [bodyItems]);

    const rowLastItemIndexMap = useMemo(() => {
      const map = new Map<number, number>();
      bodyItems.forEach((item, index) => {
        map.set(item.rowIndex, index);
      });
      return map;
    }, [bodyItems]);

    const lastRowSortItem = useMemo(
      () => rowSortItems[rowSortItems.length - 1],
      [rowSortItems],
    );

    const getRowSortDropDisabled = useCallback(
      (key: Key | undefined) => {
        if (!rowSortable || !isValidKey(key)) {
          return true;
        }
        if (activeRowSortKey === null || key === activeRowSortKey) {
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

      document.documentElement.style.cursor = 'move';
      setActiveRowSortKey(activeEntity.key);
    }, []);

    const cleanupRowSort = useCallback(() => {
      document.documentElement.style.cursor = '';
      setActiveRowSortKey(null);
    }, []);

    const handleRowSortEnd = useCallback(
      (event: DragEndEvent) => {
        if (event.active.data.current?.type !== 'rowSortable') {
          return;
        }

        const activeEntity = event.active.data?.current;
        const overEntity = event.over?.data?.current;
        if (!activeEntity || !overEntity) return;

        if (activeEntity.key !== overEntity.key) {
          const placement =
            activeEntity.index > overEntity.index ? 'before' : 'after';
          const result = reorderDataSource({
            dataSource: dataSource || [],
            rowKey,
            childrenColumnName,
            activeKey: activeEntity.key,
            overKey: overEntity.key,
            placement,
            allowCrossLevelSort,
          });

          if (result) {
            rowSortable?.onChange?.(result.dataSource, result.info);
          }
        }

        cleanupRowSort();
      },
      [
        allowCrossLevelSort,
        childrenColumnName,
        cleanupRowSort,
        dataSource,
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

    const {
      inVirtual,
      scrollHeight: virtualScrollHeight,
      offsetY: virtualOffsetY,
      visibleStart: virtualVisibleStart,
      visibleEnd: virtualVisibleEnd,
      visibleItems,
      getItemSize,
      setItemRef,
      collectHeight,
      handleScroll: handleVirtualScroll,
      scrollTo: scrollVirtualTo,
    } = useVirtualBody({
      data: virtualData,
      scrollElement: bodyScrollElement,
      scrollY,
      virtual,
      size,
    });

    const getRowSpan = useCallback(
      (columnIndex: number, rowIndex: number) => {
        const bodyItemIndex = rowItemIndexMap.get(rowIndex);
        const bodyItem =
          bodyItemIndex === undefined ? undefined : bodyItems[bodyItemIndex];

        if (!bodyItem || bodyItem.type !== 'row') {
          return 1;
        }

        return getCellSpan(
          flattenColumns[columnIndex]?.onCell?.(
            bodyItem.record,
            bodyItem.rowIndex,
          )?.rowSpan,
        );
      },
      [bodyItems, flattenColumns, rowItemIndexMap],
    );

    const virtualRowSpanItems = useMemo(() => {
      if (!inVirtual || !bodyItems.length || !flattenColumns.length) {
        return [];
      }

      const columnIndexes = flattenColumns.map((_, columnIndex) => columnIndex);

      const visibleRowIndexes = bodyItems
        .slice(virtualVisibleStart, virtualVisibleEnd + 1)
        .filter(
          (item): item is Extract<BodyItem, { type: 'row' }> =>
            item.type === 'row',
        )
        .map((item) => item.rowIndex);

      if (!visibleRowIndexes.length) {
        return [];
      }

      let startRowIndex = Math.min(...visibleRowIndexes);
      let endRowIndex = Math.max(...visibleRowIndexes);

      let firstRowSpanColumns = columnIndexes.filter(
        (columnIndex) => getRowSpan(columnIndex, startRowIndex) === 0,
      );

      for (let rowIndex = startRowIndex; rowIndex >= 0; rowIndex -= 1) {
        firstRowSpanColumns = firstRowSpanColumns.filter(
          (columnIndex) => getRowSpan(columnIndex, rowIndex) === 0,
        );
        if (!firstRowSpanColumns.length) {
          startRowIndex = rowIndex;
          break;
        }
      }

      let lastRowSpanColumns = columnIndexes.filter(
        (columnIndex) => getRowSpan(columnIndex, endRowIndex) !== 1,
      );

      for (
        let rowIndex = endRowIndex;
        rowIndex < flattenData.length;
        rowIndex += 1
      ) {
        lastRowSpanColumns = lastRowSpanColumns.filter(
          (columnIndex) => getRowSpan(columnIndex, rowIndex) !== 1,
        );
        if (!lastRowSpanColumns.length) {
          endRowIndex = Math.max(rowIndex - 1, endRowIndex);
          break;
        }
      }

      const rowSpanItems: {
        bodyItem: Extract<BodyItem, { type: 'row' }>;
        top: number;
        getHeight: (rowSpan: number) => number;
      }[] = [];

      for (
        let rowIndex = startRowIndex;
        rowIndex <= endRowIndex;
        rowIndex += 1
      ) {
        const bodyItemIndex = rowItemIndexMap.get(rowIndex);
        const bodyItem =
          bodyItemIndex === undefined ? undefined : bodyItems[bodyItemIndex];

        if (
          !bodyItem ||
          bodyItem.type !== 'row' ||
          !columnIndexes.some(
            (columnIndex) => getRowSpan(columnIndex, rowIndex) > 1,
          )
        ) {
          continue;
        }

        const sourceSize = getItemSize(bodyItem.key);
        rowSpanItems.push({
          bodyItem,
          top: sourceSize.top,
          getHeight: (rowSpan: number) => {
            const endRowIndex = Math.min(
              bodyItem.rowIndex + rowSpan - 1,
              flattenData.length - 1,
            );
            const endBodyItemIndex = rowLastItemIndexMap.get(endRowIndex);
            const endBodyItem =
              endBodyItemIndex === undefined
                ? undefined
                : bodyItems[endBodyItemIndex];

            if (!endBodyItem) {
              return sourceSize.bottom - sourceSize.top;
            }

            const size = getItemSize(bodyItem.key, endBodyItem.key);
            return size.bottom - size.top;
          },
        });
      }

      return rowSpanItems;
    }, [
      bodyItems,
      flattenColumns,
      flattenData.length,
      getItemSize,
      getRowSpan,
      inVirtual,
      rowItemIndexMap,
      rowLastItemIndexMap,
      virtualVisibleEnd,
      virtualVisibleStart,
    ]);

    const handleBodyMergedScroll: React.UIEventHandler<HTMLDivElement> =
      useCallback(
        (event) => {
          handleBodyScroll(event);
          handleVirtualScroll(event.currentTarget.scrollTop);
        },
        [handleBodyScroll, handleVirtualScroll],
      );

    const handleVerticalVirtualScroll = useCallback(
      (scrollTop: number) => {
        if (!inVirtual) {
          return undefined;
        }

        handleVirtualScroll(scrollTop, false);
        return true;
      },
      [handleVirtualScroll, inVirtual],
    );

    const scrollTo = useCallback(
      (options?: TableScrollToOptions | number | null) => {
        if (
          inVirtual &&
          options &&
          typeof options === 'object' &&
          (options.top !== undefined ||
            options.index !== undefined ||
            options.key !== undefined)
        ) {
          const virtualOptions = { ...options };
          if (options.key !== undefined) {
            virtualOptions.key = `row-${options.key}`;
          }
          if (options.index !== undefined) {
            const targetRowIndex = Math.floor(options.index);
            const targetItemIndex = bodyItems.findIndex(
              (item) => item.type === 'row' && item.rowIndex === targetRowIndex,
            );
            if (targetItemIndex >= 0) {
              virtualOptions.index = targetItemIndex;
            }
          }

          if (scrollVirtualTo(virtualOptions)) {
            if (options.left !== undefined) {
              scrollBodyTo({ left: options.left });
            }
            return;
          }
        }

        if (inVirtual && typeof options === 'number') {
          scrollVirtualTo(options);
          return;
        }

        scrollBodyTo((options || undefined) as ScrollToOptions | undefined);
      },
      [bodyItems, inVirtual, scrollBodyTo, scrollVirtualTo],
    );

    const scrollToTop = useCallback(() => {
      if (inVirtual) {
        scrollVirtualTo(0);
        return;
      }

      scrollBodyToTop();
    }, [inVirtual, scrollBodyToTop, scrollVirtualTo]);

    useImperativeHandle(tableRef, () => ({
      nativeElement: wrapperRef.current!,
      scrollTo,
      scrollToTop,
      scrollToLeft,
    }));

    const rowSortAutoScroll = useMemo(
      () => ({
        canScroll: (element: Element) =>
          element === bodyScrollElement && lastRowSortItem === undefined,
      }),
      [bodyScrollElement, lastRowSortItem],
    );

    const tbodyHeightStyle = useMemo<CSSProperties | undefined>(() => {
      if (isNum(scrollY) && scrollY > 0) {
        return inVirtual
          ? { height: scrollY, maxHeight: scrollY }
          : { maxHeight: scrollY };
      }

      return undefined;
    }, [inVirtual, scrollY]);

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
      options: {
        virtual?: boolean;
        style?: CSSProperties;
        rowRef?: (element: HTMLDivElement | null) => void;
        renderKey?: Key;
        className?: string;
        virtualRenderMode?: 'normal' | 'rowSpan';
        getVirtualRowSpanHeight?: (rowSpan: number) => number;
      } = {},
    ) => {
      if (bodyItem.type === 'expanded') {
        return (
          <ExpandedRow
            key={options.renderKey ?? bodyItem.reactKey}
            className={bodyItem.className}
            indent={1}
            style={options.style}
            rowRef={options.rowRef}
            onRowResize={collectHeight}
            virtual={options.virtual}
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
          rowRef={options.rowRef}
          onRowResize={collectHeight}
          virtual={options.virtual}
          virtualRenderMode={options.virtualRenderMode}
          getVirtualRowSpanHeight={options.getVirtualRowSpanHeight}
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
              [`--${prefixCls}-cols-width`]: gridTemplateColumns,
              [`--${prefixCls}-cols-width-total`]: `${columnsWidthTotal}px`,
              ...style,
            }}
          >
            <Head
              ref={tableHeadRef}
              rows={headRows}
              className={classNames({ [headStickyCls]: sticky })}
              style={stickyHeaderStyle}
            />

            <ScrollBarContainer
              prefixCls={prefixCls}
              className={bodyCls}
              classNames={{ inner: bodyInnerCls }}
              contentComponent={BodyWrapperComponent}
              styles={{ content: tbodyHeightStyle }}
              showVertical={
                !!scrollY
                  ? {
                      offsetLeft: `max(0px, min(calc(var(--${prefixCls}-cols-width-total) - 12px), calc(100% - 12px)))`,
                    }
                  : undefined
              }
              ref={setTableBodyRef}
              onScroll={handleBodyMergedScroll}
              onVerticalScroll={
                inVirtual ? handleVerticalVirtualScroll : undefined
              }
              onVerticalVisibleChange={setHasVertical}
              updateDeps={[
                bodyItems.length,
                mergedExpandedRowKeys,
                columnsWidthTotal,
                scrollY,
                inVirtual,
                virtualScrollHeight,
              ]}
            >
              {!dataSource?.length && (
                <BodyRowComponent className={bodyRowCls}>
                  <BodyCellComponent
                    className={classNames(cellCls, noDataCellCls)}
                    style={{
                      gridColumn: `span ${flattenColumns.length || 1}`,
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
                  {!!dataSource?.length &&
                    (inVirtual ? (
                      <div
                        className={bodyVirtualFillerCls}
                        style={{ height: virtualScrollHeight }}
                      >
                        <div
                          className={bodyVirtualInnerCls}
                          style={{
                            transform: `translateY(${virtualOffsetY}px)`,
                          }}
                        >
                          {visibleItems.map(({ key, item }) =>
                            renderBodyItem(item, {
                              virtual: true,
                              rowRef: (element) => setItemRef(key, element),
                            }),
                          )}
                          {virtualRowSpanItems.map(
                            ({ bodyItem, top, getHeight }) =>
                              renderBodyItem(bodyItem, {
                                virtual: true,
                                renderKey: `rowspan-${bodyItem.reactKey}`,
                                className: bodyVirtualRowSpanCls,
                                style: { top: top - virtualOffsetY },
                                virtualRenderMode: 'rowSpan',
                                getVirtualRowSpanHeight: getHeight,
                              }),
                          )}
                        </div>
                      </div>
                    ) : (
                      bodyItems.map((item) => renderBodyItem(item))
                    ))}
                </SortableContext>
              </DndContext>
            </ScrollBarContainer>

            {showSummary && (
              <Summary
                ref={tableSummaryRef}
                className={classNames({ [summaryStickyCls]: sticky })}
                style={stickySummaryStyle}
              />
            )}

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
