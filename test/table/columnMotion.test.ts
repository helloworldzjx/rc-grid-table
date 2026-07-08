import { describe, expect, it } from 'vitest';

import {
  getColumnMotionPosition,
  getColumnMotionPositionFromStartPositions,
  getColumnMotionStartPositions,
} from '../../src/table/utils/columnMotion';

describe('column motion position helper', () => {
  const widths = [80, 120, 96, 144];

  it('calculates logical x positions from column widths', () => {
    expect(getColumnMotionPosition(widths, 0, 0)).toBe(0);
    expect(getColumnMotionPosition(widths, 1, 1)).toBe(80);
    expect(getColumnMotionPosition(widths, 2, 2)).toBe(200);
    expect(getColumnMotionPosition(widths, 3, 3)).toBe(296);
  });

  it('uses the start column for cells that span multiple columns', () => {
    expect(getColumnMotionPosition(widths, 1, 3)).toBe(80);
    expect(getColumnMotionPosition(widths, 2, 3)).toBe(200);
  });

  it('honors fixed start offsets without moving behind the normal position', () => {
    expect(
      getColumnMotionPosition(widths, 1, 1, {
        fixStart: 120,
        fixEnd: null,
      }),
    ).toBe(120);

    expect(
      getColumnMotionPosition(widths, 2, 2, {
        fixStart: 120,
        fixEnd: null,
      }),
    ).toBe(200);
  });

  it('keeps fixed end columns on their normal logical position', () => {
    expect(
      getColumnMotionPosition(widths, 2, 2, {
        fixStart: null,
        fixEnd: 40,
      }),
    ).toBe(200);
  });

  it('matches the precomputed start-position path', () => {
    const positions = getColumnMotionStartPositions(widths);

    expect(positions).toEqual([0, 80, 200, 296]);
    expect(getColumnMotionPositionFromStartPositions(positions, 0)).toBe(
      getColumnMotionPosition(widths, 0, 0),
    );
    expect(getColumnMotionPositionFromStartPositions(positions, 3)).toBe(
      getColumnMotionPosition(widths, 3, 3),
    );
    expect(
      getColumnMotionPositionFromStartPositions(positions, 1, {
        fixStart: 120,
        fixEnd: null,
      }),
    ).toBe(
      getColumnMotionPosition(widths, 1, 1, {
        fixStart: 120,
        fixEnd: null,
      }),
    );
  });
});
