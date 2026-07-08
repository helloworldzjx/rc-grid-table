import {
  createContext,
  Dispatch,
  Key,
  SetStateAction,
  useContext,
} from 'react';

import type {
  ColumnSortableContextProps,
  ColumnSortActiveStatus,
  InternalColumnState,
} from '../internalInterface';

const noop = () => {};
const emptyMotionKeys = new Set<Key>();
const emptyActiveStatus: ColumnSortActiveStatus = {
  keys: new Set<Key>(),
  fixed: false,
};
const emptyHotKeys = new Set<Key>();

const ColumnSortableContext = createContext<ColumnSortableContextProps>({
  sortablePreviewing: false,
  updateSortablePreviewState: noop as Dispatch<
    SetStateAction<InternalColumnState[] | null>
  >,
  getSortableBaseState: () => [],
  updateSortableColumnsState: noop,
  sortingColumns: false,
  updateSortingColumns: noop as Dispatch<SetStateAction<boolean>>,
  activeStatus: emptyActiveStatus,
  updateActiveStatus: noop as Dispatch<SetStateAction<ColumnSortActiveStatus>>,
  sortableMotionKeys: emptyMotionKeys,
  updateSortableMotionKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
  sortableMotionVersion: 0,
  hotKeys: emptyHotKeys,
  updateHotKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
});

const useColumnSortableContext = <T = any,>() =>
  useContext(ColumnSortableContext) as ColumnSortableContextProps<T>;

export { useColumnSortableContext };

export default ColumnSortableContext;
