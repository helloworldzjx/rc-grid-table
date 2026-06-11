import {
  createContext,
  Dispatch,
  Key,
  SetStateAction,
  useContext,
} from 'react';

import type { ColumnSortableContextProps, ColumnState } from '../interface';

const noop = () => {};
const emptyMotionKeys = new Set<Key>();
const emptySortableActiveKeys = new Set<Key>();
const emptySortableHotKeys = new Set<Key>();

const ColumnSortableContext = createContext<ColumnSortableContextProps>({
  updateSortableDraftState: noop as Dispatch<
    SetStateAction<ColumnState[] | null>
  >,
  getSortableBaseState: () => [],
  updateSortableColumnsState: noop,
  sortingColumns: false,
  updateSortingColumns: noop as Dispatch<SetStateAction<boolean>>,
  sortableMotionKeys: emptyMotionKeys,
  updateSortableMotionKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
  sortableMotionVersion: 0,
  sortableActiveKeys: emptySortableActiveKeys,
  updateSortableActiveKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
  sortableHotKeys: emptySortableHotKeys,
  updateSortableHotKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
});

const useColumnSortableContext = <T = any,>() =>
  useContext(ColumnSortableContext) as ColumnSortableContextProps<T>;

export { useColumnSortableContext };

export default ColumnSortableContext;
