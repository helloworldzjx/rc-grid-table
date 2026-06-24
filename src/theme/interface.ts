import type { CSSObject, DerivativeFunc, Theme } from '@ant-design/cssinjs';

import type { TableComponentToken } from '../table/design';

export type GetStyle = (prefixCls: string, token: DerivativeToken) => CSSObject;

export interface DesignToken {
  colorPrimary: string;
  colorTextBase: string;

  colorBgBase: string;

  borderRadius: number;
  borderWidth: number;

  fontSizeBase: number;

  lineHeightBase: number;
}

export interface DerivativeToken extends DesignToken {
  lineHeight: string | number;
  fontSize: number;
  colorText: string;
  colorTextLightSolid: string;
  colorBgContainer: string;
  colorBgLayout: string;
  colorBorder: string;
}

export interface ThemeComponents {
  Table?: Partial<TableComponentToken>;
}

export interface ThemeCssVarConfig {
  key?: string;
  prefix?: string;
}

export type ThemeAlgorithm = DerivativeFunc<DesignToken, DerivativeToken>;

export interface ThemeConfig {
  token?: Partial<DesignToken>;
  components?: ThemeComponents;
  algorithm?: ThemeAlgorithm | ThemeAlgorithm[];
  inherit?: boolean;
  hashed?: string | boolean;
  cssVar?: boolean | ThemeCssVarConfig;
}

export interface DesignTokenContextProps {
  token?: Partial<DesignToken>;
  hashed?: string | boolean;
  cssVar?: ThemeCssVarConfig;
  isDark: boolean;
  theme: Theme<DesignToken, DerivativeToken>;
  components?: ThemeComponents;
}
