import { describe, expect, it } from 'vitest';

import { getBodyCellSpanInfo } from '../../src/table/Body/cellSpan';

describe('body cell span', () => {
  it('keeps virtual rowSpan source cells as placeholders', () => {
    const spanInfo = getBodyCellSpanInfo({
      renderMode: 'virtual',
      rowSpan: 3,
      colIndex: 1,
    });

    expect(spanInfo).toMatchObject({
      renderState: 'placeholder',
      style: {
        gridColumn: '2 / span 1',
      },
    });
  });

  it('keeps non-rowSpan cells in rowSpan overlay as hidden placeholders', () => {
    const spanInfo = getBodyCellSpanInfo({
      renderMode: 'rowSpanOverlay',
      rowSpan: 1,
      colIndex: 2,
    });

    expect(spanInfo).toMatchObject({
      renderState: 'placeholder',
      style: {
        gridColumn: '3 / span 1',
      },
    });
  });

  it('renders rowSpan overlay source cells with the merged height', () => {
    const spanInfo = getBodyCellSpanInfo({
      renderMode: 'rowSpanOverlay',
      rowSpan: 3,
      colIndex: 0,
      getRowSpanHeight: (rowSpan) => rowSpan * 40,
    });

    expect(spanInfo).toMatchObject({
      renderState: 'content',
      style: {
        gridColumn: '1 / span 1',
        height: 120,
      },
    });
  });
});
