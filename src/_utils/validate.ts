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
