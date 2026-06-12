import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { composeRef } from '@rc-component/util/lib/ref';
import type { CSSProperties, Key, Ref } from 'react';
import { useCallback, useMemo } from 'react';

import { isValidKey } from '../../_utils/validate';
import { useRowSortableContext } from '../contexts/RowSortableContext';
import type { InternalColumnState } from '../interface';
import { isRowSortColumn } from '../utils/const';
import type { RowSortableData } from '../utils/dnd';

interface UseRowSortProps<T = any> {
  rowData: T;
  rowIndex: number;
  rowKeyValue?: Key;
  rowRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  virtual: boolean;
  rowSortDragDisabled: boolean;
  rowSortDropDisabled: boolean;
  rowSortDragging: boolean;
  rowSortOverlay: boolean;
}

type RowSortNodeRef = (element: HTMLElement | null) => void;

interface UseRowSortResult {
  active: boolean;
  isOver: boolean;
  first: boolean;
  last: boolean;
  rowRef?: Ref<HTMLDivElement>;
  rowStyle?: CSSProperties;
  cellStyle?: CSSProperties;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  getNodeRef: (column: InternalColumnState) => RowSortNodeRef | undefined;
}

const getSortableId = (
  rowKeyValue: Key | undefined,
  rowIndex: number,
  overlay: boolean,
) =>
  (overlay
    ? `row-sort-overlay-${isValidKey(rowKeyValue) ? rowKeyValue : rowIndex}`
    : isValidKey(rowKeyValue)
    ? rowKeyValue
    : `row-sort-${rowIndex}`) as UniqueIdentifier;

export default function useRowSort<T = any>({
  rowData,
  rowIndex,
  rowKeyValue,
  rowRef,
  style,
  virtual,
  rowSortDragDisabled,
  rowSortDropDisabled,
  rowSortDragging,
  rowSortOverlay,
}: UseRowSortProps<T>): UseRowSortResult {
  const { rowSortable } = useRowSortableContext();
  const sortableDisabled = !rowSortable || !isValidKey(rowKeyValue);
  const sortableId = getSortableId(rowKeyValue, rowIndex, rowSortOverlay);

  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    isOver,
    items,
    newIndex,
  } = useSortable({
    id: sortableId,
    disabled: {
      draggable: rowSortOverlay || sortableDisabled || rowSortDragDisabled,
      droppable: rowSortOverlay || sortableDisabled || rowSortDropDisabled,
    },
    attributes: {
      role: 'button',
      roleDescription: 'sortable row',
      tabIndex:
        rowSortOverlay || sortableDisabled || rowSortDragDisabled ? -1 : 0,
    },
    data: {
      type: 'rowSortable',
      key: rowKeyValue,
      record: rowData,
      index: rowIndex,
    } satisfies RowSortableData<T>,
  });

  const transformStyle = rowSortOverlay
    ? undefined
    : CSS.Translate.toString(transform);
  const active = rowSortDragging || isDragging;
  const sorting = !rowSortOverlay && (isSorting || rowSortDragging);
  const first = !rowSortOverlay && isSorting && newIndex === 0;
  const last = !rowSortOverlay && isSorting && newIndex === items.length - 1;
  const disabled = sortableDisabled || rowSortDragDisabled;

  const cellStyle = useMemo<CSSProperties | undefined>(() => {
    if (!sorting || virtual) {
      return undefined;
    }

    return {
      transform: 'inherit',
      transition: 'inherit',
    };
  }, [sorting, virtual]);

  const mergedRowRef = useMemo(
    () =>
      virtual && !rowSortOverlay
        ? composeRef<HTMLDivElement>(
            rowRef ?? null,
            setNodeRef as Ref<HTMLDivElement>,
          )
        : rowRef,
    [rowRef, rowSortOverlay, setNodeRef, virtual],
  );

  const rowStyle = useMemo<CSSProperties | undefined>(() => {
    if (!transformStyle && !transition) {
      return style;
    }

    return {
      ...style,
      transform: transformStyle,
      transition,
    };
  }, [style, transformStyle, transition]);

  const getNodeRef = useCallback(
    (column: InternalColumnState) =>
      !rowSortOverlay && !virtual && isRowSortColumn(column)
        ? setNodeRef
        : undefined,
    [rowSortOverlay, setNodeRef, virtual],
  );

  return {
    active,
    isOver,
    first,
    last,
    rowRef: mergedRowRef,
    rowStyle,
    cellStyle,
    attributes: rowSortOverlay ? undefined : attributes,
    listeners: disabled || rowSortOverlay ? undefined : listeners,
    setActivatorNodeRef: rowSortOverlay ? undefined : setActivatorNodeRef,
    getNodeRef,
  };
}
