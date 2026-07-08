import { createContext, Key, useContext } from 'react';

export interface ColumnSortMotionContextProps {
  sortingColumns: boolean;
  sortableMotionKeys: ReadonlySet<Key>;
  sortableMotionVersion: number;
}

const emptyMotionKeys = new Set<Key>();

// 列排序 motion 的轻量状态：只描述当前需要 layout 测量的叶子列区间。
export const defaultColumnSortMotionContext: ColumnSortMotionContextProps = {
  sortingColumns: false,
  sortableMotionKeys: emptyMotionKeys,
  sortableMotionVersion: 0,
};

const ColumnSortMotionContext = createContext<ColumnSortMotionContextProps>(
  defaultColumnSortMotionContext,
);
const ColumnSortingContext = createContext(false);

const useColumnSortMotionContext = () => useContext(ColumnSortMotionContext);
const useColumnSortingContext = () => useContext(ColumnSortingContext);

export {
  ColumnSortingContext,
  ColumnSortMotionContext,
  useColumnSortingContext,
  useColumnSortMotionContext,
};

export default ColumnSortMotionContext;
