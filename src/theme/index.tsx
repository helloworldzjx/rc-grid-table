import { createTheme } from '@ant-design/cssinjs';
import { TinyColor } from '@ctrl/tinycolor';
import { createContext } from 'react';

import {
  defaultDerivativeToken,
  derivativeSource,
  genFontMapToken,
  genRadius,
} from './algorithm';
import useInternalToken from './hooks/useToken';
import {
  DerivativeToken,
  DesignToken,
  DesignTokenContextProps,
  ThemeConfig,
} from './interface';

export const defaultDesignToken: DesignToken = {
  fontSizeBase: derivativeSource.fontSizeBase,
  colorTextBase: '',
  colorBgBase: '',

  colorPrimary: '#1890ff',

  borderRadius: derivativeSource.borderRadius,
  borderWidth: 1,
};

const getAlphaColor = (baseColor: string, alpha: number) =>
  new TinyColor(baseColor).setAlpha(alpha).toRgbString();

const getSolidColor = (baseColor: string, brightness: number, dark = false) => {
  const color = new TinyColor(baseColor);

  return (
    dark ? color.lighten(brightness) : color.darken(brightness)
  ).toHexString();
};

export function defaultAlgorithm(designToken: DesignToken): DerivativeToken {
  const colorTextBase = designToken.colorTextBase || '#000';
  const colorBgBase = designToken.colorBgBase || '#fff';
  const fontMapToken = genFontMapToken(designToken.fontSizeBase);
  const radiusMapToken = genRadius(designToken.borderRadius);

  return {
    ...designToken,
    ...defaultDerivativeToken,
    ...fontMapToken,
    ...radiusMapToken,
    colorTextBase,
    colorBgBase,
    colorText: getAlphaColor(colorTextBase, 0.88),
    colorBgContainer: getSolidColor(colorBgBase, 0),
    colorBgLayout: getSolidColor(colorBgBase, 3),
    colorBorder: getSolidColor(colorBgBase, 13),
  };
}

export function darkAlgorithm(designToken: DesignToken): DerivativeToken {
  const colorTextBase = designToken.colorTextBase || '#fff';
  const colorBgBase = designToken.colorBgBase || '#000';
  const fontMapToken = genFontMapToken(designToken.fontSizeBase);
  const radiusMapToken = genRadius(designToken.borderRadius);

  return {
    ...designToken,
    ...defaultDerivativeToken,
    ...fontMapToken,
    ...radiusMapToken,
    colorTextBase,
    colorBgBase,
    colorText: getAlphaColor(colorTextBase, 0.85),
    colorBgContainer: getSolidColor(colorBgBase, 8, true),
    colorBgLayout: getSolidColor(colorBgBase, 13, true),
    colorBorder: getSolidColor(colorBgBase, 26, true),
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
