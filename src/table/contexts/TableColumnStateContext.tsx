import { createContext, useContext } from 'react';

import { type TableColumnStateContextProps } from '../internalInterface';

const TableColumnStateContext = createContext<TableColumnStateContextProps>(
  {} as TableColumnStateContextProps,
);

const useTableColumnStateContext = <T = any,>() =>
  useContext(TableColumnStateContext) as TableColumnStateContextProps<T>;

export { useTableColumnStateContext };

export default TableColumnStateContext;
