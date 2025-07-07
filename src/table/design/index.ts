import { TinyColor } from '@ctrl/tinycolor';
import { defaultDesignToken } from '../../theme';

import { DerivativeToken } from '../..';

export interface ComponentToken extends Partial<DerivativeToken> {
  placeholderColorBg: string
  cellPaddingBlockSM: number | string;
  cellPaddingInlineSM: number | string;
  cellPaddingBlockMD: number | string;
  cellPaddingInlineMD: number | string;
  cellPaddingBlock: number | string;
  cellPaddingInline: number | string;
  cellColorHoverBg: string
  cellColorActiveBg: string
  sortableCellColorBg: string
  overableCellColorBg: string
}

const baseTableToken = {
  cellPaddingBlockSM: 8,
  cellPaddingInlineSM: 8,
  cellPaddingBlockMD: 12,
  cellPaddingInlineMD: 8,
  cellPaddingBlock: 16,
  cellPaddingInline: 16,
} as ComponentToken

export const lightTableToken: ComponentToken = {
  ...baseTableToken,
  placeholderColorBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(7)
      .toString(),
  cellColorHoverBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(5)
      .toString(),
  cellColorActiveBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(9)
      .toString(),
  sortableCellColorBg: new TinyColor(defaultDesignToken.colorPrimary)
      .lighten(40)
      .toString(),
  overableCellColorBg: new TinyColor(defaultDesignToken.colorPrimary)
      .lighten(43)
      .toString(),
}

export const darkTableToken: ComponentToken = {
  ...baseTableToken,
  placeholderColorBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(92)
      .toString(),
  cellColorHoverBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(90)
      .toString(),
  cellColorActiveBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(93)
      .toString(),
  sortableCellColorBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(82)
      .toString(),
  overableCellColorBg: new TinyColor(defaultDesignToken.colorBgBase)
      .darken(80)
      .toString(),
}
