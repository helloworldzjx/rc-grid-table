import { createTheme } from '@ant-design/cssinjs';
import React, {
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { ThemeConfig } from '../theme';
import { DesignTokenContext, darkAlgorithm, defaultAlgorithm } from '../theme';
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

const ConfigProvider: FC<PropsWithChildren<ConfigProviderProps>> = ({
  prefixCls,
  themeMode,
  theme,
  cssVar,
  table,
  children,
}) => {
  const parentConfig = useConfig();
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
        {children}
      </DesignTokenContext.Provider>
    </ConfigContext.Provider>
  );
};

export default ConfigProvider;
