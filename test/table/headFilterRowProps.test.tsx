import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import TableContext from '../../src/table/contexts/TableContext';
import TableLayoutContext from '../../src/table/contexts/TableLayoutContext';
import HeadFilterRow from '../../src/table/Head/HeadFilterRow';
import type {
  InternalColumnState,
  StickyOffsets,
  TableContextProps,
  TableLayoutContextProps,
} from '../../src/table/internalInterface';

const fixedOffset: StickyOffsets = {
  start: [0],
  end: [0],
  widths: [120],
  hasFixColumns: false,
  hasFixStartColumns: false,
  hasFixEndColumns: false,
  fixColumnsGapped: false,
};

const createColumn = (
  overrides: Partial<InternalColumnState> = {},
): InternalColumnState => ({
  key: 'name',
  dataIndex: 'name',
  parentKey: '',
  ancestorKeys: [],
  depth: 0,
  order: 0,
  distribute: false,
  visible: true,
  hasChildren: false,
  widthManuallyChanged: false,
  autoWidthLocked: false,
  filterRender: () => 'filter',
  ...overrides,
});

const renderHeadFilterRow = (
  column: InternalColumnState,
  context: Partial<TableContextProps> = {},
) => {
  const layoutContext: TableLayoutContextProps = {
    containerWidth: 120,
    containerHeight: 40,
    columns: [column],
    flattenColumns: [column],
    flattenColumnsWidths: [120],
    columnsWidthTotal: 120,
    fixedOffset,
    hasFixedColumns: false,
    fixColumnsGapped: false,
  };

  return renderToStaticMarkup(
    <TableLayoutContext.Provider value={layoutContext}>
      <TableContext.Provider value={context as TableContextProps}>
        <HeadFilterRow headRowIndex={1} />
      </TableContext.Provider>
    </TableLayoutContext.Provider>,
  );
};

describe('head filter row props', () => {
  it('uses onHeaderFilterRow instead of onHeaderRow', () => {
    const column = createColumn();
    const onHeaderRow = vi.fn(() => ({ className: 'header-row-prop' }));
    const onHeaderFilterRow = vi.fn(() => ({
      className: 'filter-row-prop',
      title: 'filter row',
    }));

    const html = renderHeadFilterRow(column, {
      onHeaderRow,
      onHeaderFilterRow,
    });

    expect(onHeaderRow).not.toHaveBeenCalled();
    expect(onHeaderFilterRow).toHaveBeenCalledWith([column], 1);
    expect(html).toContain('filter-row-prop');
    expect(html).toContain('title="filter row"');
    expect(html).not.toContain('header-row-prop');
  });

  it('uses onHeadFilterRowCell for filter cells', () => {
    const onHeadFilterRowCell = vi.fn(() => ({
      className: 'table-filter-cell-prop',
      title: 'table filter cell',
    }));
    const column = createColumn({
      onHeadFilterRowCell: vi.fn(() => ({
        className: 'column-filter-cell-prop',
        id: 'column-filter-cell',
      })),
    });

    const html = renderHeadFilterRow(column, { onHeadFilterRowCell });

    expect(onHeadFilterRowCell).toHaveBeenCalledWith(column, 0);
    expect(column.onHeadFilterRowCell).toHaveBeenCalledWith(column, 0);
    expect(html).toContain('table-filter-cell-prop');
    expect(html).toContain('column-filter-cell-prop');
    expect(html).toContain('title="table filter cell"');
    expect(html).toContain('id="column-filter-cell"');
  });
});
