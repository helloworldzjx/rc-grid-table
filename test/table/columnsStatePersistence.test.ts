import { describe, expect, it } from 'vitest';

import type { ColumnState } from '../../src/table/interface';
import type { InternalColumnState } from '../../src/table/internalInterface';
import { columnsWidthDistribute } from '../../src/table/utils/calc';
import {
  collectChangedColumnsStatePatches,
  compactUserColumnStatePatches,
  isColumnsStateEqual,
  patchColumnsStateFixed,
} from '../../src/table/utils/columnsState';
import { finalizeColumnsStateSnapshot } from '../../src/table/utils/columnsStateSnapshot';
import {
  batchPatchColumns,
  flattenColumnsState,
  hydrateColumnsStateRuntimeWidths,
  parseColumnsState,
} from '../../src/table/utils/handle';
import {
  mergeStorageColumnsState,
  reconcileColumnsState,
} from '../../src/table/utils/mergedColumnsState';

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
    flattenColumnsState(parseColumnsState(columnsState)).map((column) => [
      column.key,
      column,
    ]),
  );

const orderedKeys = (columnsState: ColumnState[]) =>
  [...parseColumnsState(columnsState)]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((column) => column.key);

describe('columns state persistence', () => {
  it('restores all persisted appearance fields regardless of feature switches', () => {
    const merged = mergeStorageColumnsState(
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

  it('moves a fixed column to the last existing target fixed stack without compacting fixed gaps', () => {
    const previousState = [
      createColumn('a', { order: 0, fixed: 'start' }),
      createColumn('b', { order: 1 }),
      createColumn('c', { order: 2, fixed: 'start' }),
      createColumn('d', { order: 3 }),
      createColumn('e', { order: 4 }),
    ];
    const { nextState, found } = patchColumnsStateFixed(
      parseColumnsState(previousState),
      ['e'],
      'start',
      'last',
    );
    const state = byKey(nextState);

    expect(found).toBe(true);
    expect(orderedKeys(nextState)).toEqual(['a', 'b', 'c', 'e', 'd']);
    expect(state.get('e')).toMatchObject({ fixed: 'start', order: 3 });
    expect(state.get('d')).toMatchObject({ order: 4 });
  });

  it('allows setColumnFixed ordering inside the same fixed bucket', () => {
    const previousState = [
      createColumn('a', { order: 0, fixed: 'start' }),
      createColumn('b', { order: 1 }),
      createColumn('c', { order: 2, fixed: 'start' }),
      createColumn('d', { order: 3 }),
    ];
    const { nextState } = patchColumnsStateFixed(
      parseColumnsState(previousState),
      ['c'],
      'start',
      'first',
    );
    const patches = collectChangedColumnsStatePatches(
      parseColumnsState(previousState),
      nextState,
      ['fixed', 'order'],
    );

    expect(orderedKeys(nextState)).toEqual(['c', 'a', 'b', 'd']);
    expect(patches.some((patch) => patch.key === 'c')).toBe(true);
    expect(patches.every((patch) => !('fixed' in patch.partial))).toBe(true);
  });

  it('places columns by fixed bucket order when the target fixed bucket is empty', () => {
    const startState = [
      createColumn('a', { order: 0 }),
      createColumn('b', { order: 1, fixed: 'end' }),
      createColumn('c', { order: 2 }),
    ];
    const normalState = [
      createColumn('a', { order: 0, fixed: 'start' }),
      createColumn('c', { order: 1, fixed: 'end' }),
      createColumn('b', { order: 2, fixed: 'end' }),
    ];
    const endState = [
      createColumn('a', { order: 0 }),
      createColumn('b', { order: 1, fixed: 'start' }),
      createColumn('c', { order: 2 }),
    ];

    const firstStartResult = patchColumnsStateFixed(
      parseColumnsState(startState),
      ['c'],
      'start',
      'first',
    );
    const lastStartResult = patchColumnsStateFixed(
      parseColumnsState(startState),
      ['c'],
      'start',
      'last',
    );
    const normalResult = patchColumnsStateFixed(
      parseColumnsState(normalState),
      ['b'],
      false,
      'last',
    );
    const endResult = patchColumnsStateFixed(
      parseColumnsState(endState),
      ['a'],
      'end',
      'first',
    );

    expect(orderedKeys(firstStartResult.nextState)).toEqual(['c', 'a', 'b']);
    expect(orderedKeys(lastStartResult.nextState)).toEqual(['c', 'a', 'b']);
    expect(orderedKeys(normalResult.nextState)).toEqual(['a', 'b', 'c']);
    expect(orderedKeys(endResult.nextState)).toEqual(['b', 'c', 'a']);
    expect(byKey(normalResult.nextState).get('b')).toMatchObject({
      fixed: false,
      order: 1,
    });
    expect(byKey(endResult.nextState).get('a')).toMatchObject({
      fixed: 'end',
      order: 2,
    });
  });

  it('treats empty storage as an explicit snapshot and produces complete defaults', () => {
    const merged = mergeStorageColumnsState(
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
    const merged = mergeStorageColumnsState(
      [createColumn('a', { resizeDisabled: true, width: 120 })],
      [{ key: 'a', width: 300, widthManuallyChanged: true }],
    );
    const [state] = parseColumnsState(merged);

    expect(state).toMatchObject({
      key: 'a',
      width: 120,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
  });

  it('does not restore appearance fields when a leaf moves across parents', () => {
    const movedColumn = createColumn('moved', {
      parentKey: 'target',
      ancestorKeys: ['target'],
      depth: 1,
      width: 120,
    });
    const merged = reconcileColumnsState(
      [
        createColumn('source', {
          hasChildren: true,
          children: [
            createColumn('source-child', {
              parentKey: 'source',
              ancestorKeys: ['source'],
              depth: 1,
            }),
          ],
        }),
        createColumn('target', {
          order: 1,
          hasChildren: true,
          children: [movedColumn],
        }),
      ],
      [
        {
          key: 'source',
          children: [
            {
              key: 'moved',
              visible: false,
              fixed: 'start',
              width: 260,
              widthManuallyChanged: true,
              autoWidthLocked: true,
            },
          ],
        },
        { key: 'target' },
      ],
    );
    const state = byKey(parseColumnsState(merged));

    expect(state.get('moved')).toMatchObject({
      key: 'moved',
      visible: true,
      width: 120,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
    expect(state.get('moved')).not.toHaveProperty('fixed');
  });

  it('preserves auto width locks separately from manual resize state', () => {
    const merged = mergeStorageColumnsState(
      [createColumn('a')],
      [
        {
          key: 'a',
          width: 160,
          widthManuallyChanged: false,
          autoWidthLocked: true,
        },
      ],
    );
    const [state] = parseColumnsState(merged);

    expect(merged[0]).toMatchObject({
      width: 160,
      widthManuallyChanged: false,
      autoWidthLocked: true,
    });
    expect(state).toMatchObject({
      width: 160,
      widthManuallyChanged: false,
      autoWidthLocked: true,
    });
  });

  it('keeps runtime width locks when syncing rendered widths', () => {
    const synced = hydrateColumnsStateRuntimeWidths(
      [{ key: 'a', width: 100, widthManuallyChanged: false }],
      [
        createColumn('a', {
          width: 140,
          widthManuallyChanged: false,
          autoWidthLocked: true,
        }),
      ],
      [140],
    );

    expect(synced[0]).toMatchObject({
      width: 140,
      widthManuallyChanged: false,
      autoWidthLocked: true,
    });
  });

  it('keeps non-rendered columns when syncing rendered widths', () => {
    const synced = hydrateColumnsStateRuntimeWidths(
      [
        { key: 'a', width: 100, widthManuallyChanged: false },
        {
          key: 'b',
          visible: false,
          fixed: 'start',
          width: 180,
          widthManuallyChanged: true,
          autoWidthLocked: true,
        },
      ],
      [createColumn('a', { width: 140 })],
      [140],
    );
    const state = byKey(synced);

    expect(state.get('a')).toMatchObject({
      width: 140,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
    expect(state.get('b')).toMatchObject({
      visible: false,
      fixed: 'start',
      width: 180,
      widthManuallyChanged: true,
      autoWidthLocked: true,
    });
  });

  it('finalizes visible changes before exposing the full columns state snapshot', () => {
    const { finalColumnsState, sortedColumnsState, treeColumns } =
      finalizeColumnsStateSnapshot({
        containerWidth: 300,
        columnsState: [
          createColumn('a', { order: 0, width: 150 }),
          createColumn('b', { order: 1, visible: false, width: 150 }),
        ],
        columnMinWidth: 50,
        leafColumnMinWidth: 50,
        size: 'large',
        previewHiddenColumns: false,
      });
    const state = byKey(finalColumnsState);
    const readyState = byKey(parseColumnsState(sortedColumnsState));
    const renderState = byKey(parseColumnsState(treeColumns));

    expect(state.get('a')).toMatchObject({
      width: 300,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
    expect(state.get('b')).toMatchObject({
      visible: false,
      width: 150,
    });
    expect(readyState.get('b')).toMatchObject({
      visible: false,
      width: 150,
    });
    expect(renderState.has('b')).toBe(false);
  });

  it('rebuilds defaults from explicit empty storage after clearing persisted state', () => {
    const currentColumns = [
      createColumn('name', { order: 0, width: 120 }),
      createColumn('age', { order: 1, width: 120 }),
    ];
    const previousStorage = [
      {
        key: 'name',
        order: 1,
        visible: false,
        fixed: 'start' as const,
        width: 240,
        widthManuallyChanged: true,
        autoWidthLocked: true,
      },
      {
        key: 'age',
        order: 0,
        width: 160,
        widthManuallyChanged: true,
      },
    ];
    const previousSnapshot = finalizeColumnsStateSnapshot({
      containerWidth: 300,
      columnsState: mergeStorageColumnsState(currentColumns, previousStorage),
      columnMinWidth: 50,
      leafColumnMinWidth: 50,
      size: 'large',
    });
    const clearedSnapshot = finalizeColumnsStateSnapshot({
      containerWidth: 300,
      columnsState: mergeStorageColumnsState(currentColumns, []),
      columnMinWidth: 50,
      leafColumnMinWidth: 50,
      size: 'large',
    });
    const previousState = byKey(previousSnapshot.finalColumnsState);
    const clearedState = byKey(clearedSnapshot.finalColumnsState);

    expect(previousState.get('name')).toMatchObject({
      visible: false,
      fixed: 'start',
      width: 240,
      widthManuallyChanged: true,
      autoWidthLocked: true,
    });
    expect(clearedState.get('name')).toMatchObject({
      visible: true,
      width: 150,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
    expect(clearedState.get('name')).not.toHaveProperty('fixed');
    expect(clearedState.get('age')).toMatchObject({
      visible: true,
      width: 150,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
  });

  it('keeps preview hidden columns in the preview width snapshot', () => {
    const { finalColumnsState, flattenColumns } = finalizeColumnsStateSnapshot({
      containerWidth: 300,
      columnsState: [
        createColumn('a', { order: 0, width: 100 }),
        createColumn('b', { order: 1, visible: false, width: 100 }),
      ],
      columnMinWidth: 50,
      leafColumnMinWidth: 50,
      size: 'large',
      previewHiddenColumns: true,
    });
    const state = byKey(finalColumnsState);

    expect(flattenColumns.map((column) => column.key)).toEqual(['a', 'b']);
    expect(state.get('a')).toMatchObject({
      width: 150,
      autoWidthLocked: false,
    });
    expect(state.get('b')).toMatchObject({
      visible: false,
      width: 150,
      autoWidthLocked: false,
    });
  });

  it('does not mark runtime distributed width as a user width lock', () => {
    const { treeColumns } = columnsWidthDistribute(
      300,
      [
        { key: 'a', dataIndex: 'a' },
        { key: 'b', dataIndex: 'b', width: 100 },
      ],
      50,
      50,
    );
    const state = byKey(parseColumnsState(treeColumns));

    expect(state.get('a')).toMatchObject({
      width: 200,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
    expect(state.get('b')).toMatchObject({
      width: 100,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
  });

  it('distributes remaining width only to distributable columns in mixed layouts', () => {
    const { treeColumns } = columnsWidthDistribute(
      400,
      [
        { key: 'a', dataIndex: 'a', width: 100 },
        { key: 'b', dataIndex: 'b' },
        { key: 'c', dataIndex: 'c', width: 100 },
      ],
      50,
      50,
    );
    const state = byKey(parseColumnsState(treeColumns));

    expect(state.get('a')).toMatchObject({ width: 100 });
    expect(state.get('b')).toMatchObject({ width: 200 });
    expect(state.get('c')).toMatchObject({ width: 100 });
  });

  it('gives remaining width to the only leaf column even when resize is disabled', () => {
    const { treeColumns } = columnsWidthDistribute(
      300,
      [{ key: 'a', dataIndex: 'a', width: 100, resizeDisabled: true }],
      50,
      50,
    );
    const [state] = parseColumnsState(treeColumns);

    expect(state).toMatchObject({
      key: 'a',
      width: 300,
      widthManuallyChanged: false,
      autoWidthLocked: false,
    });
  });

  it('keeps auto width locks out of user patches but compares full state', () => {
    const previousState = [{ key: 'a', width: 100, autoWidthLocked: false }];
    const nextState = [{ key: 'a', width: 100, autoWidthLocked: true }];

    expect(collectChangedColumnsStatePatches(previousState, nextState)).toEqual(
      [],
    );
    expect(isColumnsStateEqual(previousState, nextState)).toBe(false);
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
    const merged = mergeStorageColumnsState(
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
