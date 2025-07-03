import { createContext, useContext } from 'react';

import { type TableContextProps } from './interface';

const TableContext = createContext<TableContextProps>({} as TableContextProps);

const useTableContext = () => useContext(TableContext);

export { useTableContext };

export default TableContext;
