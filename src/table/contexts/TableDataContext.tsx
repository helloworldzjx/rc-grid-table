import { createContext, useContext } from 'react';

import { type TableDataContextProps } from '../internalInterface';

const TableDataContext = createContext<TableDataContextProps>(
  {} as TableDataContextProps,
);

const useTableDataContext = <T = any,>() =>
  useContext(TableDataContext) as TableDataContextProps<T>;

export { useTableDataContext };

export default TableDataContext;
