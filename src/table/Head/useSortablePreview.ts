import { Dispatch, Key, SetStateAction, useEffect, useRef } from 'react';

import { COLUMNS_SORT_MOTION_DURATION } from '../../_utils/const';
import { cancelRaf, raf } from '../../_utils/raf';
import { InternalColumnState } from '../interface';
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
  updateDraftState: Dispatch<SetStateAction<InternalColumnState<T>[] | null>>;
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

const collectLeafKeys = <T>(columns: InternalColumnState<T>[]) => {
  const keys: Key[] = [];

  const traverse = (cols: InternalColumnState<T>[]) => {
    [...cols]
      .sort((a, b) => a.order - b.order)
      .forEach((column) => {
        if (column.children?.length) {
          traverse(column.children);
          return;
        }

        keys.push(column.key);
      });
  };

  traverse(columns);
  return keys;
};

const collectCoveredLeafKeys = <T>(
  columns: InternalColumnState<T>[],
  targetKeys: Key[],
) => {
  const targetKeySet = new Set(targetKeys);
  const keys: Key[] = [];

  const pushLeafKeys = (column: InternalColumnState<T>) => {
    if (column.children?.length) {
      [...column.children]
        .sort((a, b) => a.order - b.order)
        .forEach((child) => pushLeafKeys(child));
      return;
    }

    keys.push(column.key);
  };

  const traverse = (cols: InternalColumnState<T>[]) => {
    [...cols]
      .sort((a, b) => a.order - b.order)
      .forEach((column) => {
        if (targetKeySet.has(column.key)) {
          pushLeafKeys(column);
          return;
        }

        if (column.children?.length) {
          traverse(column.children);
        }
      });
  };

  traverse(columns);
  return keys;
};

const getSortableMotionKeys = <T>(
  columnsState: InternalColumnState<T>[],
  payload: SortablePreviewPayload<T>,
) => {
  const leafKeys = collectLeafKeys(columnsState);
  if (!leafKeys.length) return new Set<Key>();

  const activeLeafKeys = collectCoveredLeafKeys(
    columnsState,
    payload.activeKeys,
  );
  const overLeafKeys = collectCoveredLeafKeys(columnsState, payload.overKeys);
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
  updateDraftState,
  updateMotionKeys,
}: UseSortablePreviewProps<T>) => {
  const getBaseStateRef = useRef(getBaseState);
  const updateDraftStateRef = useRef(updateDraftState);
  const updateMotionKeysRef = useRef(updateMotionKeys);
  const draftStateRef = useRef<InternalColumnState<T>[] | null>(null);
  const draftChangedRef = useRef(false);
  const previewFrameRef = useRef<number | null>(null);
  const previewPayloadRef = useRef<SortablePreviewPayload<T> | null>(null);
  const previewSignatureRef = useRef<string | null>(null);
  const currentMotionKeysRef = useRef<Set<Key>>(new Set());
  const retainedMotionKeysRef = useRef<Set<Key>>(new Set());
  const motionReleaseTimersRef = useRef(
    new Map<Key, ReturnType<typeof setTimeout>>(),
  );
  const motionTransitionDeadlineRef = useRef(0);

  getBaseStateRef.current = getBaseState;
  updateDraftStateRef.current = updateDraftState;
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
    const baseState = draftStateRef.current || getBaseStateRef.current();
    const nextKeys = getSortableMotionKeys(baseState, payload);

    applySortableMotionKeys(nextKeys);
  };

  const updatePreview = (payload: SortablePreviewPayload<T>) => {
    const baseState = draftStateRef.current || getBaseStateRef.current();
    const { placement, signature } = getPreviewSignature(payload);

    if (previewSignatureRef.current === signature) {
      return true;
    }

    // sortableDraftState 仍驱动真实列结构预览，但通过 RAF 合并更新，
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
      draftChangedRef.current = true;
      draftStateRef.current = nextState as InternalColumnState<T>[];
      previewSignatureRef.current = signature;
      markMotionTransition();
      updateDraftStateRef.current(nextState as InternalColumnState<T>[]);
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
    draftStateRef.current = getBaseStateRef.current();
    draftChangedRef.current = false;
    previewSignatureRef.current = null;
    resetSortableMotionKeys();
  };

  const cleanup = (clearDraft = true) => {
    cancel();
    draftStateRef.current = null;
    draftChangedRef.current = false;
    previewSignatureRef.current = null;
    resetSortableMotionKeys();
    if (clearDraft) {
      updateDraftStateRef.current(null);
    }
  };

  const rollback = () => {
    cancel();
    if (draftChangedRef.current) {
      // cancel 时先让 preview layout 回到真实列结构，但暂时保留 motionKeys；
      // HeadRow 会在动画结束后再真正关闭 sortingColumns 和清空 motionKeys。
      markMotionTransition();
      updateDraftStateRef.current(null);
    }

    draftStateRef.current = null;
    draftChangedRef.current = false;
    previewSignatureRef.current = null;
  };

  const getMotionFinishDelay = () => {
    const motionRunning =
      motionTransitionDeadlineRef.current > Date.now() ||
      motionReleaseTimersRef.current.size > 0;

    return motionRunning ? COLUMNS_SORT_MOTION_DURATION : 0;
  };

  const getDraftState = () => draftStateRef.current;
  const hasDraftChanged = () => draftChangedRef.current;

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
    getDraftState,
    getMotionFinishDelay,
    hasDraftChanged,
    rollback,
    schedule,
    start,
  };
};

export default useSortablePreview;
