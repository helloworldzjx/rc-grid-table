import React, { type CSSProperties, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Empty, Spin } from 'antd';
import warning from '@rc-component/util/lib/warning';

import { useTableContext } from './context';
import { useSyncScroll } from './hooks/useSyncScroll';
import type { TableProps } from './interface';
import ScrollBarContainer from '../scrollContainer';
import { ScrollBarContainerRef } from '../scrollContainer/interface';
import { filterSpan, getEllipsisTitle, parseHeaderRows } from './utils/handle';
import { useStyles } from './style';
import { getCellFixedInfo } from './utils/fixedColumns';
import Head from './Head/Head';
import BodyRow from './Body/BodyRow';
import useHorizontalWheelScroll from './hooks/useHorizontalWheelScroll';
import { useScrollContext } from './scrollContext';

const Table = forwardRef<HTMLDivElement, TableProps>((_, ref) => {
  const { 
    prefixCls, initialized, containerWidth = 0, rowKey, className, rowClassName,
    dataSource, columns, flattenColumns = [], flattenColumnsWidths = [], fixedOffset,
    bordered, scrollY, summary, sticky, 
    // scroll, virtual, itemHeight,
    style,
  } = useTableContext();
  const { scrollRef: tableBodyRef, isStart, isEnd, onScroll } = useScrollContext()
  
  const tableRef = useRef<ScrollBarContainerRef>(null);
  const tableHeadRef = useRef<HTMLDivElement>(null);
  const tableSummaryRef = useRef<HTMLDivElement>(null);
  useSyncScroll(tableHeadRef.current!, tableBodyRef.current?.nativeScrollElement, tableSummaryRef.current!);
  useHorizontalWheelScroll(tableSummaryRef.current!, containerWidth);
  const [showStickyXScrollBar, setShowStickyXScrollBar] = useState(false);
  
  const gridTemplateColumns = flattenColumnsWidths?.length ? `${flattenColumnsWidths?.join('px ')}px` : ''
  const columnWidthTotal = flattenColumnsWidths?.reduce((sum, num) => sum + num, 0)
  const hasSummary = typeof summary === 'function'
  const summaryRows = summary?.(dataSource || [], flattenColumns.length)

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

  const showStickyHorizontal = useMemo(() => {
    if(!!sticky && typeof sticky === 'object' && showStickyXScrollBar) {
      return { offsetBottom: sticky.offsetSummary }
    }

    return !!sticky && showStickyXScrollBar
  }, [sticky, showStickyXScrollBar])

  const { 
    hashId, wrapperCls, cssVarCls, wrapperInitializedCls, wrapperborderedCls, 
    borderCls, topBorderCls, rightBorderCls, bottomBorderCls, leftBorderCls, 
    borderedCls, hasSummaryCls, pingStartCls, pingEndCls,
    bodyCls, bodyInnerCls, bodyRowCls, cellCls, 
    cellEllipsisCls, cellEllipsisInnerCls, cellEllipsisInnerShowTitleCls,
    cellFixedStartCls, cellFixedStartLastCls, cellFixedEndCls, cellFixedEndFirstCls,
    summaryCls, summaryRowCls, contentCls,
  } = useStyles();

  useEffect(() => {
    if(!tableRef.current?.nativeHorizontalTrackElement) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyXScrollBar(!entry.isIntersecting);
      },
      { threshold: 0.01 }
    );
    observer.observe(tableRef.current?.nativeHorizontalTrackElement);

    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <div
      className={classNames(
        wrapperCls, 
        hashId, 
        cssVarCls,
        {
          [wrapperInitializedCls]: initialized, 
          [wrapperborderedCls]: bordered, 
        }
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
              [pingStartCls]: !isStart,
              [pingEndCls]: !isEnd,
            },
            className,
          )}
          classNames={{inner: contentCls}}
          styles={{ content: { [`--${prefixCls}-cols-width`]: gridTemplateColumns } }}
          contentController={tableBodyRef.current?.nativeScrollElement}
          shouldHorizontalUpdate={[columnWidthTotal]}
          shouldVerticalUpdate={[dataSource, columnWidthTotal]}
          showHorizontal
          showVertical={!scrollY}
          showStickyHorizontal={showStickyHorizontal}
          ref={tableRef}
          style={style}
        >
          <Head ref={tableHeadRef} rows={headRows} />
          <ScrollBarContainer
            className={bodyCls} 
            classNames={{inner: bodyInnerCls}}
            style={{...tableHeight}}
            horizontalThumbController={tableRef.current?.nativeHorizontalThumbElement}
            stickyHorizontalController={tableRef.current?.nativeStickyHorizontalElement}
            shouldVerticalUpdate={[dataSource, columnWidthTotal]}
            showHorizontal={false}
            showVertical={!!scrollY ? {
              offsetLeft: containerWidth - columnWidthTotal > 0 ? columnWidthTotal - 12 : containerWidth - 12
            } : undefined}
            footer={<div className={classNames(borderCls, bottomBorderCls)} style={{borderRadius: 0, width: columnWidthTotal}} />}
            ref={tableBodyRef}
            onScroll={onScroll}
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
          {
            hasSummary && !!dataSource?.length && (
              <div
                className={summaryCls}
                ref={tableSummaryRef}
              >
                {summaryRows?.map((row, rowIndex) => {
                  let colStart = 0
                  let colEnd = 0
                  return (
                    <div key={rowIndex} className={summaryRowCls}>
                      {row?.map((cell, cellIndex) => {
                        if(!filterSpan(cell.colSpan) || !filterSpan(cell.rowSpan)) return

                        let childrenNode = cell.children
                        const ellipsis = !!cell?.ellipsis
                        if(ellipsis) {
                          const showTitle = typeof cell?.ellipsis === "boolean" ? cell?.ellipsis : cell?.ellipsis?.showTitle
                          const elTitle = showTitle ? getEllipsisTitle(childrenNode) as string : undefined
                          childrenNode = <div title={elTitle} className={classNames(cellEllipsisInnerCls, {[cellEllipsisInnerShowTitleCls]: showTitle})}>{childrenNode}</div>
                        }

                        colEnd = colStart
                        const style: CSSProperties = {}
                        if(cell.rowSpan && cell.rowSpan > 1) {
                          style.gridRow = `span ${cell.rowSpan}`
                        }
                        if(cell.colSpan && cell.colSpan > 1) {
                          style.gridColumn = `span ${cell.colSpan}`
                          colEnd = colStart + cell.colSpan - 1
                        }
                        
                        const fixedInfo = getCellFixedInfo(colStart, colEnd, flattenColumns, fixedOffset)
                        if(fixedInfo.fixStart !== null) {
                          style.left = fixedInfo.fixStart as number
                        }
                        if(fixedInfo.fixEnd !== null) {
                          style.right = fixedInfo.fixEnd as number
                        }

                        colStart = colEnd + 1
                        
                        return (
                          <div 
                            key={cellIndex} 
                            className={classNames(
                              cellCls, 
                              {
                                [cellEllipsisCls]: ellipsis, 
                                [cellFixedStartCls]: fixedInfo.fixStart !== null,
                                [cellFixedStartLastCls]: fixedInfo.fixedStartShadow,
                                [cellFixedEndCls]: fixedInfo.fixEnd !== null,
                                [cellFixedEndFirstCls]: fixedInfo.fixedEndShadow,
                              }
                            )} 
                            style={style}
                          >
                            {cell.children}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {/* <p style={{width: columnWidthTotal, margin: 0, padding: 0}}></p> */}
              </div>
            )
          }
        </ScrollBarContainer>

        {
          bordered ? (
            <>
              <div className={classNames(borderCls, topBorderCls)} />
              <div className={classNames(borderCls, rightBorderCls)} />
              <div className={classNames(borderCls, bottomBorderCls)} />
              <div className={classNames(borderCls, leftBorderCls)} />
            </>
          ) : (
            <div className={classNames(borderCls, bottomBorderCls)} />
          )
        }
        
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
