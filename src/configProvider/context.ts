import { createContext, useContext } from 'react';

import type { TableEmpty, TableLoading } from '../table/interface';

export const defaultPrefixCls = 'rc-grid-table';

export interface TableConfig {
  loading?: TableLoading;
  empty?: TableEmpty;
}

export interface ConfigContextProps {
  prefixCls: string;
  table?: TableConfig;
}

export const ConfigContext = createContext<ConfigContextProps>({
  prefixCls: defaultPrefixCls,
});

export const ConfigConsumer = ConfigContext.Consumer;

export const useConfig = () => useContext(ConfigContext);
