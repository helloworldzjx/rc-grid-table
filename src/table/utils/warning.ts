import warning from '@rc-component/util/lib/warning';

import { isValidColumnKey, isValidKey } from '../../_utils/validate';
import type { RowKey } from '../interface';

export const warningInvalidColumnKey = (column: {
  key?: unknown;
  dataIndex?: unknown;
}) => {
  warning(
    column.key === undefined || isValidColumnKey(column.key),
    'Table column `key` should be a non-empty string or a finite number.',
  );
  warning(
    column.dataIndex === undefined || isValidColumnKey(column.dataIndex),
    'Table column `dataIndex` should be a non-empty string or a finite number when used as column key.',
  );
};

export const warningFallbackColumnKey = (column: {
  key?: unknown;
  dataIndex?: unknown;
}) => {
  warning(
    column.key !== undefined || column.dataIndex !== undefined,
    'Table column should have a valid `key` or `dataIndex`; fallback index will be used as column key.',
  );
};

export const warningInvalidRecordKey = <T = any>(
  rowKey: RowKey<T>,
  usage: string,
  key?: unknown,
) => {
  const rowKeyText =
    typeof rowKey === 'function' ? 'rowKey' : `record \`${rowKey}\``;

  warning(
    isValidKey(key),
    `Table ${rowKeyText} should be a string or finite number for ${usage}.`,
  );
};
