import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import type { ColumnSortableContextProps, ColumnState } from './interface';

const noop = () => {};

const ColumnSortableContext = createContext<ColumnSortableContextProps>({
  updateSortableDraftState: noop as Dispatch<
    SetStateAction<ColumnState[] | null>
  >,
  getSortableBaseState: () => [],
  updateSortableColumnsState: noop,
  sortingColumns: false,
  updateSortingColumns: noop as Dispatch<SetStateAction<boolean>>,
});

const useColumnSortableContext = <T = any,>() =>
  useContext(ColumnSortableContext) as ColumnSortableContextProps<T>;

export { useColumnSortableContext };

export default ColumnSortableContext;
