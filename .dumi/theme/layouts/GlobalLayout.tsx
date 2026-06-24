import { App } from 'antd';
import { useOutlet, usePrefersColor } from 'dumi';
import { ConfigProvider } from 'rc-grid-table';
import { ConfigProviderProps } from 'rc-grid-table/es/configProvider/interface';
import React, { useMemo } from 'react';

const GlobalLayout: React.FC = () => {
  const outlet = useOutlet();

  const [_, prefers] = usePrefersColor();

  const themeMode: ConfigProviderProps['themeMode'] = useMemo(() => {
    return prefers === 'auto'
      ? 'system'
      : prefers === 'dark'
      ? 'dark'
      : 'light';
  }, [prefers]);

  return (
    <ConfigProvider themeMode={themeMode}>
      <App>{outlet}</App>
    </ConfigProvider>
  );
};

export default GlobalLayout;
