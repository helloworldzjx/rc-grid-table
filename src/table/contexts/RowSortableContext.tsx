import { createContext, useContext } from 'react';

import { type RowSortableContextProps } from '../internalInterface';

const RowSortableContext = createContext<RowSortableContextProps>({});

const useRowSortableContext = <T = any,>() =>
  useContext(RowSortableContext) as RowSortableContextProps<T>;

export { useRowSortableContext };

export default RowSortableContext;
