import { createContext, Key, useContext } from 'react';

export interface ColumnSortMotionContextProps {
  sortingColumns: boolean;
  sortableMotionKeys: ReadonlySet<Key>;
  sortableMotionVersion: number;
}

const emptyMotionKeys = new Set<Key>();

export const defaultColumnSortMotionContext: ColumnSortMotionContextProps = {
  sortingColumns: false,
  sortableMotionKeys: emptyMotionKeys,
  sortableMotionVersion: 0,
};

const ColumnSortMotionContext = createContext<ColumnSortMotionContextProps>(
  defaultColumnSortMotionContext,
);

const useColumnSortMotionContext = () => useContext(ColumnSortMotionContext);

export { ColumnSortMotionContext, useColumnSortMotionContext };

export default ColumnSortMotionContext;
