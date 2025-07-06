import React, { forwardRef, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { Empty, Spin } from 'antd';
import warning from '@rc-component/util/lib/warning';

import { useTableContext } from './context';
import { useScrollContext } from './scrollContext';
import type { TableProps } from './interface';
import { useSyncScroll } from './hooks/useSyncScroll';
import { ScrollBarContainerRef } from '../scrollContainer/interface';
import ScrollBarContainer from '../scrollContainer';
import { parseHeaderRows } from './utils/handle';
import { useStyles } from './style';
import Head, { HeadRef } from './Head/Head';
import BodyRow from './Body/BodyRow';
import Summary from './Summary/Summary';

const Table = forwardRef<HTMLDivElement, TableProps>((_, ref) => {
  const { 
    prefixCls, initialized, containerWidth = 0, rowKey, className, rowClassName,
    dataSource, columns, flattenColumns = [], flattenColumnsWidths = [], 
    fixedOffset, hasFixedColumns, fixColumnsGapped,
    bordered, scrollY, summary, sticky, 
    // scroll, virtual, itemHeight,
    style,
  } = useTableContext();
  const { scrollRef: tableBodyRef, isStart, isEnd, onScroll } = useScrollContext()
  
  const tableRef = useRef<ScrollBarContainerRef>(null);
  const tableHeadRef = useRef<HeadRef>(null);
  const tableSummaryRef = useRef<HTMLDivElement>(null);
  useSyncScroll(tableHeadRef.current?.nativeElement, tableBodyRef.current?.nativeScrollElement, tableSummaryRef.current!);
  
  const gridTemplateColumns = flattenColumnsWidths?.length ? `${flattenColumnsWidths?.join('px ')}px` : ''
  const columnWidthTotal = flattenColumnsWidths?.reduce((sum, num) => sum + num, 0)
  const hasSummary = typeof summary === 'function'

  const headRows = useMemo(() => {
    return parseHeaderRows(columns)
  }, [columns])

  const tableHeight = useMemo(() => {
    let y: number | string = 'auto'
    let prop = 'height'
    
    if(typeof scrollY === 'number') {
      y = scrollY || 'auto'
      prop = 'height'
    } else if(typeof scrollY === 'object') {
      y = scrollY.y || 'auto'
      prop = scrollY.fullHeight ? 'height' : 'max-height'
    }

    return {[prop]: y}
  }, [scrollY])

  const { 
    hashId, wrapperCls, cssVarCls, 
    wrapperInitializedCls, 
    borderedCls, contentCls, hasSummaryCls, 
    hasXScrollbarCls, hasYScrollbarCls,
    hasFixColumnsCls, fixColumnsGappedCls, pingStartCls, pingEndCls,
    bodyCls, bodyInnerCls, bodyRowCls, 
    cellCls, cellFixedStartCls, 
  } = useStyles();
  
  return (
    <div
      className={classNames(
        wrapperCls, 
        hashId, 
        cssVarCls,
        {[wrapperInitializedCls]: initialized}
      )}
      ref={ref} 
    >
      <Spin prefixCls={`${prefixCls}-spin`} spinning={false}>
        <ScrollBarContainer
          className={classNames(
            prefixCls,
            hashId,
            {
              [borderedCls]: bordered,
              [hasSummaryCls]: hasSummary,
              [hasFixColumnsCls]: hasFixedColumns,
              [fixColumnsGappedCls]: fixColumnsGapped,
              [pingStartCls]: !isStart,
              [pingEndCls]: !isEnd,
            },
            className,
          )}
          classNames={{inner: contentCls, hasXScrollbarCls, hasYScrollbarCls}}
          styles={{content: {
            [`--${prefixCls}-cols-width`]: gridTemplateColumns
          }}}
          contentController={tableBodyRef.current?.nativeScrollElement}
          shouldHorizontalUpdate={[columnWidthTotal]}
          shouldVerticalUpdate={[dataSource, columnWidthTotal]}
          showHorizontal
          showVertical={!scrollY}
          showStickyHorizontal={sticky}
          ref={tableRef}
          style={{[`--${prefixCls}-cols-width-total`]: `${columnWidthTotal}px`, ...style}}
        >
          <Head ref={tableHeadRef} rows={headRows} />
          <ScrollBarContainer
            className={bodyCls} 
            classNames={{inner: bodyInnerCls}}
            style={tableHeight}
            horizontalThumbController={tableRef.current?.nativeHorizontalThumbElement}
            stickyHorizontalController={tableRef.current?.nativeStickyHorizontalElement}
            shouldVerticalUpdate={[dataSource, columnWidthTotal]}
            showHorizontal={false}
            showVertical={!!scrollY ? {
              offsetLeft: containerWidth - columnWidthTotal > 0 ? columnWidthTotal - 12 : containerWidth - 12
            } : undefined}
            ref={tableBodyRef}
            onScroll={onScroll}
            childrenNextSibling={
              hasSummary && !!dataSource?.length && (
                <Summary ref={tableSummaryRef} />
              )
            }
          >
            {
              !dataSource?.length && (
                <div className={bodyRowCls}>
                  <div 
                    className={classNames(cellCls, cellFixedStartCls)} 
                    style={{
                      gridColumn: `span ${flattenColumns.length || 1}`,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: containerWidth - columnWidthTotal > 0 ? columnWidthTotal : containerWidth,
                      height: '100%',
                      backgroundColor: '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <Empty />
                  </div>
                </div>
              )
            }
            {dataSource?.map((rowData, rowIndex) => {
              const key = rowData[rowKey as string]
              warning(key !== undefined, 'Each record in table should have a unique `key` prop, or set `rowKey` to an unique primary key.')

              return (
                <BodyRow 
                  flattenColumns={flattenColumns} 
                  fixedOffset={fixedOffset} 
                  key={key} 
                  rowData={rowData} 
                  rowIndex={rowIndex} 
                  className={rowClassName?.(rowData, rowIndex)}
                />
              )
            })}
          </ScrollBarContainer>
        </ScrollBarContainer>
        
        {
          containerWidth - columnWidthTotal >= 1 && (
            <div 
              style={{
                position: 'absolute', 
                height: bordered ? 'calc(100% - 2px)' : '100%', 
                top: bordered ? 1 : 0, 
                left: columnWidthTotal,
                right: 0,
                ...bordered && {
                  borderLeftWidth: '1px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: '#ddd',
                },
                boxSizing: 'border-box',
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                userSelect: 'none',
              }}
            />
          )
        }
      </Spin>
    </div>
  );
});

export default Table;
