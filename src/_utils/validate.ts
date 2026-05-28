import warning from '@rc-component/util/lib/warning';
import type { Key } from 'react';

export const isNum = (input?: unknown): input is number =>
  typeof input === 'number' && Number.isFinite(input);

export const isObject = (
  input: unknown,
): input is Record<PropertyKey, unknown> =>
  input !== null && typeof input === 'object';

export const isValidKey = (input: unknown): input is Key =>
  typeof input === 'string' || isNum(input);

export const isValidColumnKey = (input: unknown): input is Key =>
  isValidKey(input) && input !== '';

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
  record: T,
  rowKey: string,
  usage: string,
) => {
  const key = record?.[rowKey as keyof T];

  warning(
    isValidKey(key),
    `Table record \`${rowKey}\` should be a string or finite number for ${usage}.`,
  );
};
