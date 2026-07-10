import { createContext, useContext, type CSSProperties } from 'react';

import { defaultRootPrefixCls } from '../_utils/prefixCls';
import type { TableComponentToken } from '../table/design';
import type {
  ExpandableConfig,
  TableEmpty,
  TableLoading,
} from '../table/interface';

export { defaultRootPrefixCls };

export interface GridTableConfig {
  rootClassName?: string;
  className?: string;
  style?: CSSProperties;
  loading?: TableLoading;
  empty?: TableEmpty;
  expandable?: Pick<ExpandableConfig, 'expandIcon'>;
  token?: Partial<TableComponentToken>;
}

export interface ConfigContextProps {
  rootPrefixCls: string;
  gridTable?: GridTableConfig;
}

export const ConfigContext = createContext<ConfigContextProps>({
  rootPrefixCls: defaultRootPrefixCls,
});

export const ConfigConsumer = ConfigContext.Consumer;

export const useConfig = () => useContext(ConfigContext);
