import { TinyColor } from '@ctrl/tinycolor';
import { defaultDesignToken } from '../../theme';

import { DerivativeToken } from '../..';

export interface ComponentToken extends Partial<DerivativeToken> {
  placeholderColorBg: string;
  cellPaddingBlockSM: number | string;
  cellPaddingInlineSM: number | string;
  cellPaddingBlockMD: number | string;
  cellPaddingInlineMD: number | string;
  cellPaddingBlock: number | string;
  cellPaddingInline: number | string;
  cellColorHoverBg: string;
  cellColorActiveBg: string;
  sortableCellColorBg: string;
  overableCellColorBg: string;
  previewHiddenCellColorBg: string;
  previewRestoredCellColorBg: string;
}

const baseTableToken = {
  cellPaddingBlockSM: 8,
  cellPaddingInlineSM: 8,
  cellPaddingBlockMD: 12,
  cellPaddingInlineMD: 8,
  cellPaddingBlock: 16,
  cellPaddingInline: 16,
} as ComponentToken;

export const lightTableToken: ComponentToken = {
  ...baseTableToken,
  placeholderColorBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(7)
    .toRgbString(),
  cellColorHoverBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(5)
    .toRgbString(),
  cellColorActiveBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(9)
    .toRgbString(),
  sortableCellColorBg: new TinyColor(defaultDesignToken.colorPrimary)
    .lighten(40)
    .toRgbString(),
  overableCellColorBg: new TinyColor(defaultDesignToken.colorPrimary)
    .lighten(43)
    .toRgbString(),
  previewHiddenCellColorBg: new TinyColor(defaultDesignToken.colorPrimary)
    .lighten(43)
    .toRgbString(),
  previewRestoredCellColorBg: new TinyColor(defaultDesignToken.colorPrimary)
    .lighten(40)
    .toRgbString(),
};

export const darkTableToken: ComponentToken = {
  ...baseTableToken,
  placeholderColorBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(92)
    .toRgbString(),
  cellColorHoverBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(90)
    .toRgbString(),
  cellColorActiveBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(93)
    .toRgbString(),
  sortableCellColorBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(82)
    .toRgbString(),
  overableCellColorBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(80)
    .toRgbString(),
  previewHiddenCellColorBg: new TinyColor(defaultDesignToken.colorPrimary)
    .darken(80)
    .toRgbString(),
  previewRestoredCellColorBg: new TinyColor(defaultDesignToken.colorBgBase)
    .darken(82)
    .toRgbString(),
};
