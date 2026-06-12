import useMemo from '@rc-component/util/lib/hooks/useMemo';
import isEqual from '@rc-component/util/lib/isEqual';
import * as React from 'react';

import type { ColumnType } from '../interface';
import type { StickyOffsets } from '../internalInterface';
import { getCellFixedInfo } from '../utils/fixedColumns';

export default function useFixedInfo<RecordType>(
  flattenColumns: readonly ColumnType<RecordType>[],
  stickyOffsets: StickyOffsets,
) {
  const fixedInfoList = React.useMemo(
    () =>
      flattenColumns.map((_, colIndex) =>
        getCellFixedInfo(colIndex, colIndex, flattenColumns, stickyOffsets),
      ),
    [flattenColumns, stickyOffsets],
  );

  return useMemo(
    () => fixedInfoList,
    [fixedInfoList],
    (prev, next) => !isEqual(prev, next),
  );
}
