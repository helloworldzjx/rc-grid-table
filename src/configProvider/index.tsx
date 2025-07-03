import React, { FC, PropsWithChildren, useEffect, useMemo, useState } from "react"
import { createTheme } from "@ant-design/cssinjs";

import { DesignTokenProvider, LightThemeContext, DarkThemeContext, darkDerivative, lightDerivative } from "../theme"
import { ConfigProviderProps } from "./interface";

const ConfigProvider: FC<PropsWithChildren<ConfigProviderProps>> = ({
  themeMode,
  cssVar,
  children,
}) => {
  const [isDark, setIsDark] = useState(matchMedia('(prefers-color-scheme: dark)').matches);

  const mergedIsDark = useMemo(() => {
    return themeMode === 'system' ? isDark : themeMode === 'dark'
  }, [themeMode, isDark])

  const ThemeContext = useMemo(() => {
    return mergedIsDark ? DarkThemeContext : LightThemeContext
  }, [mergedIsDark])

  const themeDerivative = useMemo(() => {
    return mergedIsDark ? darkDerivative : lightDerivative
  }, [mergedIsDark])

  const mergedCssVar = useMemo(() => {
    if(cssVar) {
      return {
        prefix: 'rc',
        key: 'css-var-root',
        ...typeof cssVar !== 'boolean' && cssVar
      }
    }

    return
  }, [cssVar])

  useEffect(() => {
    const mediaQuery = matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches)
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler)
    };
  }, []);

  return (
    <DesignTokenProvider 
      hashed
      isDark={mergedIsDark}
      cssVar={mergedCssVar}
    >
      <ThemeContext.Provider value={createTheme(themeDerivative)}>
        {children}
      </ThemeContext.Provider>
    </DesignTokenProvider>
  )
}

export default ConfigProvider