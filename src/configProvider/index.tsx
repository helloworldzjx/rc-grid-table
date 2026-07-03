import { ConfigProvider as AntdConfigProvider } from 'antd';
import type { ConfigProviderProps as AntdConfigProviderProps } from 'antd/es/config-provider';
import React, { FC, useMemo } from 'react';

import {
  ConfigContext,
  defaultRootPrefixCls,
  type GridTableConfig,
  useConfig,
} from './context';

export {
  ConfigConsumer,
  ConfigContext,
  defaultRootPrefixCls,
  useConfig,
} from './context';
export type { GridTableConfig } from './context';

export interface ConfigProviderProps extends AntdConfigProviderProps {
  /**
   * @description rc-grid-table defaults and component tokens
   */
  gridTable?: GridTableConfig;
}

const mergeGridTableConfig = (
  parentConfig?: GridTableConfig,
  currentConfig?: GridTableConfig,
): GridTableConfig | undefined => {
  if (!parentConfig && !currentConfig) {
    return undefined;
  }

  return {
    ...parentConfig,
    ...currentConfig,
    expandable:
      parentConfig?.expandable || currentConfig?.expandable
        ? {
            ...parentConfig?.expandable,
            ...currentConfig?.expandable,
          }
        : undefined,
    token:
      parentConfig?.token || currentConfig?.token
        ? {
            ...parentConfig?.token,
            ...currentConfig?.token,
          }
        : undefined,
  };
};

const ConfigProvider: FC<ConfigProviderProps> = ({
  prefixCls,
  gridTable,
  children,
  ...antdConfig
}) => {
  const parentConfig = useConfig();

  const mergedRootPrefixCls =
    prefixCls ?? parentConfig.rootPrefixCls ?? defaultRootPrefixCls;

  const mergedGridTable = useMemo(
    () => mergeGridTableConfig(parentConfig.gridTable, gridTable),
    [parentConfig.gridTable, gridTable],
  );

  const configContextValue = useMemo(
    () => ({
      rootPrefixCls: mergedRootPrefixCls,
      gridTable: mergedGridTable,
    }),
    [mergedGridTable, mergedRootPrefixCls],
  );

  return (
    <ConfigContext.Provider value={configContextValue}>
      <AntdConfigProvider prefixCls={prefixCls} {...antdConfig}>
        {children}
      </AntdConfigProvider>
    </ConfigContext.Provider>
  );
};

export default ConfigProvider;
