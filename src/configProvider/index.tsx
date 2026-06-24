import { createTheme } from '@ant-design/cssinjs';
import { ConfigProvider as AntdConfigProvider, theme as antdTheme } from 'antd';
import {
  ConfigContext as AntdConfigContext,
  type ThemeConfig as AntdThemeConfig,
} from 'antd/es/config-provider';
import React, {
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { DesignTokenContextProps, ThemeConfig } from '../theme';
import {
  DesignTokenContext,
  darkAlgorithm,
  defaultAlgorithm,
  defaultDesignToken,
} from '../theme';
import { ConfigContext, defaultPrefixCls, useConfig } from './context';
import { ConfigProviderProps } from './interface';

export {
  ConfigConsumer,
  ConfigContext,
  defaultPrefixCls,
  useConfig,
} from './context';
export type { TableConfig } from './context';
export type { ConfigProviderProps };

const canUseMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

const getSystemIsDark = () =>
  canUseMatchMedia()
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

const normalizeCssVar = (
  cssVar: ConfigProviderProps['cssVar'] | ThemeConfig['cssVar'],
) => {
  if (!cssVar) {
    return undefined;
  }

  return {
    prefix: 'rc',
    key: 'css-var-root',
    ...(typeof cssVar !== 'boolean' && cssVar),
  };
};

const normalizeAntdCssVar = (
  cssVar: DesignTokenContextProps['cssVar'],
): AntdThemeConfig['cssVar'] => {
  if (!cssVar) {
    return undefined;
  }

  return {
    ...cssVar,
    prefix: cssVar.prefix ?? 'ant',
  };
};

const ConfigProvider: FC<PropsWithChildren<ConfigProviderProps>> = ({
  prefixCls,
  themeMode,
  theme,
  cssVar,
  table,
  children,
}) => {
  const parentConfig = useConfig();
  const parentAntdConfig = useContext(AntdConfigContext);
  const parentTokenContext = useContext(DesignTokenContext);
  const [systemIsDark, setSystemIsDark] = useState(getSystemIsDark);

  const mergedPrefixCls =
    prefixCls ?? parentConfig.prefixCls ?? defaultPrefixCls;
  const mergedTable = useMemo(
    () => ({
      ...parentConfig.table,
      ...table,
    }),
    [parentConfig.table, table],
  );

  const mergedIsDark = useMemo(() => {
    if (themeMode === undefined) {
      return theme?.inherit === false ? false : parentTokenContext.isDark;
    }

    return themeMode === 'system' ? systemIsDark : themeMode === 'dark';
  }, [parentTokenContext.isDark, systemIsDark, theme?.inherit, themeMode]);

  const mergedTheme = useMemo(() => {
    if (
      theme?.algorithm === undefined &&
      themeMode === undefined &&
      theme?.inherit !== false &&
      parentTokenContext.theme
    ) {
      return parentTokenContext.theme;
    }

    return createTheme(
      theme?.algorithm ?? (mergedIsDark ? darkAlgorithm : defaultAlgorithm),
    );
  }, [
    mergedIsDark,
    parentTokenContext.theme,
    theme?.algorithm,
    theme?.inherit,
    themeMode,
  ]);

  const mergedToken = useMemo(() => {
    return {
      ...(theme?.inherit === false ? undefined : parentTokenContext?.token),
      ...theme?.token,
    };
  }, [parentTokenContext?.token, theme?.inherit, theme?.token]);

  const mergedComponents = useMemo(() => {
    if (theme?.inherit === false) {
      return theme.components;
    }

    return {
      ...parentTokenContext?.components,
      ...theme?.components,
      Table: {
        ...parentTokenContext?.components?.Table,
        ...theme?.components?.Table,
      },
    };
  }, [parentTokenContext?.components, theme?.components, theme?.inherit]);

  const mergedCssVar = useMemo(() => {
    if (cssVar !== undefined) {
      return normalizeCssVar(cssVar);
    }

    if (theme?.cssVar !== undefined) {
      return normalizeCssVar(theme.cssVar);
    }

    if (theme?.inherit === false) {
      return undefined;
    }

    return parentTokenContext?.cssVar;
  }, [cssVar, parentTokenContext?.cssVar, theme?.cssVar, theme?.inherit]);

  const mergedHashed =
    theme?.hashed ??
    (theme?.inherit === false ? true : parentTokenContext?.hashed ?? true);

  const mergedSeedToken = useMemo(
    () => ({
      ...defaultDesignToken,
      ...mergedToken,
    }),
    [mergedToken],
  );

  const configContextValue = useMemo(
    () => ({
      prefixCls: mergedPrefixCls,
      table: mergedTable,
    }),
    [mergedPrefixCls, mergedTable],
  );

  const designTokenContextValue = useMemo(
    () => ({
      hashed: mergedHashed,
      isDark: mergedIsDark,
      token: mergedToken,
      cssVar: mergedCssVar,
      theme: mergedTheme,
      components: mergedComponents,
    }),
    [
      mergedComponents,
      mergedCssVar,
      mergedHashed,
      mergedIsDark,
      mergedTheme,
      mergedToken,
    ],
  );

  const antdThemeConfig = useMemo<AntdThemeConfig>(
    () => ({
      algorithm: mergedIsDark
        ? antdTheme.darkAlgorithm
        : antdTheme.defaultAlgorithm,
      hashed: typeof mergedHashed === 'boolean' ? mergedHashed : true,
      cssVar: normalizeAntdCssVar(mergedCssVar),
      token: {
        colorPrimary: mergedSeedToken.colorPrimary,
        colorTextBase: mergedSeedToken.colorTextBase,
        colorBgBase: mergedSeedToken.colorBgBase,
        borderRadius: mergedSeedToken.borderRadius,
        lineWidth: mergedSeedToken.borderWidth,
        fontSize: mergedSeedToken.fontSizeBase,
        lineHeight: mergedSeedToken.lineHeightBase,
      },
    }),
    [mergedCssVar, mergedHashed, mergedIsDark, mergedSeedToken],
  );
  const shouldBridgeAntdTheme =
    theme !== undefined ||
    themeMode !== undefined ||
    cssVar !== undefined ||
    !parentAntdConfig.theme;

  useEffect(() => {
    if (themeMode !== 'system' || !canUseMatchMedia()) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [themeMode]);

  return (
    <ConfigContext.Provider value={configContextValue}>
      <DesignTokenContext.Provider value={designTokenContextValue}>
        {shouldBridgeAntdTheme ? (
          <AntdConfigProvider theme={antdThemeConfig}>
            {children}
          </AntdConfigProvider>
        ) : (
          children
        )}
      </DesignTokenContext.Provider>
    </ConfigContext.Provider>
  );
};

export default ConfigProvider;
