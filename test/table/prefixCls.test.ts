import { describe, expect, it } from 'vitest';

import { defaultRootPrefixCls } from '../../src/configProvider/context';
import {
  defaultTablePrefixCls,
  getPrefixCls,
  getTablePrefixCls,
} from '../../src/table/utils/prefixCls';

describe('table prefixCls', () => {
  it('exposes root and table default prefixes', () => {
    expect(defaultRootPrefixCls).toBe('rc');
    expect(defaultTablePrefixCls).toBe('rc-grid-table');
  });

  it('builds class names from root prefix, custom prefix and suffix', () => {
    expect(getPrefixCls('rc', 'grid-table')).toBe('rc-grid-table');
    expect(getPrefixCls('rc', 'grid-table', 'custom-table')).toBe(
      'custom-table',
    );
  });

  it('uses Table prefixCls as the final table prefix when provided', () => {
    expect(getTablePrefixCls('custom')).toBe('custom-grid-table');
    expect(getTablePrefixCls('custom', 'rc-grid-table')).toBe('rc-grid-table');
    expect(getTablePrefixCls('custom', 'local-grid-table')).toBe(
      'local-grid-table',
    );
  });
});
