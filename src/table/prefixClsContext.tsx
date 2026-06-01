import { createContext, useContext } from 'react';

const PrefixClsContext = createContext('rc-grid-table');

const usePrefixClsContext = () => useContext(PrefixClsContext);

export { usePrefixClsContext };

export default PrefixClsContext;
