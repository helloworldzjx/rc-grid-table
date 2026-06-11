import type { Key } from 'react';

import { isValidKey } from '../../_utils/validate';

export const isValidColumnKey = (input: unknown): input is Key =>
  isValidKey(input) && input !== '';
