import React, { type CSSProperties, forwardRef, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Spin } from 'antd';

import { useTableContext } from './context';
import { useSyncScroll } from './hooks/useSyncScroll';
import type { TableProps } from './interface';
import ScrollBarContainer from '../scrollContainer';
import { ScrollBarContainerRef } from '../scrollContainer/interface';
import { filterCellSpan, filterSpan, getEllipsisTitle, parseHeaderRows } from './utils/handle';
import { useStyles } from './style';
import useStickyOffsets from './hooks/useStickyOffsets';
import { getCellFixedInfo } from './utils/fixedColumns';
import useFixedInfo from './hooks/useFixedInfo';

const Table = forwardRef<HTMLDivElement, TableProps>((_, ref) => {
  const { 
    prefixCls, initialized, rowKey, className, 
    dataSource, columns, flattenColumns, flattenColumnsWidths = [], 
    containerWidth = 0, bordered, scrollY, summary, sticky, 
    columnMinWidth, leafColumnMinWidth, isStart, isEnd, scroll,
    ...rest
  } = useTableContext();

  const tableRef = useRef<ScrollBarContainerRef>(null);
  const tableHeadRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<ScrollBarContainerRef>(null);
  useSyncScroll(tableRef.current?.nativeScrollElement, tableBodyRef.current?.nativeScrollElement);
  const gridTemplateColumns = flattenColumnsWidths?.length ? `${flattenColumnsWidths?.join('px ')}px` : ''
  const columnWidthTotal = flattenColumnsWidths?.reduce((sum, num) => sum + num, 0)
  const hasSummary = typeof summary === 'function'
  const summaryRows = summary?.(flattenColumns?.length || 0, dataSource)
  const [showStickyXScrollBar, setShowStickyXScrollBar] = useState(false);

  const fixedOffset = useStickyOffsets(flattenColumnsWidths, flattenColumns || [])
  const fixedInfoList = useFixedInfo(flattenColumns || [], fixedOffset)

  const headFlattenColumns = useMemo(() => {
    return parseHeaderRows(columns)
  }, [columns])

  const tableHeight = useMemo(() => {
    let y: CSSProperties['height'] = 'auto'
    let yProp: 'height' | 'max-height' = 'height'
    
    if(typeof scrollY === 'number') {
      y = scrollY || 'auto'
      yProp = 'height'
    } else if(typeof scrollY === 'object') {
      y = scrollY.y || 'auto'
      yProp = scrollY.fullHeight ? 'height' : 'max-height'
    }

    return {[yProp]: y}
  }, [scrollY])

  const showStickyHorizontal = useMemo(() => {
    if(!!sticky && typeof sticky === 'object' && showStickyXScrollBar) {
      return { offsetBottom: sticky.offsetSummary }
    }

    return !!sticky && showStickyXScrollBar
  }, [sticky, showStickyXScrollBar])

  const { hashId, wrapperCls, cssVarKey, wrapperInitializedCls, wrapperborderedCls, 
    borderCls, topBorderCls, rightBorderCls, bottomBorderCls, leftBorderCls, 
    borderedCls, hasSummaryCls, pingStartCls, pingEndCls,
    headCls, headRowCls,  bodyCls, bodyInnerCls, bodyRowCls, 
    cellCls, cellEllipsisCls, cellEllipsisInnerCls, cellEllipsisInnerShowTitleCls, 
    cellFixedStartCls, cellFixedStartLastCls, cellFixedEndCls, cellFixedEndFirstCls,
    summaryCls, summaryRowCls, contentCls,
  } = useStyles({});

  useEffect(() => {
    let observer: IntersectionObserver | null = null

    if (tableRef.current?.nativeHorizontalTrackElement) {
      observer = new IntersectionObserver(
        ([entry]) => {
          setShowStickyXScrollBar(!entry.isIntersecting);
        },
        { threshold: 0.01 }
      );
      observer.observe(tableRef.current?.nativeHorizontalTrackElement);
    }

    return () => {
      observer?.disconnect();
      observer = null
    };
  }, []);
  
  return (
    <div
      className={classNames(
        wrapperCls, 
        hashId, 
        cssVarKey,
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
          shouldUpdate={[dataSource, columnWidthTotal]}
          showHorizontal
          showVertical={!scrollY}
          showStickyHorizontal={showStickyHorizontal}
          ref={tableRef}
          {...rest}
        >
          <div className={headCls} ref={tableHeadRef} style={{width: columnWidthTotal}}>
            {
              headFlattenColumns.map((columnsRow, columnsRowIndex) => {
                return (
                  <div className={headRowCls} key={columnsRowIndex}>
                    {
                      columnsRow?.map((col, colIndex) => {
                        if(!filterSpan(col.colSpan)) return
                        
                        const colKey = col.key || col.column?.dataIndex || colIndex;

                        let cellChildren = col.children
                        const ellipsis = !!col.column?.ellipsis
                        if(ellipsis) {
                          const showTitle = typeof col.column?.ellipsis === "boolean" ? col.column?.ellipsis : col.column?.ellipsis?.showTitle
                          const elTitle = showTitle ? getEllipsisTitle(cellChildren) as string : undefined
                          cellChildren = <div title={elTitle} className={classNames(cellEllipsisInnerCls, {[cellEllipsisInnerShowTitleCls]: showTitle})}>{cellChildren}</div>
                        }

                        const style: CSSProperties = {}
                        if(col.rowSpan && col.rowSpan > 1) {
                          style.gridRow = `span ${col.rowSpan}`
                        }
                        if(col.colSpan && col.colSpan > 1) {
                          style.gridColumn = `span ${col.colSpan}`
                          style.textAlign = 'center'
                        }

                        const fixedInfo = getCellFixedInfo(col.colStart as number, col.colEnd as number, flattenColumns || [], fixedOffset)
                        if(fixedInfo.fixStart !== null) {
                          style.left = fixedInfo.fixStart as number
                        }
                        if(fixedInfo.fixEnd !== null) {
                          style.right = fixedInfo.fixEnd as number
                        }

                        return (
                          <div 
                            key={colKey} 
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
                            {cellChildren}
                          </div>
                        );
                      })
                    }
                  </div>
                )
              })
            }
          </div>
          <ScrollBarContainer
            className={bodyCls} 
            classNames={{inner: bodyInnerCls}}
            style={{...tableHeight, position: 'sticky', left: 0}}
            shouldUpdate={[dataSource, columnWidthTotal]}
            showHorizontal={false}
            showVertical={!!scrollY ? {
              offsetLeft: containerWidth - columnWidthTotal > 0 ? columnWidthTotal - 12 : containerWidth - 12
            } : undefined}
            footer={<div className={classNames(borderCls, bottomBorderCls)} style={{borderRadius: 0, width: columnWidthTotal}} />}
            ref={tableBodyRef}
          >
            {
              !dataSource?.length && (
                <div className={bodyRowCls}>
                  <div 
                    className={classNames(cellCls, cellFixedStartCls)} 
                    style={{
                      gridColumn: `span ${flattenColumns?.length || 1}`,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: containerWidth - columnWidthTotal > 0 ? columnWidthTotal : containerWidth,
                      height: '100%',
                      backgroundColor: '#f5f5f5',
                      textAlign: 'center',
                    }}
                  >
                    empty
                  </div>
                </div>
              )
            }
            {dataSource?.map((rowData, rowIndex) => {
              return (
                <div key={rowData[rowKey as string]} className={bodyRowCls}>
                  {flattenColumns?.map((col, colIndex) => {
                    if(!filterCellSpan(col.onCell?.(rowData, rowIndex))) return

                    let cellValue: ReactNode = undefined;
                    if (col.dataIndex && typeof col.dataIndex === 'string') {
                      cellValue = rowData?.[col.dataIndex];
                    }
                    if (col.render && typeof col.render === 'function') {
                      cellValue = col.render?.(cellValue, rowData, rowIndex);
                    }

                    let cellChildren = cellValue
                    const ellipsis = !!col.ellipsis
                    if(ellipsis) {
                      const showTitle = typeof col.ellipsis === "boolean" ? col.ellipsis : col.ellipsis?.showTitle
                      const elTitle = showTitle ? getEllipsisTitle(cellChildren) as string : undefined
                      cellChildren = <div title={elTitle} className={classNames(cellEllipsisInnerCls, {[cellEllipsisInnerShowTitleCls]: showTitle})}>{cellChildren}</div>
                    }

                    const { rowSpan, colSpan } = col.onCell?.(rowData, rowIndex) || {}
                    const style: CSSProperties = {}
                    if(rowSpan && rowSpan > 1) {
                      style.gridRow = `span ${rowSpan}`
                    }
                    if(colSpan && colSpan > 1) {
                      style.gridColumn = `span ${colSpan}`
                    }

                    const fixedInfo = fixedInfoList[colIndex]
                    if(fixedInfo.fixStart !== null) {
                      style.left = fixedInfo.fixStart as number
                    }
                    if(fixedInfo.fixEnd !== null) {
                      style.right = fixedInfo.fixEnd as number
                    }

                    return (
                      <div 
                        key={colIndex} 
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
                        {cellChildren}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </ScrollBarContainer>
          {
            hasSummary && !!dataSource?.length && (
              <div
                className={summaryCls}
                style={{width: columnWidthTotal}}
              >
                {summaryRows?.map((row, rowIndex) => {
                  let colStart = 0
                  let colEnd = 0
                  return (
                    <div key={rowIndex} className={summaryRowCls}>
                      {row?.map((cell, cellIndex) => {
                        if(!filterSpan(cell.colSpan) || !filterSpan(cell.rowSpan)) return

                        let cellChildren = cell.children
                        const ellipsis = !!cell?.ellipsis
                        if(ellipsis) {
                          const showTitle = typeof cell?.ellipsis === "boolean" ? cell?.ellipsis : cell?.ellipsis?.showTitle
                          const elTitle = showTitle ? getEllipsisTitle(cellChildren) as string : undefined
                          cellChildren = <div title={elTitle} className={classNames(cellEllipsisInnerCls, {[cellEllipsisInnerShowTitleCls]: showTitle})}>{cellChildren}</div>
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
                        
                        const fixedInfo = getCellFixedInfo(colStart, colEnd, flattenColumns || [], fixedOffset)
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
          containerWidth > columnWidthTotal && (
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
