import { createContext, useContext } from 'react';

import { type DataSortContextProps } from '../internalInterface';

const DataSortContext = createContext<DataSortContextProps>(
  {} as DataSortContextProps,
);

const useDataSortContext = () => useContext(DataSortContext);

export { useDataSortContext };

export default DataSortContext;
