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
import type { TableProps, TableRef } from './interface';
import { useStyles } from './style';
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
      // scroll, virtual,
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
      scrollTo,
      scrollToTop,
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

    const tableHeightStyle = useMemo(() => {
      let prop = 'height';
      let value: number | string = 'auto';

      if (typeof scrollY === 'number') {
        value = isNum(scrollY) ? scrollY : 'auto';
        prop = 'height';
      } else if (isObject(scrollY)) {
        value = isNum(scrollY.y) ? scrollY.y : 'auto';
        prop = scrollY.fullHeight ? 'height' : 'max-height';
      }

      return { [prop]: value };
    }, [scrollY]);

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
              style={tableHeightStyle}
              showVertical={
                !!scrollY
                  ? {
                      offsetLeft: `max(0px, min(calc(var(--${prefixCls}-cols-width-total) - 12px), calc(100% - 12px)))`,
                    }
                  : undefined
              }
              ref={setTableBodyRef}
              onScroll={handleBodyScroll}
              onVerticalVisibleChange={setHasVertical}
              updateDeps={[
                flattenData.length,
                mergedExpandedRowKeys,
                columnsWidthTotal,
                scrollY,
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
                  {flattenData?.map(
                    ({ record: rowData, rowIndex, indent, key }) => {
                      const hasValidKey = isValidKey(key);
                      warning(
                        hasValidKey,
                        'Each record in table should have a unique row key, or set `rowKey` to a string field name or a function that returns a string or finite number.',
                      );
                      if (!hasValidKey) {
                        warningInvalidRecordKey(rowKey, 'row rendering', key);
                      }
                      const rowReactKey = hasValidKey ? key : rowIndex;
                      const expanded = hasValidKey
                        ? mergedExpandedRowKeys.includes(key)
                        : false;
                      const children = getRecordChildren(
                        rowData,
                        childrenColumnName,
                      );
                      const treeExpandable = isTreeMode && children.length > 0;
                      const rowExpandable = hasExpandedRowRender
                        ? expandable?.rowExpandable?.(rowData) !== false
                        : treeExpandable;
                      const expandedRowClassName =
                        typeof expandable?.expandedRowClassName === 'function'
                          ? expandable.expandedRowClassName(
                              rowData,
                              rowIndex,
                              indent,
                            )
                          : expandable?.expandedRowClassName;
                      const dragDisabled = getRowSortDragDisabled(rowData, key);
                      const dropDisabled = getRowSortDropDisabled(key);

                      return (
                        <React.Fragment key={rowReactKey}>
                          <BodyRow
                            flattenColumns={flattenColumns}
                            fixedOffset={fixedOffset}
                            rowData={rowData}
                            rowIndex={rowIndex}
                            rowKeyValue={key}
                            indent={indent}
                            expanded={expanded}
                            expandable={hasTreeData || treeExpandable}
                            rowSupportExpand={rowExpandable}
                            className={rowClassName?.(rowData, rowIndex)}
                            rowSortDragDisabled={dragDisabled}
                            rowSortDropDisabled={dropDisabled}
                            rowSortDragging={activeRowSortKey === key}
                          />
                          {hasExpandedRowRender &&
                            expanded &&
                            rowExpandable && (
                              <ExpandedRow
                                className={expandedRowClassName}
                                indent={1}
                              >
                                {expandable?.expandedRowRender?.(
                                  rowData,
                                  rowIndex,
                                  indent,
                                  expanded,
                                )}
                              </ExpandedRow>
                            )}
                        </React.Fragment>
                      );
                    },
                  )}
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
