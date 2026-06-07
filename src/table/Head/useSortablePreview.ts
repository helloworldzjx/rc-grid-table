import { Dispatch, Key, SetStateAction, useEffect, useRef } from 'react';

import { cancelRaf, raf } from '../../_utils/raf';
import { ColumnState } from '../interface';
import { reorderColumnsState, SortablePlacement } from '../utils/sortable';

export type SortablePreviewPayload<T = any> = {
  activeIndex: number;
  overIndex: number;
  activeColumn: ColumnState<T>;
  overColumn: ColumnState<T>;
  activeKeys: Key[];
  overKeys: Key[];
};

interface UseSortablePreviewProps<T = any> {
  getBaseState: () => ColumnState<T>[];
  updateDraftState: Dispatch<SetStateAction<ColumnState<T>[] | null>>;
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

const collectLeafKeys = <T>(columns: ColumnState<T>[]) => {
  const keys: Key[] = [];

  const traverse = (cols: ColumnState<T>[]) => {
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
  columns: ColumnState<T>[],
  targetKeys: Key[],
) => {
  const targetKeySet = new Set(targetKeys);
  const keys: Key[] = [];

  const pushLeafKeys = (column: ColumnState<T>) => {
    if (column.children?.length) {
      [...column.children]
        .sort((a, b) => a.order - b.order)
        .forEach((child) => pushLeafKeys(child));
      return;
    }

    keys.push(column.key);
  };

  const traverse = (cols: ColumnState<T>[]) => {
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
  columnsState: ColumnState<T>[],
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
  const draftStateRef = useRef<ColumnState<T>[] | null>(null);
  const draftChangedRef = useRef(false);
  const previewFrameRef = useRef<number | null>(null);
  const previewPayloadRef = useRef<SortablePreviewPayload<T> | null>(null);
  const previewSignatureRef = useRef<string | null>(null);

  getBaseStateRef.current = getBaseState;
  updateDraftStateRef.current = updateDraftState;
  updateMotionKeysRef.current = updateMotionKeys;

  const updateSortableMotionKeys = (payload: SortablePreviewPayload<T>) => {
    const baseState = draftStateRef.current || getBaseStateRef.current();
    const nextKeys = getSortableMotionKeys(baseState, payload);

    updateMotionKeysRef.current((prevKeys) =>
      areKeySetsEqual(prevKeys, nextKeys) ? prevKeys : nextKeys,
    );
  };

  const updatePreview = (payload: SortablePreviewPayload<T>) => {
    const baseState = draftStateRef.current || getBaseStateRef.current();
    const { placement, signature } = getPreviewSignature(payload);

    if (previewSignatureRef.current === signature) {
      return true;
    }

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
      draftStateRef.current = nextState as ColumnState<T>[];
      previewSignatureRef.current = signature;
      updateDraftStateRef.current(nextState as ColumnState<T>[]);
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
    updateMotionKeysRef.current(new Set<Key>());
  };

  const cleanup = (clearDraft = true) => {
    cancel();
    draftStateRef.current = null;
    draftChangedRef.current = false;
    previewSignatureRef.current = null;
    updateMotionKeysRef.current(new Set<Key>());
    if (clearDraft) {
      updateDraftStateRef.current(null);
    }
  };

  const getDraftState = () => draftStateRef.current;
  const hasDraftChanged = () => draftChangedRef.current;

  useEffect(() => {
    return () => {
      cancel();
    };
  }, []);

  return {
    cancel,
    cleanup,
    flush,
    getDraftState,
    hasDraftChanged,
    schedule,
    start,
  };
};

export default useSortablePreview;
