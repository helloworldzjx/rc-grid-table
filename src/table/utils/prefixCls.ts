import { defaultRootPrefixCls, getPrefixCls } from '../../_utils/prefixCls';

const defaultComponentPrefixCls = 'grid-table';

export const defaultTablePrefixCls = getPrefixCls(
  defaultRootPrefixCls,
  defaultComponentPrefixCls,
);

export const getTablePrefixCls = (
  rootPrefixCls: string,
  customizePrefixCls?: string,
) => getPrefixCls(rootPrefixCls, defaultComponentPrefixCls, customizePrefixCls);

export { getPrefixCls };
