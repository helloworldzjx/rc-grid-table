import { describe, expect, it } from 'vitest';

import type { ColumnState } from '../../src/table/interface';
import type { InternalColumnState } from '../../src/table/internalInterface';
import {
  collectChangedColumnsStatePatches,
  compactUserColumnStatePatches,
} from '../../src/table/utils/columnsState';
import {
  batchPatchColumns,
  parseColumnsState,
} from '../../src/table/utils/handle';
import { mergeColumnsState } from '../../src/table/utils/mergedColumnsState';

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

const byKey = (columnsState: ColumnState[]) =>
  new Map(
    parseColumnsState(columnsState).map((column) => [column.key, column]),
  );

describe('columns state persistence', () => {
  it('restores all persisted appearance fields regardless of feature switches', () => {
    const merged = mergeColumnsState(
      [
        createColumn('a', { order: 0, fixed: 'end' }),
        createColumn('b', { order: 1 }),
      ],
      [
        {
          key: 'a',
          order: 1,
          fixed: false,
          width: 140,
          widthManuallyChanged: true,
        },
        {
          key: 'b',
          order: 0,
          visible: false,
          fixed: 'start',
          width: 180,
          widthManuallyChanged: true,
        },
      ],
    );
    const state = byKey(parseColumnsState(merged));

    expect(state.get('a')).toMatchObject({
      order: 1,
      fixed: false,
      width: 140,
      widthManuallyChanged: true,
    });
    expect(state.get('b')).toMatchObject({
      order: 0,
      visible: false,
      fixed: 'start',
      width: 180,
      widthManuallyChanged: true,
    });
  });

  it('treats empty storage as an explicit snapshot and produces complete defaults', () => {
    const merged = mergeColumnsState(
      [createColumn('a'), createColumn('b', { width: 120 })],
      [],
    );
    const state = byKey(parseColumnsState(merged));

    expect(state.get('a')).toMatchObject({
      order: 0,
      visible: true,
      width: 100,
      widthManuallyChanged: false,
    });
    expect(state.get('b')).toMatchObject({
      order: 1,
      visible: true,
      width: 120,
      widthManuallyChanged: false,
    });
  });

  it('uses current layout width for resizeDisabled columns and clears manual width', () => {
    const merged = mergeColumnsState(
      [createColumn('a', { resizeDisabled: true, width: 120 })],
      [{ key: 'a', width: 300, widthManuallyChanged: true }],
    );
    const [state] = parseColumnsState(merged);

    expect(state).toMatchObject({
      key: 'a',
      width: 120,
      widthManuallyChanged: false,
    });
  });

  it('diffs only requested fields when collecting patches', () => {
    const previousState = [{ key: 'a', visible: true, width: 100 }];
    const nextState = [{ key: 'a', visible: false, width: 140 }];

    expect(
      collectChangedColumnsStatePatches(previousState, nextState, ['visible']),
    ).toEqual([{ key: 'a', partial: { visible: false } }]);
  });

  it('compacts preview user patches to final effective user field changes', () => {
    const baseState = [
      { key: 'a', visible: true, width: 100 },
      { key: 'b', fixed: 'start' as const, width: 100 },
      { key: 'c', visible: true, width: 100 },
      { key: 'd', width: 100, widthManuallyChanged: false },
    ];
    const finalState = [
      { key: 'a', visible: false as const, width: 160 },
      { key: 'b', fixed: false as const, width: 130 },
      { key: 'c', visible: true, width: 150 },
      { key: 'd', width: 180, widthManuallyChanged: true },
    ];

    expect(
      compactUserColumnStatePatches(baseState, finalState, [
        { key: 'a', partial: { visible: false } },
        { key: 'b', partial: { fixed: false } },
        { key: 'c', partial: { visible: false } },
        { key: 'c', partial: { visible: true } },
        {
          key: 'd',
          partial: { width: 180, widthManuallyChanged: true },
        },
      ]),
    ).toEqual([
      { key: 'a', partial: { visible: false } },
      { key: 'b', partial: { fixed: false } },
      {
        key: 'd',
        partial: { width: 180, widthManuallyChanged: true },
      },
    ]);
  });

  it('preserves disabled-feature fields on later writes while dropping stale columns', () => {
    const merged = mergeColumnsState(
      [
        createColumn('name', { order: 0 }),
        createColumn('age', { order: 1 }),
        createColumn('owner', { order: 2 }),
      ],
      [
        {
          key: 'legacy',
          order: 0,
          visible: false,
          fixed: 'start',
          width: 999,
          widthManuallyChanged: true,
        },
        {
          key: 'name',
          order: 2,
          visible: false,
          fixed: 'end',
          width: 160,
          widthManuallyChanged: true,
        },
        {
          key: 'age',
          order: 0,
          width: 120,
          widthManuallyChanged: false,
        },
        {
          key: 'owner',
          order: 1,
          fixed: false,
          width: 180,
          widthManuallyChanged: true,
        },
      ],
    );
    const committedState = parseColumnsState(merged);
    const nextState = batchPatchColumns(committedState, [
      {
        key: 'age',
        partial: {
          width: 144,
          widthManuallyChanged: true,
        },
      },
    ]);
    const state = byKey(nextState);

    expect(state.has('legacy')).toBe(false);
    expect(state.get('name')).toMatchObject({
      order: 2,
      visible: false,
      fixed: 'end',
      width: 160,
      widthManuallyChanged: true,
    });
    expect(state.get('age')).toMatchObject({
      order: 0,
      width: 144,
      widthManuallyChanged: true,
    });
    expect(state.get('owner')).toMatchObject({
      order: 1,
      fixed: false,
      width: 180,
      widthManuallyChanged: true,
    });
  });
});
