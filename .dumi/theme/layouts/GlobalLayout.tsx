import { App } from 'antd';
import { useOutlet, usePrefersColor } from 'dumi';
import { ConfigProvider, theme } from 'rc-grid-table';
import React, { useMemo } from 'react';

const GlobalLayout: React.FC = () => {
  const outlet = useOutlet();

  const [_, prefers] = usePrefersColor();

  const algorithm = useMemo(
    () => (prefers === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm),
    [prefers],
  );

  return (
    <ConfigProvider theme={{ algorithm }}>
      <App>{outlet}</App>
    </ConfigProvider>
  );
};

export default GlobalLayout;
