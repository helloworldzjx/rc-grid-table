import React, { Dispatch, Key, SetStateAction, useEffect, useRef } from 'react';

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
}

const startTransition =
  typeof React.startTransition === 'function'
    ? React.startTransition
    : (callback: () => void) => callback();

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

const useSortablePreview = <T>({
  getBaseState,
  updateDraftState,
}: UseSortablePreviewProps<T>) => {
  const getBaseStateRef = useRef(getBaseState);
  const updateDraftStateRef = useRef(updateDraftState);
  const draftStateRef = useRef<ColumnState<T>[] | null>(null);
  const draftChangedRef = useRef(false);
  const previewFrameRef = useRef<number | null>(null);
  const previewPayloadRef = useRef<SortablePreviewPayload<T> | null>(null);
  const previewSignatureRef = useRef<string | null>(null);

  getBaseStateRef.current = getBaseState;
  updateDraftStateRef.current = updateDraftState;

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
      startTransition(() => {
        updateDraftStateRef.current(nextState as ColumnState<T>[]);
      });
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

    if (previewFrameRef.current !== null) return true;

    previewFrameRef.current = raf(flush);
    return true;
  };

  const start = () => {
    cancel();
    draftStateRef.current = getBaseStateRef.current();
    draftChangedRef.current = false;
    previewSignatureRef.current = null;
  };

  const cleanup = (clearDraft = true) => {
    cancel();
    draftStateRef.current = null;
    draftChangedRef.current = false;
    previewSignatureRef.current = null;
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
