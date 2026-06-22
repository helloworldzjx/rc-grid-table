import { createContext, useContext } from 'react';

import { defaultPrefixCls } from '../../configProvider/context';

const PrefixClsContext = createContext(defaultPrefixCls);

const usePrefixClsContext = () => useContext(PrefixClsContext);

export { usePrefixClsContext };

export default PrefixClsContext;
