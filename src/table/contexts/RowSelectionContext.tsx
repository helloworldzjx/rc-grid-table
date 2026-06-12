import { createContext, useContext } from 'react';

import { type RowSelectionContextProps } from '../internalInterface';

const RowSelectionContext = createContext<RowSelectionContextProps>({});

const useRowSelectionContext = <T = any,>() =>
  useContext(RowSelectionContext) as RowSelectionContextProps<T>;

export { useRowSelectionContext };

export default RowSelectionContext;
