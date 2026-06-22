import { createTheme } from '@ant-design/cssinjs';
import { TinyColor } from '@ctrl/tinycolor';
import { createContext } from 'react';

import useInternalToken from './hooks/useToken';
import {
  DerivativeToken,
  DesignToken,
  DesignTokenContextProps,
  ThemeConfig,
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

export function defaultAlgorithm(designToken: DesignToken): DerivativeToken {
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

export function darkAlgorithm(designToken: DesignToken): DerivativeToken {
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

const defaultTheme = createTheme(defaultAlgorithm);

export const DesignTokenContext = createContext<DesignTokenContextProps>({
  token: defaultDesignToken,
  isDark: false,
  theme: defaultTheme,
});

export function getDesignToken(config: ThemeConfig = {}) {
  const algorithm = config.algorithm ?? defaultAlgorithm;
  const theme = createTheme(algorithm);
  const token = {
    ...defaultDesignToken,
    ...config.token,
  };

  return theme.getDerivativeToken(token);
}

function useToken() {
  const [theme, token, hashId, , isDark] = useInternalToken();

  return { theme, token, hashId, isDark };
}

export type {
  DerivativeToken,
  DesignToken,
  DesignTokenContextProps,
  ThemeAlgorithm,
  ThemeConfig,
} from './interface';

export default {
  DesignTokenContext,
  useToken,
  defaultAlgorithm,
  darkAlgorithm,
  getDesignToken,
};
