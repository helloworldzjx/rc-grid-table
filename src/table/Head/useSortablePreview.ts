import { Dispatch, Key, SetStateAction, useEffect, useRef } from 'react';

import { cancelRaf, raf } from '../../_utils/raf';
import type { InternalColumnState } from '../internalInterface';
import { COLUMNS_SORT_MOTION_DURATION } from '../utils/const';
import type { SortableColumnType } from '../utils/dnd';
import { reorderColumnsState, SortablePlacement } from '../utils/sortable';

export type SortablePreviewPayload<T = any> = {
  activeIndex: number;
  overIndex: number;
  activeColumn: SortableColumnType<T>;
  overColumn: SortableColumnType<T>;
  activeKeys: Key[];
  overKeys: Key[];
};

interface UseSortablePreviewProps<T = any> {
  getBaseState: () => InternalColumnState<T>[];
  updatePreviewState: Dispatch<SetStateAction<InternalColumnState<T>[] | null>>;
  updateMotionKeys: Dispatch<SetStateAction<Set<Key>>>;
}

const getPreviewKey = (key: Key) => `${typeof key}:${String(key)}`;

const getPreviewKeysSignature = (keys: Key[]) =>
  keys.map(getPreviewKey).join(',');

const getPreviewSignature = <T>(payload: SortablePreviewPayload<T>) => {
  const {
    activeIndex,
    overIndex,
    activeColumn,
    overColumn,
    activeKeys,
    overKeys,
  } = payload;
  const placement: SortablePlacement =
    activeIndex > overIndex ? 'start' : 'end';

  return {
    placement,
    signature: [
      getPreviewKey(activeColumn.key),
      getPreviewKey(overColumn.key),
      activeColumn.parentKey,
      placement,
      getPreviewKeysSignature(activeKeys),
      getPreviewKeysSignature(overKeys),
    ].join('|'),
  };
};

const areKeySetsEqual = (a: ReadonlySet<Key>, b: ReadonlySet<Key>) => {
  if (a.size !== b.size) return false;

  let equal = true;
  a.forEach((key) => {
    if (!b.has(key)) {
      equal = false;
    }
  });

  return equal;
};

type SortableMotionCache = {
  coveredLeafKeys: Map<Key, Key[]>;
  leafKeys: Key[];
};

const sortColumns = <T>(columns: InternalColumnState<T>[]) =>
  [...columns].sort((a, b) => a.order - b.order);

const createSortableMotionCache = <T>(
  columns: InternalColumnState<T>[],
): SortableMotionCache => {
  const coveredLeafKeys = new Map<Key, Key[]>();
  const leafKeys: Key[] = [];

  const collectColumnLeafKeys = (column: InternalColumnState<T>): Key[] => {
    if (column.children?.length) {
      const keys = sortColumns(column.children).flatMap((child) =>
        collectColumnLeafKeys(child),
      );
      coveredLeafKeys.set(column.key, keys);
      return keys;
    }

    leafKeys.push(column.key);
    const keys = [column.key];
    coveredLeafKeys.set(column.key, keys);
    return keys;
  };

  sortColumns(columns).forEach((column) => collectColumnLeafKeys(column));

  return {
    coveredLeafKeys,
    leafKeys,
  };
};

const collectCoveredLeafKeys = (
  motionCache: SortableMotionCache,
  targetKeys: Key[],
) => {
  const keys: Key[] = [];
  const pushedKeys = new Set<Key>();

  targetKeys.forEach((key) => {
    const coveredKeys = motionCache.coveredLeafKeys.get(key) ?? [key];

    coveredKeys.forEach((coveredKey) => {
      if (pushedKeys.has(coveredKey)) return;

      pushedKeys.add(coveredKey);
      keys.push(coveredKey);
    });
  });

  return keys;
};

const getSortableMotionKeys = <T>(
  motionCache: SortableMotionCache,
  payload: SortablePreviewPayload<T>,
) => {
  const { leafKeys } = motionCache;
  if (!leafKeys.length) return new Set<Key>();

  const activeLeafKeys = collectCoveredLeafKeys(
    motionCache,
    payload.activeKeys,
  );
  const overLeafKeys = collectCoveredLeafKeys(motionCache, payload.overKeys);
  const coveredKeys = new Set([
    ...(activeLeafKeys.length ? activeLeafKeys : payload.activeKeys),
    ...(overLeafKeys.length ? overLeafKeys : payload.overKeys),
  ]);
  const indexes = leafKeys.reduce((result: number[], key, index) => {
    if (coveredKeys.has(key)) {
      result.push(index);
    }

    return result;
  }, []);

  if (!indexes.length) return new Set<Key>();

  const start = Math.min(...indexes);
  const end = Math.max(...indexes);
  // Motion layout 只覆盖 active 与 over 之间的连续叶子列区间。
  // span/group header 只要跨到这个区间，也会被 motionKeys 命中。
  return new Set(leafKeys.slice(start, end + 1));
};

const useSortablePreview = <T>({
  getBaseState,
  updatePreviewState,
  updateMotionKeys,
}: UseSortablePreviewProps<T>) => {
  const getBaseStateRef = useRef(getBaseState);
  const updatePreviewStateRef = useRef(updatePreviewState);
  const updateMotionKeysRef = useRef(updateMotionKeys);
  const previewStateRef = useRef<InternalColumnState<T>[] | null>(null);
  const previewChangedRef = useRef(false);
  const previewFrameRef = useRef<number | null>(null);
  const previewPayloadRef = useRef<SortablePreviewPayload<T> | null>(null);
  const previewSignatureRef = useRef<string | null>(null);
  const currentMotionKeysRef = useRef<Set<Key>>(new Set());
  const retainedMotionKeysRef = useRef<Set<Key>>(new Set());
  const motionCacheRef = useRef<SortableMotionCache | null>(null);
  const motionReleaseTimersRef = useRef(
    new Map<Key, ReturnType<typeof setTimeout>>(),
  );
  const motionTransitionDeadlineRef = useRef(0);

  getBaseStateRef.current = getBaseState;
  updatePreviewStateRef.current = updatePreviewState;
  updateMotionKeysRef.current = updateMotionKeys;

  const markMotionTransition = () => {
    motionTransitionDeadlineRef.current =
      Date.now() + COLUMNS_SORT_MOTION_DURATION;
  };

  const commitRetainedMotionKeys = (nextKeys: Set<Key>) => {
    retainedMotionKeysRef.current = nextKeys;
    updateMotionKeysRef.current((prevKeys) =>
      areKeySetsEqual(prevKeys, nextKeys) ? prevKeys : nextKeys,
    );
  };

  const clearMotionReleaseTimers = () => {
    motionReleaseTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });
    motionReleaseTimersRef.current.clear();
  };

  const resetSortableMotionKeys = () => {
    clearMotionReleaseTimers();
    currentMotionKeysRef.current = new Set();
    retainedMotionKeysRef.current = new Set();
    motionTransitionDeadlineRef.current = 0;
    updateMotionKeysRef.current(new Set<Key>());
  };

  const applySortableMotionKeys = (nextKeys: Set<Key>) => {
    const releaseTimers = motionReleaseTimersRef.current;
    const nextRetainedKeys = new Set(retainedMotionKeysRef.current);
    let retainedChanged = false;

    nextKeys.forEach((key) => {
      const releaseTimer = releaseTimers.get(key);
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        releaseTimers.delete(key);
      }

      if (!nextRetainedKeys.has(key)) {
        nextRetainedKeys.add(key);
        retainedChanged = true;
      }
    });

    currentMotionKeysRef.current = nextKeys;

    // 快速划过很多列时，active-over 区间会瞬间缩小。
    // 离开当前区间的 key 先保留一个 motion 动画周期，避免 CellContainer 立刻从 motion 组件切回普通组件而截断 layout projection。
    retainedMotionKeysRef.current.forEach((key) => {
      if (nextKeys.has(key) || releaseTimers.has(key)) return;

      const releaseTimer = setTimeout(() => {
        releaseTimers.delete(key);
        if (currentMotionKeysRef.current.has(key)) return;

        const afterReleaseKeys = new Set(retainedMotionKeysRef.current);
        if (!afterReleaseKeys.delete(key)) return;

        commitRetainedMotionKeys(afterReleaseKeys);
      }, COLUMNS_SORT_MOTION_DURATION);

      releaseTimers.set(key, releaseTimer);
    });

    if (retainedChanged) {
      commitRetainedMotionKeys(nextRetainedKeys);
    }
  };

  const updateSortableMotionKeys = (payload: SortablePreviewPayload<T>) => {
    const motionCache =
      motionCacheRef.current ||
      createSortableMotionCache(
        previewStateRef.current || getBaseStateRef.current(),
      );
    motionCacheRef.current = motionCache;
    const nextKeys = getSortableMotionKeys(motionCache, payload);

    applySortableMotionKeys(nextKeys);
  };

  const updatePreview = (payload: SortablePreviewPayload<T>) => {
    const baseState = previewStateRef.current || getBaseStateRef.current();
    const { placement, signature } = getPreviewSignature(payload);

    if (previewSignatureRef.current === signature) {
      return true;
    }

    // sortablePreviewState 只驱动临时列结构预览，并通过 RAF 合并更新，
    // 避免 pointer move 频率直接放大成 React commit 频率。
    const { activeColumn, activeKeys, overKeys } = payload;
    const nextState = reorderColumnsState(
      baseState,
      activeColumn.parentKey,
      activeKeys,
      overKeys,
      placement,
    );

    if (nextState) {
      previewChangedRef.current = true;
      previewStateRef.current = nextState as InternalColumnState<T>[];
      motionCacheRef.current = createSortableMotionCache(
        nextState as InternalColumnState<T>[],
      );
      previewSignatureRef.current = signature;
      markMotionTransition();
      updatePreviewStateRef.current(nextState as InternalColumnState<T>[]);
    }

    return true;
  };

  const flush = () => {
    cancelRaf(previewFrameRef.current);
    previewFrameRef.current = null;

    const payload = previewPayloadRef.current;
    previewPayloadRef.current = null;
    if (payload) {
      updatePreview(payload);
    }
  };

  const cancel = () => {
    cancelRaf(previewFrameRef.current);
    previewFrameRef.current = null;
    previewPayloadRef.current = null;
  };

  const schedule = (payload: SortablePreviewPayload<T>) => {
    previewPayloadRef.current = payload;
    updateSortableMotionKeys(payload);

    if (previewFrameRef.current !== null) return true;

    previewFrameRef.current = raf(flush);
    return true;
  };

  const start = () => {
    cancel();
    previewStateRef.current = getBaseStateRef.current();
    motionCacheRef.current = createSortableMotionCache(previewStateRef.current);
    previewChangedRef.current = false;
    previewSignatureRef.current = null;
    resetSortableMotionKeys();
  };

  const cleanup = (clearPreview = true) => {
    cancel();
    previewStateRef.current = null;
    motionCacheRef.current = null;
    previewChangedRef.current = false;
    previewSignatureRef.current = null;
    resetSortableMotionKeys();
    if (clearPreview) {
      updatePreviewStateRef.current(null);
    }
  };

  const rollback = () => {
    cancel();
    if (previewChangedRef.current) {
      // cancel 时先让 preview layout 回到真实列结构，但暂时保留 motionKeys；
      // HeadRow 会在动画结束后再真正关闭 sortingColumns 和清空 motionKeys。
      markMotionTransition();
      updatePreviewStateRef.current(null);
    }

    previewStateRef.current = null;
    motionCacheRef.current = null;
    previewChangedRef.current = false;
    previewSignatureRef.current = null;
  };

  const getMotionFinishDelay = () => {
    const motionRunning =
      motionTransitionDeadlineRef.current > Date.now() ||
      motionReleaseTimersRef.current.size > 0;

    return motionRunning ? COLUMNS_SORT_MOTION_DURATION : 0;
  };

  const getPreviewState = () => previewStateRef.current;
  const hasPreviewChanged = () => previewChangedRef.current;

  useEffect(() => {
    return () => {
      cancel();
      clearMotionReleaseTimers();
    };
  }, []);

  return {
    cancel,
    cleanup,
    flush,
    getPreviewState,
    getMotionFinishDelay,
    hasPreviewChanged,
    rollback,
    schedule,
    start,
  };
};

export default useSortablePreview;
