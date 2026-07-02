import type { DesignTokenContextProps, ThemeConfig } from '../theme/interface';
import type { TableConfig } from './context';

export interface ConfigProviderProps {
  /**
   * @description className root prefix
   * @default "rc"
   */
  rootPrefixCls?: string;
  /**
   * @description theme mode
   * @default "light"
   */
  themeMode?: 'light' | 'dark' | 'system';
  /**
   * @description enable css var
   * @default false
   */
  cssVar?: boolean | DesignTokenContextProps['cssVar'];
  /**
   * @description theme config
   */
  theme?: ThemeConfig;
  /**
   * @description table config
   */
  table?: TableConfig;
}
