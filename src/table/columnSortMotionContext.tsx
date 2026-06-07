import { createContext, useContext } from 'react';

const ColumnSortMotionContext = createContext(false);

const useColumnSortMotionContext = () => useContext(ColumnSortMotionContext);

export { ColumnSortMotionContext, useColumnSortMotionContext };

export default ColumnSortMotionContext;
