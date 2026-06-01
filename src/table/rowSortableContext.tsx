import { createContext, useContext } from 'react';

import { type RowSortableContextProps } from './interface';

const RowSortableContext = createContext<RowSortableContextProps>({});

const useRowSortableContext = <T = any,>() =>
  useContext(RowSortableContext) as RowSortableContextProps<T>;

export { useRowSortableContext };

export default RowSortableContext;
