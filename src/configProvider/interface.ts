import { DesignTokenContextPorps } from "../theme/interface";

export interface ConfigProviderProps {
  /**
   * @description className 前缀
   * @default "rc-grid-table"
   */
  prefixCls?: string;
  /**
   * @description 主题模式
   * @default "os"
   */
  themeMode?: 'light' | 'dark' | 'system';
  /**
   * @description 开启 css var
   * @default false
   */
  cssVar?: boolean | DesignTokenContextPorps['cssVar']
  // inherit?: boolean(待实现)
}