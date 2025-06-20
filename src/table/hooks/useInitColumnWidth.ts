import { useLayoutEffect, useState } from 'react';
import { useTableContext } from '../context';
import { ColumnsType } from '../interface';
import { adjustColumnsWidths } from '../utils/calc';

type UseInitColumnWidthReturnType = [widths: number[], initialized: boolean]

export const useInitColumnWidth = (
  containerWidth: number,
  columns: ColumnsType<any> = [],
): UseInitColumnWidthReturnType => {
  const { columnMinWidth = 100, leafColumnMinWidth = 80 } = useTableContext();
  const [colWidths, setColWidths] = useState<number[]>([])
  const [initialized, setInitialized] = useState(false)

  useLayoutEffect(() => {
    if(containerWidth && !initialized) {
      setInitialized(true)
      const a = adjustColumnsWidths(containerWidth, columns, columnMinWidth, leafColumnMinWidth)
      // setColWidths(initWidths(a))
    }
  }, [containerWidth])

  return [colWidths, initialized];
};
