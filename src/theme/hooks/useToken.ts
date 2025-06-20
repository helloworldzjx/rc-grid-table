import { Theme, useCacheToken } from "@ant-design/cssinjs";
import { DarkThemeContext, defaultDesignToken, DesignTokenContext, LightThemeContext } from "..";
import { useContext } from "react";
import { DerivativeToken, DesignToken, DesignTokenContextPorps } from "../interface";

function useToken(): [
  theme: Theme<DesignToken, DerivativeToken>,
  token: DesignToken,
  hashId: string,
  realToken: DesignToken,
  cssVar?: DesignTokenContextPorps['cssVar'],
] {
  const {
    token: rootDesignToken = {},
    isDark,
    hashed,
    cssVar,
  } = useContext(DesignTokenContext);
  
  const theme = useContext(isDark ? DarkThemeContext : LightThemeContext);

  const [token, hashId, actualToken] = useCacheToken<
    DerivativeToken,
    DesignToken
  >(theme, [defaultDesignToken, rootDesignToken], {
    salt: typeof hashed === 'string' ? hashed : '',
    cssVar: cssVar && {
      ...cssVar,
      unitless: {
        lineHeight: true,
      },
    },
  });
  
  return [theme, token, hashed ? hashId : '', actualToken, cssVar];
}

export default useToken