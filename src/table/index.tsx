import React, { FC, UIEventHandler, useEffect, useState } from 'react';
import TableContext from './context';
import GridTable from './Table';
import ResizeObserver from "@rc-component/resize-observer"
import { ColumnsType, type TableProps } from './interface';
import { adjustColumnsWidths } from './utils/calc';
import { flattenColumns } from './utils/handle';

const Table: FC<TableProps> = (props) => {
  if (!props?.rowKey && props?.dataSource?.length && !props.dataSource.every((v) => v.key)) {
    console.error('Table should prop `rowKey`');
  }

  const {
    rowKey = 'key',
    prefixCls = 'rc-grid-table',
    columns = [],
    columnMinWidth = 100,
    leafColumnMinWidth = 80,
    onScroll,
    ...rest
  } = props;

  const [containerWidth, setContainerWidth] = useState(0)
  const [cols, setCols] = useState<ColumnsType<any>>([])
  const [flattenColumnsWidths, setFlattenColumnsWidths] = useState<number[]>([])
  const [flattenCols, setFlattenCols] = useState<ColumnsType<any>>([])
  const [initialized, setInitialized] = useState(false)
  const [isStart, setIsStart] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

  useEffect(() => {
    if(containerWidth) {
      const adjustedWidthColumns = adjustColumnsWidths(containerWidth, columns, columnMinWidth, leafColumnMinWidth)
      setCols(adjustedWidthColumns)
      const flattenCols = flattenColumns(adjustedWidthColumns)
      setFlattenCols(flattenCols)
      setFlattenColumnsWidths(flattenCols.map((col) => col.width as number))
      !initialized && setInitialized(true)
    }
  }, [containerWidth, columns, columnMinWidth, leafColumnMinWidth])
  
  const handleScroll: UIEventHandler<HTMLDivElement> = (e) => {
    onScroll?.(e)
    const scrollLeft = e.currentTarget.scrollLeft
    const scrollWidth = e.currentTarget.scrollWidth
    const clientWidth = e.currentTarget.clientWidth
    
    if(scrollLeft === 0) {
      setIsStart(true)
    } else if(scrollWidth - clientWidth - scrollLeft <= 1) {
      setIsEnd(true)
    } else {
      setIsStart(false)
      setIsEnd(false)
    }
  }

  const baseProps = {
    prefixCls,
    initialized,
    rowKey,
    columns: cols,
    flattenColumnsWidths,
    flattenColumns: flattenCols,
    containerWidth,
    columnMinWidth,
    leafColumnMinWidth,
    onScroll: handleScroll,
    isStart,
    isEnd
  };

  return (
    <TableContext.Provider value={{ ...baseProps, ...rest }}>
      <ResizeObserver onResize={({offsetWidth}) => setContainerWidth(offsetWidth)}>
        <GridTable />
      </ResizeObserver>
    </TableContext.Provider>
  );
};

export default Table;
