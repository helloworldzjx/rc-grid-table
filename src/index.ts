export {
  ConfigConsumer,
  ConfigContext,
  default as ConfigProvider,
  defaultRootPrefixCls,
  useConfig,
} from './configProvider';
export type { ConfigProviderProps, TableConfig } from './configProvider';
export { default as Table } from './table';
export type { TableProps, TableRef } from './table';
export type { TableComponentToken } from './table/design';
export { defaultTablePrefixCls } from './table/utils/prefixCls';
export { default as Theme } from './theme';
