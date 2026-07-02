import { createContext, useContext } from 'react';

import { defaultTablePrefixCls } from '../utils/prefixCls';

const PrefixClsContext = createContext(defaultTablePrefixCls);

const usePrefixClsContext = () => useContext(PrefixClsContext);

export { usePrefixClsContext };

export default PrefixClsContext;
