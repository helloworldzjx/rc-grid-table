import { CSSObject } from "@ant-design/cssinjs";

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
  primaryColorHover: string;
  primaryColorDisabled: string;
  colorBgContainer: string
  colorBgLayout: string
  colorBorder: string
}

export interface DesignTokenContextPorps {
  token?: Partial<DesignToken>;
  hashed?: string | boolean;
  cssVar?: {
    key?: string;
    prefix?: string;
  };
  isDark: boolean,
}
