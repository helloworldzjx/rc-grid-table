import { useOutlet, usePrefersColor } from 'dumi';
import { ConfigProvider } from 'rc-grid-table';
import { ConfigProviderProps } from 'rc-grid-table/es/configProvider/interface';
import React from 'react';

const GlobalLayout: React.FC = () => {
  const outlet = useOutlet();
  const [_, prefers] = usePrefersColor();
  const themeMode: ConfigProviderProps['themeMode'] = prefers === 'auto' ? 'system' : prefers === 'dark' ? 'dark' : 'light'

  return (
    <ConfigProvider themeMode={themeMode}>{outlet}</ConfigProvider>
  )
};

export default GlobalLayout