import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import useStickyOffsets from '../../src/table/hooks/useStickyOffsets';
import type { FixedType } from '../../src/table/interface';
import type { InternalColumnState } from '../../src/table/internalInterface';
import { columnsWidthDistribute } from '../../src/table/utils/calc';
import { finalizeColumnSnapshot } from '../../src/table/utils/columnStatePipeline';
import {
  flattenColumnsState,
  parseColumnsState,
} from '../../src/table/utils/handle';

const createColumn = (
  key: string,
  options: Partial<InternalColumnState> = {},
): InternalColumnState => ({
  key,
  dataIndex: key,
  parentKey: '',
  ancestorKeys: [],
  depth: 0,
  order: 0,
  visible: true,
  distribute: false,
  width: 100,
  widthManuallyChanged: false,
  autoWidthLocked: false,
  hasChildren: false,
  children: [],
  ...options,
});

const createGroup = (
  key: string,
  children: InternalColumnState[],
  options: Partial<InternalColumnState> = {},
): InternalColumnState =>
  createColumn(key, {
    dataIndex: undefined,
    width: undefined,
    hasChildren: true,
    children,
    ...options,
  });

const byKey = (columnsState: ReturnType<typeof parseColumnsState>) =>
  new Map(
    flattenColumnsState(parseColumnsState(columnsState)).map((column) => [
      column.key,
      column,
    ]),
  );

const readStickyOffsets = (
  widths: number[],
  columns: readonly { fixed?: FixedType }[],
) => {
  let result: ReturnType<typeof useStickyOffsets> | undefined;

  const Reader = () => {
    result = useStickyOffsets(widths, columns);
    return null;
  };

  renderToStaticMarkup(React.createElement(Reader));

  return result!;
};

describe('fixed columns rendering model', () => {
  it('inherits parent fixed to rendered leaf columns without expanding persisted state', () => {
    const columnsState = [
      createGroup(
        'group',
        [
          createColumn('a', {
            parentKey: 'group',
            ancestorKeys: ['group'],
            depth: 1,
          }),
          createColumn('b', {
            parentKey: 'group',
            ancestorKeys: ['group'],
            depth: 1,
          }),
        ],
        { fixed: 'start' },
      ),
    ];

    const snapshot = finalizeColumnSnapshot({
      containerWidth: 200,
      columnsState,
      columnMinWidth: 50,
      leafColumnMinWidth: 50,
      size: 'large',
    });
    const state = byKey(snapshot.finalColumnsState);

    expect(snapshot.flattenColumns.map((column) => column.fixed)).toEqual([
      'start',
      'start',
    ]);
    expect(state.get('group')).toMatchObject({ fixed: 'start' });
    expect(state.get('a')).not.toHaveProperty('fixed');
    expect(state.get('b')).not.toHaveProperty('fixed');
  });

  it('lets ownFixed false cancel inherited parent fixed for rendering', () => {
    const { flattenColumns } = columnsWidthDistribute(
      200,
      [
        createGroup(
          'group',
          [
            createColumn('a', {
              parentKey: 'group',
              ancestorKeys: ['group'],
              depth: 1,
              ownFixed: false,
            }),
            createColumn('b', {
              parentKey: 'group',
              ancestorKeys: ['group'],
              depth: 1,
            }),
          ],
          { fixed: 'start' },
        ),
      ],
      50,
      50,
      'large',
    );

    expect(flattenColumns.map((column) => column.fixed)).toEqual([
      undefined,
      'start',
    ]);
    expect(flattenColumns[0].ownFixed).toBe(false);
  });

  it('only accumulates same-direction fixed columns for sticky offsets', () => {
    expect(
      readStickyOffsets(
        [100, 120, 80, 90, 70],
        [{}, { fixed: 'start' }, {}, { fixed: 'start' }, { fixed: 'end' }],
      ),
    ).toMatchObject({
      start: [0, 0, 120, 120, 210],
      end: [70, 70, 70, 70, 0],
    });
  });

  it('detects gaps when the same fixed direction is not contiguous from its edge', () => {
    expect(
      readStickyOffsets(
        [100, 100, 100],
        [{ fixed: 'start' }, { fixed: 'end' }, { fixed: 'start' }],
      ).fixColumnsGapped,
    ).toBe(true);
    expect(
      readStickyOffsets(
        [100, 100, 100],
        [{ fixed: 'start' }, {}, { fixed: 'start' }],
      ).fixColumnsGapped,
    ).toBe(true);
    expect(
      readStickyOffsets([100, 100], [{}, { fixed: 'start' }]).fixColumnsGapped,
    ).toBe(true);
    expect(
      readStickyOffsets([100, 100], [{ fixed: 'end' }, {}]).fixColumnsGapped,
    ).toBe(true);
    expect(
      readStickyOffsets(
        [100, 100, 100],
        [{ fixed: 'start' }, {}, { fixed: 'end' }],
      ).fixColumnsGapped,
    ).toBe(false);
    expect(
      readStickyOffsets([100, 100], [{ fixed: 'start' }, { fixed: 'end' }])
        .fixColumnsGapped,
    ).toBe(false);
  });

  it('exposes gapped fixed state through sticky offsets', () => {
    expect(
      readStickyOffsets(
        [100, 120, 80],
        [{ fixed: 'start' }, { fixed: 'end' }, { fixed: 'start' }],
      ),
    ).toMatchObject({
      hasFixColumns: true,
      hasFixStartColumns: true,
      hasFixEndColumns: true,
      fixColumnsGapped: true,
    });
  });
});
