import { CSSObject } from "@ant-design/cssinjs";

export type GetStyle = (prefixCls: string, token: DerivativeToken) => CSSObject;

export interface DesignToken {
  primaryColor: string;
  textColor: string;

  componentBackgroundColor: string;

  borderRadius: number;
  borderColor: string;
  borderWidth: number;

  fontSize: number;

  lineHeight: number;
  lineHeightBase: number;
}

export interface DerivativeToken extends DesignToken {
  primaryColorHover: string
  primaryColorDisabled: string;
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
