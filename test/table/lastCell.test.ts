import { describe, expect, it } from 'vitest';

import { getComponentCls } from '../../src/table/style/classNames';
import { hasLastColumnKey } from '../../src/table/utils/lastCell';

const columns = [{ key: 'name' }, { key: 'age' }, { key: 'address' }];

describe('last cell class helper', () => {
  it('matches the cell whose own key is the last column key', () => {
    expect(hasLastColumnKey(columns, ['address'])).toBe(true);
  });

  it('matches a colSpan range that includes the last column key', () => {
    expect(hasLastColumnKey(columns, ['age', 'address'])).toBe(true);
  });

  it('does not match a colSpan range before the last column key', () => {
    expect(hasLastColumnKey(columns, ['name', 'age'])).toBe(false);
  });

  it('exposes body and summary last cell class names', () => {
    expect(getComponentCls('rc-grid-table')).toMatchObject({
      bodyLastCellCls: 'rc-grid-table-body-last-cell',
      summaryLastCellCls: 'rc-grid-table-summary-last-cell',
    });
  });
});
