import type { Theme } from '@ant-design/cssinjs';
import { createTheme } from '@ant-design/cssinjs';
import { TinyColor } from '@ctrl/tinycolor';
import React, { createContext, FC, PropsWithChildren } from 'react';

import useInternalToken from "./hooks/useToken"
import { DerivativeToken, DesignToken, DesignTokenContextPorps } from './interface';

export const defaultDesignToken: DesignToken = {
  primaryColor: '#1890ff',
  textColor: '#333333',

  componentBackgroundColor: '#FFFFFF',

  borderRadius: 8,
  borderColor: '#dddddd',
  borderWidth: 1,

  fontSize: 14,

  lineHeight: 1.5,
  lineHeightBase: 1.5,
};

// 亮色
export function lightDerivative(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    primaryColorHover: new TinyColor(designToken.primaryColor)
      .lighten(40)
      .toString(),
    primaryColorDisabled: new TinyColor(designToken.primaryColor)
      .desaturate(100)
      .setAlpha(0.7)
      .toString(),
  };
}

// 暗色
export function darkDerivative(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    primaryColorHover: new TinyColor(designToken.primaryColor)
      .setAlpha(0.7)
      .toString(),
    primaryColorDisabled: new TinyColor(designToken.primaryColor)
      .desaturate(100)
      .setAlpha(0.7)
      .toString(),
  };
}

export const LightThemeContext = createContext<Theme<DesignToken, DerivativeToken>>(createTheme(lightDerivative));
export const DarkThemeContext = createContext<Theme<DesignToken, DerivativeToken>>(createTheme(darkDerivative));

export const DesignTokenContext = createContext<DesignTokenContextPorps>({
  token: defaultDesignToken,
  isDark: false
});

export const DesignTokenProvider: FC<PropsWithChildren<DesignTokenContextPorps>> = ({ children, ...rest }) => {

  return (
    <DesignTokenContext.Provider value={rest}>
      {children}
    </DesignTokenContext.Provider>
  );
};

function useToken() {
  const [theme, token, hashId, _, isDark] = useInternalToken();

  return { theme, token, hashId, isDark };
}

export type {
  DerivativeToken, DesignToken
}

export default {
  LightThemeContext,
  DarkThemeContext,
  DesignTokenProvider,
  useToken,
};
