export const defaultRootPrefixCls = 'rc';

export const getPrefixCls = (
  rootPrefixCls: string,
  suffixCls: string,
  customizePrefixCls?: string,
) => customizePrefixCls ?? `${rootPrefixCls}-${suffixCls}`;
