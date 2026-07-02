import { createContext, useContext } from 'react';

import { defaultRootPrefixCls } from '../_utils/prefixCls';
import type { TableEmpty, TableLoading } from '../table/interface';

export { defaultRootPrefixCls };

export interface TableConfig {
  loading?: TableLoading;
  empty?: TableEmpty;
}

export interface ConfigContextProps {
  rootPrefixCls: string;
  table?: TableConfig;
}

export const ConfigContext = createContext<ConfigContextProps>({
  rootPrefixCls: defaultRootPrefixCls,
});

export const ConfigConsumer = ConfigContext.Consumer;

export const useConfig = () => useContext(ConfigContext);
