import { createContext, useContext } from 'react';

import { type ExpandableContextProps } from './interface';

const ExpandableContext = createContext<ExpandableContextProps>({
  mergedExpandedRowKeys: [],
});

const useExpandableContext = <T = any,>() =>
  useContext(ExpandableContext) as ExpandableContextProps<T>;

export { useExpandableContext };

export default ExpandableContext;
