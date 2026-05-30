import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

interface SortingColumnsContextProps {
  sortingColumns: boolean;
  updateSortingColumns: Dispatch<SetStateAction<boolean>>;
}

const SortingColumnsContext = createContext<SortingColumnsContextProps>({
  sortingColumns: false,
  updateSortingColumns: () => {},
});

export const SortingColumnsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [sortingColumns, setSortingColumns] = useState(false);

  const value = useMemo(
    () => ({
      sortingColumns,
      updateSortingColumns: setSortingColumns,
    }),
    [sortingColumns],
  );

  return (
    <SortingColumnsContext.Provider value={value}>
      {children}
    </SortingColumnsContext.Provider>
  );
};

export const useSortingColumnsContext = () => {
  return useContext(SortingColumnsContext);
};
