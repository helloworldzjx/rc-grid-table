import React, {
  createContext,
  Dispatch,
  Key,
  ReactNode,
  SetStateAction,
  useContext,
} from 'react';

import type {
  ColumnSortableContextProps,
  ColumnSortActiveStatus,
  InternalColumnState,
} from '../internalInterface';

const noop = () => {};
const emptyMotionKeys = new Set<Key>();
const emptyActiveStatus: ColumnSortActiveStatus = {
  keys: new Set<Key>(),
  fixed: false,
};
const emptyHotKeys = new Set<Key>();

interface ColumnSortableConfigContextProps {
  sortableColumns?: boolean;
}

interface ColumnSortablePreviewingContextProps {
  sortablePreviewing: boolean;
}

interface ColumnSortableActiveContextProps {
  activeStatus: ColumnSortActiveStatus;
  updateActiveStatus: Dispatch<SetStateAction<ColumnSortActiveStatus>>;
  hotKeys: ReadonlySet<Key>;
  updateHotKeys: Dispatch<SetStateAction<Set<Key>>>;
}

const ColumnSortableContext = createContext<ColumnSortableContextProps>({
  sortablePreviewing: false,
  updateSortablePreviewState: noop as Dispatch<
    SetStateAction<InternalColumnState[] | null>
  >,
  getSortableBaseState: () => [],
  updateSortableColumnsState: noop,
  sortingColumns: false,
  updateSortingColumns: noop as Dispatch<SetStateAction<boolean>>,
  activeStatus: emptyActiveStatus,
  updateActiveStatus: noop as Dispatch<SetStateAction<ColumnSortActiveStatus>>,
  sortableMotionKeys: emptyMotionKeys,
  updateSortableMotionKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
  sortableMotionVersion: 0,
  hotKeys: emptyHotKeys,
  updateHotKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
});

const ColumnSortableConfigContext =
  createContext<ColumnSortableConfigContextProps>({});

const ColumnSortablePreviewingContext =
  createContext<ColumnSortablePreviewingContextProps>({
    sortablePreviewing: false,
  });

const ColumnSortableActiveContext =
  createContext<ColumnSortableActiveContextProps>({
    activeStatus: emptyActiveStatus,
    updateActiveStatus: noop as Dispatch<
      SetStateAction<ColumnSortActiveStatus>
    >,
    hotKeys: emptyHotKeys,
    updateHotKeys: noop as Dispatch<SetStateAction<Set<Key>>>,
  });

const useColumnSortableContext = <T = any,>() =>
  useContext(ColumnSortableContext) as ColumnSortableContextProps<T>;

const useColumnSortableConfigContext = () =>
  useContext(ColumnSortableConfigContext);

const useColumnSortablePreviewingContext = () =>
  useContext(ColumnSortablePreviewingContext);

const useColumnSortableActiveContext = () =>
  useContext(ColumnSortableActiveContext);

const ColumnSortableSplitProvider = ({
  activeValue,
  children,
  configValue,
  previewingValue,
}: {
  activeValue: ColumnSortableActiveContextProps;
  children?: ReactNode;
  configValue: ColumnSortableConfigContextProps;
  previewingValue: ColumnSortablePreviewingContextProps;
}) => (
  <ColumnSortableConfigContext.Provider value={configValue}>
    <ColumnSortablePreviewingContext.Provider value={previewingValue}>
      <ColumnSortableActiveContext.Provider value={activeValue}>
        {children}
      </ColumnSortableActiveContext.Provider>
    </ColumnSortablePreviewingContext.Provider>
  </ColumnSortableConfigContext.Provider>
);

export {
  ColumnSortableSplitProvider,
  useColumnSortableActiveContext,
  useColumnSortableConfigContext,
  useColumnSortableContext,
  useColumnSortablePreviewingContext,
};

export default ColumnSortableContext;
