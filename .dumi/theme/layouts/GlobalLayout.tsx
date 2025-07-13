import { useOutlet, usePrefersColor } from 'dumi';
import { ConfigProvider, Theme } from 'rc-grid-table';
import { ConfigProviderProps } from 'rc-grid-table/es/configProvider/interface';
import React, { useMemo } from 'react';
import { ConfigProvider as AntdConfigProvider, App, theme } from "antd"

const GlobalLayout: React.FC = () => {
  const [_, prefers] = usePrefersColor();

  const themeMode: ConfigProviderProps['themeMode'] = useMemo(() => {
    return prefers === 'auto' ? 'system' : prefers === 'dark' ? 'dark' : 'light'
  }, [prefers])

  const AntdConfigProviderComponent = () => {
    const outlet = useOutlet();
    const { isDark } = Theme.useToken()

    return (
      <AntdConfigProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <App>
          {outlet}
        </App>
      </AntdConfigProvider>
    )
  }

  return (
    <ConfigProvider themeMode={themeMode}>
      <AntdConfigProviderComponent />
    </ConfigProvider>
  )
};

export default GlobalLayout