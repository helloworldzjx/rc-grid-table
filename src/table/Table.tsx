import warning from '@rc-component/util/lib/warning';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, { CSSProperties, forwardRef, useMemo } from 'react';

import ScrollBarContainer from '../scrollContainer';
import BodyRow from './Body/BodyRow';
import ExpandedRow from './Body/ExpandedRow';
import Head from './Head/Head';
import HorizontalScrollbar from './HorizontalScrollbar';
import Placeholder from './Placeholder';
import Summary from './Summary/Summary';
import { useTableContext } from './context';
import useTableScroll from './hooks/useTableScroll';
import type { TableProps } from './interface';
import { useStyles } from './style';
import {
  flattenDataSource,
  getRecordChildren,
  hasChildrenInData,
} from './utils/expand';
import { parseHeaderRows } from './utils/handle';

const getStickyOffset = (
  sticky: TableProps['sticky'],
  key: 'offsetHeader' | 'offsetSummary' | 'offsetStickyScroller',
) => {
  return typeof sticky === 'object' ? sticky[key] || 0 : 0;
};

const Table = forwardRef<HTMLDivElement, TableProps>((_, ref) => {
  const {
    prefixCls,
    initialized,
    containerWidth = 0,
    rowKey,
    className,
    rowClassName,
    expandable,
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
    // scroll, virtual, itemHeight,
    loading = false,
    style,
    columnsWidthTotal,
    onScroll,
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

  const hasSummary = typeof summary === 'function';
  const showSummary = hasSummary && !!dataSource?.length;
  const gridTemplateColumns = flattenColumnsWidths?.length
    ? `${flattenColumnsWidths?.join('px ')}px`
    : '';
  const hasExpandedRowRender =
    typeof expandable?.expandedRowRender === 'function';
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
          dataSource,
          rowKey as string,
          childrenColumnName,
          mergedExpandedRowKeys,
        )
      : (dataSource || []).map((record, rowIndex) => ({
          record,
          rowIndex,
          indent: 0,
          key: record?.[rowKey as string],
        }));
  }, [
    isTreeMode,
    dataSource,
    rowKey,
    childrenColumnName,
    mergedExpandedRowKeys,
  ]);
  const {
    tableHeadRef,
    tableSummaryRef,
    setTableBodyRef,
    horizontalTrackRef,
    horizontalThumbRef,
    horizontalThumbWidth,
    hasHorizontal,
    hasVertical,
    isStart,
    isEnd,
    setHasVertical,
    handleBodyScroll,
    handleHorizontalDrag,
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

  const tableHeight = useMemo(() => {
    let y: number | string = 'auto';
    let prop = 'height';

    if (typeof scrollY === 'number') {
      y = scrollY || 'auto';
      prop = 'height';
    } else if (typeof scrollY === 'object') {
      y = scrollY.y || 'auto';
      prop = scrollY.fullHeight ? 'height' : 'max-height';
    }

    return { [prop]: y };
  }, [scrollY]);

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
      ref={ref}
    >
      <Spin prefixCls={`${prefixCls}-spin`} spinning={loading}>
        <div
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
            style={tableHeight}
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
              <div className={bodyRowCls}>
                <div
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
                </div>
              </div>
            )}
            {flattenData?.map(({ record: rowData, rowIndex, indent, key }) => {
              warning(
                key !== undefined,
                'Each record in table should have a unique `key` prop, or set `rowKey` to an unique primary key.',
              );
              const expanded = mergedExpandedRowKeys.includes(key);
              const children = getRecordChildren(rowData, childrenColumnName);
              const treeExpandable = isTreeMode && children.length > 0;
              const rowExpandable = hasExpandedRowRender
                ? expandable?.rowExpandable?.(rowData) !== false
                : treeExpandable;
              const expandedRowClassName =
                typeof expandable?.expandedRowClassName === 'function'
                  ? expandable.expandedRowClassName(rowData, rowIndex, indent)
                  : expandable?.expandedRowClassName;

              return (
                <React.Fragment key={key}>
                  <BodyRow
                    flattenColumns={flattenColumns}
                    fixedOffset={fixedOffset}
                    rowData={rowData}
                    rowIndex={rowIndex}
                    indent={indent}
                    expanded={expanded}
                    expandable={hasTreeData || treeExpandable}
                    rowSupportExpand={rowExpandable}
                    className={rowClassName?.(rowData, rowIndex)}
                  />
                  {hasExpandedRowRender && expanded && rowExpandable && (
                    <ExpandedRow className={expandedRowClassName} indent={1}>
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
            })}
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
        </div>
      </Spin>
    </div>
  );
});

export default Table;
