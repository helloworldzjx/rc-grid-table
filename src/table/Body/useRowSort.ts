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
import type { ColumnState } from '../interface';
import { useRowSortableContext } from '../rowSortableContext';
import { isRowSortColumn } from '../utils/const';

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
  rowRef?: Ref<HTMLDivElement>;
  rowStyle?: CSSProperties;
  cellStyle?: CSSProperties;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  getNodeRef: (column: ColumnState) => RowSortNodeRef | undefined;
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
    },
  });

  const transformStyle = rowSortOverlay
    ? undefined
    : CSS.Translate.toString(transform);
  const active = rowSortDragging || isDragging;
  const sorting = !rowSortOverlay && (isSorting || rowSortDragging);
  const disabled = sortableDisabled || rowSortDragDisabled;

  const cellStyle = useMemo<CSSProperties | undefined>(() => {
    if (!sorting || virtual) {
      return undefined;
    }

    return {
      transform: 'inherit',
      transition: 'inherit',
      ...(active
        ? {
            opacity: 0,
            pointerEvents: 'none',
          }
        : null),
    };
  }, [active, sorting, virtual]);

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
    const activeStyle: CSSProperties | null = active
      ? {
          opacity: rowSortOverlay || !virtual ? undefined : 0,
          pointerEvents: 'none',
        }
      : null;

    if (!transformStyle && !transition && !activeStyle) {
      return style;
    }

    return {
      ...style,
      ...activeStyle,
      transform: transformStyle,
      transition,
    };
  }, [active, rowSortOverlay, style, transformStyle, transition, virtual]);

  const getNodeRef = useCallback(
    (column: ColumnState) =>
      !rowSortOverlay && !virtual && isRowSortColumn(column)
        ? setNodeRef
        : undefined,
    [rowSortOverlay, setNodeRef, virtual],
  );

  return {
    active,
    isOver,
    rowRef: mergedRowRef,
    rowStyle,
    cellStyle,
    attributes: rowSortOverlay ? undefined : attributes,
    listeners: disabled || rowSortOverlay ? undefined : listeners,
    setActivatorNodeRef: rowSortOverlay ? undefined : setActivatorNodeRef,
    getNodeRef,
  };
}
