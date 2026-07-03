import type { Data } from '@dnd-kit/core';
import type { SortableData } from '@dnd-kit/sortable';
import type { Key } from 'react';

import { isObject, isValidKey } from '../../_utils/validate';
import type { InternalColumnState } from '../internalInterface';

export type ResizableColumnsData = Data<{
  type: 'resizableColumns';
}>;

export type SortableColumnType<T = any> = Pick<
  InternalColumnState<T>,
  'key' | 'parentKey' | 'order' | 'hasChildren'
> &
  Pick<
    Partial<InternalColumnState<T>>,
    'colSpan' | 'fixed' | 'dragSortDisabled'
  >;

export type SortableColumnsData<T = any> = Data<
  {
    type: 'sortableColumns';
    column: SortableColumnType<T>;
    sortKeys: Key[];
  } & Partial<SortableData>
>;

export type RowSortableData<T = any> = Data<{
  type: 'rowSortable';
  key?: Key;
  record?: T;
  index?: number;
}>;

export const isResizableColumnsData = (
  data: unknown,
): data is ResizableColumnsData =>
  isObject(data) && data.type === 'resizableColumns';

export const isSortableColumnsData = <T = any>(
  data: unknown,
): data is SortableColumnsData<T> =>
  isObject(data) &&
  data.type === 'sortableColumns' &&
  isObject(data.column) &&
  isValidKey(data.column.key) &&
  isValidKey(data.column.parentKey) &&
  Array.isArray(data.sortKeys) &&
  data.sortKeys.every(isValidKey);

export const isRowSortableData = <T = any>(
  data: unknown,
): data is RowSortableData<T> => isObject(data) && data.type === 'rowSortable';

export const dispatchDndPopupCloseEvent = (activatorEvent?: Event | null) => {
  if (typeof window === 'undefined') return;

  const target = activatorEvent?.target as
    | (EventTarget & { ownerDocument?: Document })
    | null
    | undefined;
  const ownerDocument =
    target?.ownerDocument ??
    (typeof document !== 'undefined' ? document : undefined);
  const eventWindow = ownerDocument?.defaultView ?? window;
  const eventTarget = ownerDocument?.documentElement ?? ownerDocument?.body;

  if (!eventTarget) return;

  eventTarget.dispatchEvent(
    new eventWindow.MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: eventWindow,
    }),
  );
};
