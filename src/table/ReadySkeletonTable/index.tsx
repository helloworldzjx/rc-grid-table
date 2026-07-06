import { Skeleton } from 'antd';
import classNames from 'classnames';
import React, { CSSProperties, useMemo } from 'react';

import { useTableContext } from '../contexts';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import type { TableReadySkeletonConfig } from '../interface';
import { getComponentCls, getCssVar } from '../style/classNames';
import {
  getBodySkeletonLineWidth,
  getHeadSkeletonLineWidth,
  getReadySkeletonColumnsCount,
  getReadySkeletonHeightInfo,
} from '../utils/readySkeleton';

interface SkeletonLineProps {
  prefixCls?: string;
  width: number;
}

const SkeletonLine = ({ prefixCls, width }: SkeletonLineProps) => (
  <Skeleton
    prefixCls={`${prefixCls}-skeleton`}
    title={false}
    paragraph={{ rows: 1, width: `${width}%`, style: { margin: 0 } }}
    active
  />
);

interface ReadySkeletonTableProps {
  hashId?: string;
  bodyHeight: number;
  readySkeletonConfig?: TableReadySkeletonConfig;
}

const ReadySkeletonTable = ({
  hashId,
  bodyHeight,
  readySkeletonConfig,
}: ReadySkeletonTableProps) => {
  const prefixCls = usePrefixClsContext();

  const { containerWidth, size, bordered, stripe } = useTableContext();

  const {
    readySkeletonCls,
    borderedCls,
    stripeCls,
    componentSMCls,
    componentMDCls,
    headCls,
    headInnerCls,
    headReadySkeletonInnerCls,
    headRowCls,
    filterRowCls,
    bodyCls,
    bodyInnerCls,
    bodyReadySkeletonInnerCls,
    bodyRowCls,
    bodyStripeRowCls,
    cellCls,
    filterCellCls,
    headLastCellCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const {
    columnsWidthCssVar,
    columnsWidthTotalCssVar,
    readySkeletonHeadRowHeightCssVar,
    readySkeletonBodyRowsHeightCssVar,
  } = useMemo(() => getCssVar(prefixCls), [prefixCls]);

  const columnCount = useMemo(
    () => getReadySkeletonColumnsCount(containerWidth),
    [containerWidth],
  );

  const columns = useMemo(
    () => Array.from({ length: columnCount }, (_, index) => index),
    [columnCount],
  );

  const heightInfo = useMemo(() => {
    return getReadySkeletonHeightInfo(bodyHeight, size, readySkeletonConfig);
  }, [bodyHeight, readySkeletonConfig, size]);

  const bodyRows = useMemo(
    () => Array.from({ length: heightInfo.bodyCount }, (_, index) => index),
    [heightInfo.bodyCount],
  );

  const heightValue = useMemo(() => {
    const { headRowsHeight, bodyRowsHeight } = heightInfo;

    return {
      head: headRowsHeight.join('px ') + 'px',
      body: bodyRowsHeight.join('px ') + 'px',
    };
  }, [heightInfo]);

  const tableStyle = useMemo(
    () =>
      ({
        [columnsWidthCssVar]: `repeat(${columnCount}, 1fr)`,
        [columnsWidthTotalCssVar]: `${containerWidth}px`,
        [readySkeletonHeadRowHeightCssVar]: heightValue.head,
        [readySkeletonBodyRowsHeightCssVar]: heightValue.body,
      } as CSSProperties),
    [
      columnCount,
      containerWidth,
      heightValue,
      columnsWidthCssVar,
      columnsWidthTotalCssVar,
      readySkeletonHeadRowHeightCssVar,
      readySkeletonBodyRowsHeightCssVar,
    ],
  );

  return (
    <div
      aria-busy
      className={classNames(prefixCls, hashId, readySkeletonCls, {
        [componentSMCls]: size === 'small',
        [componentMDCls]: size === 'middle',
        [borderedCls]: bordered,
        [stripeCls]: stripe,
      })}
      style={tableStyle}
    >
      <div className={headCls}>
        <div className={classNames(headInnerCls, headReadySkeletonInnerCls)}>
          <div className={headRowCls}>
            {columns.map((columnIndex) => (
              <div
                key={columnIndex}
                className={classNames(cellCls, {
                  [headLastCellCls]: columnIndex === columnCount - 1,
                })}
              >
                <SkeletonLine
                  prefixCls={prefixCls}
                  width={getHeadSkeletonLineWidth(columnIndex)}
                />
              </div>
            ))}
          </div>
          {readySkeletonConfig?.showFilterRow && (
            <div className={classNames(headRowCls, filterRowCls)}>
              {columns.map((columnIndex) => (
                <div
                  key={columnIndex}
                  className={classNames(cellCls, filterCellCls, {
                    [headLastCellCls]: columnIndex === columnCount - 1,
                  })}
                >
                  <SkeletonLine prefixCls={prefixCls} width={100} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={bodyCls}>
        <div className={classNames(bodyInnerCls, bodyReadySkeletonInnerCls)}>
          {bodyRows.map((rowIndex) => (
            <div
              key={rowIndex}
              className={classNames(bodyRowCls, {
                [bodyStripeRowCls]: stripe && (rowIndex + 1) % 2 === 0,
              })}
            >
              {columns.map((columnIndex) => (
                <div key={columnIndex} className={cellCls}>
                  <SkeletonLine
                    prefixCls={prefixCls}
                    width={getBodySkeletonLineWidth(
                      rowIndex,
                      readySkeletonConfig?.showFilterRow,
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadySkeletonTable;
