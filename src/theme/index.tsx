import type { Theme } from '@ant-design/cssinjs';
import { createTheme } from '@ant-design/cssinjs';
import { TinyColor } from '@ctrl/tinycolor';
import React, { createContext, FC, PropsWithChildren } from 'react';

import useInternalToken from './hooks/useToken';
import {
  DerivativeToken,
  DesignToken,
  DesignTokenContextPorps,
} from './interface';

export const defaultDesignToken: DesignToken = {
  lineHeightBase: 1.5,
  fontSizeBase: 14,
  colorTextBase: '#000',
  colorBgBase: '#fff',

  colorPrimary: '#1890ff',

  borderRadius: 8,
  borderWidth: 1,
};

const defaultDerivativeToken = {
  fontSize: 14,
  lineHeight: 1.5,
  colorTextLightSolid: '#fff',
} as DerivativeToken;

// 亮色
export function lightDerivative(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    ...defaultDerivativeToken,
    colorText: new TinyColor(designToken.colorTextBase)
      .lighten(15)
      .toRgbString(),
    primaryColorHover: new TinyColor(designToken.colorPrimary)
      .lighten(40)
      .toRgbString(),
    primaryColorDisabled: new TinyColor(designToken.colorPrimary)
      .desaturate(100)
      .setAlpha(0.7)
      .toRgbString(),
    colorBgContainer: '#fff',
    colorBgLayout: new TinyColor(designToken.colorBgBase)
      .darken(3)
      .toRgbString(),
    colorBorder: new TinyColor(designToken.colorBgBase)
      .darken(13)
      .toRgbString(),
  };
}

// 暗色
export function darkDerivative(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    ...defaultDerivativeToken,
    colorText: new TinyColor(designToken.colorTextBase)
      .lighten(92)
      .toRgbString(),
    primaryColorHover: new TinyColor(designToken.colorPrimary)
      .setAlpha(0.7)
      .toRgbString(),
    primaryColorDisabled: new TinyColor(designToken.colorPrimary)
      .desaturate(100)
      .setAlpha(0.7)
      .toRgbString(),
    colorBgContainer: new TinyColor(designToken.colorBgBase)
      .darken(84)
      .toRgbString(),
    colorBgLayout: new TinyColor(designToken.colorBgBase)
      .darken(88)
      .toRgbString(),
    colorBorder: new TinyColor(designToken.colorBgBase)
      .darken(76)
      .toRgbString(),
  };
}

export const LightThemeContext = createContext<
  Theme<DesignToken, DerivativeToken>
>(createTheme(lightDerivative));
export const DarkThemeContext = createContext<
  Theme<DesignToken, DerivativeToken>
>(createTheme(darkDerivative));

export const DesignTokenContext = createContext<DesignTokenContextPorps>({
  token: defaultDesignToken,
  isDark: false,
});

export const DesignTokenProvider: FC<
  PropsWithChildren<DesignTokenContextPorps>
> = ({ children, ...rest }) => {
  return (
    <DesignTokenContext.Provider value={rest}>
      {children}
    </DesignTokenContext.Provider>
  );
};

function useToken() {
  const [theme, token, hashId, , isDark] = useInternalToken();

  return { theme, token, hashId, isDark };
}

export type { DerivativeToken, DesignToken };

export default {
  LightThemeContext,
  DarkThemeContext,
  DesignTokenProvider,
  useToken,
};
