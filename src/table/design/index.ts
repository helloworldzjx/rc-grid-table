import { TinyColor } from '@ctrl/tinycolor';
import { defaultDesignToken } from 'rc-grid-table/es/theme';

import { DerivativeToken } from '../..';

export interface ComponentToken extends Partial<DerivativeToken> {
  cellPaddingBlockSM: number | string;
  cellPaddingInlineSM: number | string;
  cellPaddingBlockMD: number | string;
  cellPaddingInlineMD: number | string;
  cellPaddingBlock: number | string;
  cellPaddingInline: number | string;
  sortableCellBgColor: string
  overableCellBgColor: string
}

export const tableToken: ComponentToken = {
  cellPaddingBlockSM: 8,
  cellPaddingInlineSM: 8,
  cellPaddingBlockMD: 12,
  cellPaddingInlineMD: 8,
  cellPaddingBlock: 16,
  cellPaddingInline: 16,
  sortableCellBgColor: new TinyColor(defaultDesignToken.primaryColor)
        .lighten(40)
        .toString(),
  overableCellBgColor: new TinyColor(defaultDesignToken.primaryColor)
        .lighten(43)
        .toString(),
}
