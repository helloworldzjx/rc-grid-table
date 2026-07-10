export { theme } from 'antd';
export {
  ConfigConsumer,
  ConfigContext,
  default as ConfigProvider,
  defaultRootPrefixCls,
  useConfig,
} from './configProvider';
export type { ConfigProviderProps, GridTableConfig } from './configProvider';
export {
  default as Table,
  useTableDataContext,
  useTableLayoutContext,
  useTablePrefixClsContext,
} from './table';
export type { TableProps, TableRef } from './table';
export type { TableComponentToken } from './table/design';
export { defaultTablePrefixCls } from './table/utils/prefixCls';
