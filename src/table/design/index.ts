import { TinyColor } from '@ctrl/tinycolor';
import { defaultDesignToken } from 'rc-grid-table/es/theme';

import { DerivativeToken } from '../..';

export interface ComponentToken extends Partial<DerivativeToken> {
  cellPaddingBlock: number | string;
  cellPaddingInline: number | string;
  sortableCellBgColor: string
  overableCellBgColor: string
}

export const tableToken: ComponentToken = {
  cellPaddingBlock: 8,
  cellPaddingInline: 12,
  sortableCellBgColor: new TinyColor(defaultDesignToken.primaryColor)
        .lighten(40)
        .toString(),
  overableCellBgColor: new TinyColor(defaultDesignToken.primaryColor)
        .lighten(43)
        .toString(),
}
