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
import { flattenMiddleState, parseHeaderRows, rebuildColumns } from './utils/handle';
import { useStyles } from './style';
import Head, { HeadRef } from './Head/Head';
import BodyRow from './Body/BodyRow';
import Summary from './Summary/Summary';
import { distribute } from './utils/calc';

const Table = forwardRef<HTMLDivElement, TableProps>((_, ref) => {
  const { 
    prefixCls, initialized, containerWidth = 0, rowKey, className, rowClassName,
    dataSource, columns, flattenColumns = [], flattenColumnsWidths = [], 
    fixedOffset, hasFixedColumns, fixColumnsGapped,
    size, bordered, stripe, scrollY, summary, sticky, 
    // scroll, virtual, itemHeight,
    style,
    columnsWidthTotal,
    middleState,
    updateMiddleState,
  } = useTableContext();
  const { scrollRef: tableBodyRef, isStart, isEnd, onScroll } = useScrollContext()

  const { 
    hashId, wrapperCls, cssVarCls, 
    wrapperInitializedCls, placeholderCls, placeholderBorderedCls,
    componentSMCls, componentMDCls,
    borderedCls, stripeCls, hasSummaryCls,
    noDataCls, contentCls, 
    hasXScrollbarCls, hasYScrollbarCls,
    hasFixColumnsCls, fixColumnsGappedCls, pingStartCls, pingEndCls,
    bodyCls, bodyInnerCls, bodyRowCls, 
    cellCls, noDataCellCls, noDataCellContentCls, 
  } = useStyles();
  
  const tableRef = useRef<ScrollBarContainerRef>(null);
  const tableHeadRef = useRef<HeadRef>(null);
  const tableSummaryRef = useRef<HTMLDivElement>(null);
  useSyncScroll(tableHeadRef.current?.nativeElement, tableBodyRef.current?.nativeScrollElement, tableSummaryRef.current!);
  
  const gridTemplateColumns = flattenColumnsWidths?.length ? `${flattenColumnsWidths?.join('px ')}px` : ''
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

  const autoFill = () => {
    const flattenedMiddleState = flattenMiddleState(middleState)
    const leafState = flattenedMiddleState.filter(state => !state.hasChildren)
    const remainingWidth = containerWidth - columnsWidthTotal;
    const { first, avg } = distribute(remainingWidth, leafState.length);
  
    // 合并
    const mergedMiddleState = flattenedMiddleState.map((state, index) => {
      if (!state.hasChildren) {
        const width = state.width as number
        const newWidth = width + (index === 0 ? first : avg);
        return { ...state, width: newWidth, updatedWidth: true };
      }
      return state;
    });
    updateMiddleState(rebuildColumns(mergedMiddleState));
  }
  
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
              [componentSMCls]: size === 'small',
              [componentMDCls]: size === 'middle',
              [borderedCls]: bordered,
              [stripeCls]: stripe,
              [noDataCls]: !dataSource?.length,
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
          shouldHorizontalUpdate={[columnsWidthTotal]}
          shouldVerticalUpdate={[dataSource, columnsWidthTotal]}
          showHorizontal
          showVertical={!scrollY}
          showStickyHorizontal={sticky}
          ref={tableRef}
          style={{[`--${prefixCls}-cols-width-total`]: `${columnsWidthTotal}px`, ...style}}
        >
          <Head ref={tableHeadRef} rows={headRows} />
          <ScrollBarContainer
            className={bodyCls} 
            classNames={{inner: bodyInnerCls}}
            style={tableHeight}
            horizontalThumbController={tableRef.current?.nativeHorizontalThumbElement}
            stickyHorizontalController={tableRef.current?.nativeStickyHorizontalElement}
            shouldVerticalUpdate={[dataSource, columnsWidthTotal]}
            showHorizontal={false}
            showVertical={!!scrollY ? {
              offsetLeft: `min(${columnsWidthTotal - 12}px, ${containerWidth - 12}px)`
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
                    className={classNames(cellCls, noDataCellCls)} 
                    style={{
                      gridColumn: `span ${flattenColumns.length || 1}`}}
                  >
                    <div 
                      className={noDataCellContentCls}
                      style={{width: `min(${columnsWidthTotal}px, ${containerWidth}px)`}}
                    >
                      <Empty prefixCls={`${prefixCls}-empty`} />
                    </div>
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
          containerWidth - columnsWidthTotal >= 1 && (
            <div 
              className={classNames(placeholderCls, hashId, {[placeholderBorderedCls]: bordered})}
              style={{left: columnsWidthTotal}}
              onClick={autoFill}
            />
          )
        }
      </Spin>
    </div>
  );
});

export default Table;
