import { createContext, useContext } from 'react';

import { type TableLayoutContextProps } from '../internalInterface';

const TableLayoutContext = createContext<TableLayoutContextProps>(
  {} as TableLayoutContextProps,
);

const useTableLayoutContext = <T = any,>() =>
  useContext(TableLayoutContext) as TableLayoutContextProps<T>;

export { useTableLayoutContext };

export default TableLayoutContext;
