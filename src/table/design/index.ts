import { TinyColor } from '@ctrl/tinycolor';

import type { DerivativeToken } from '../../theme';

export interface TableComponentToken extends Partial<DerivativeToken> {
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

type BaseTableToken = Pick<
  TableComponentToken,
  | 'cellPaddingBlockSM'
  | 'cellPaddingInlineSM'
  | 'cellPaddingBlockMD'
  | 'cellPaddingInlineMD'
  | 'cellPaddingBlock'
  | 'cellPaddingInline'
>;

const baseTableToken: BaseTableToken = {
  cellPaddingBlockSM: 8,
  cellPaddingInlineSM: 8,
  cellPaddingBlockMD: 12,
  cellPaddingInlineMD: 8,
  cellPaddingBlock: 16,
  cellPaddingInline: 16,
};

const prepareLightTableToken = (
  token: DerivativeToken,
): TableComponentToken => {
  const colorBgBase = new TinyColor(token.colorBgBase);
  const colorPrimary = new TinyColor(token.colorPrimary);

  return {
    ...baseTableToken,
    placeholderColorBg: colorBgBase.darken(7).toRgbString(),
    cellColorHoverBg: colorBgBase.darken(5).toRgbString(),
    cellColorActiveBg: colorBgBase.darken(9).toRgbString(),
    sortableCellColorBg: colorPrimary.lighten(40).toRgbString(),
    overableCellColorBg: colorPrimary.lighten(43).toRgbString(),
    previewHiddenCellColorBg: colorPrimary.lighten(43).toRgbString(),
    previewRestoredCellColorBg: colorPrimary.lighten(40).toRgbString(),
  };
};

const prepareDarkTableToken = (token: DerivativeToken): TableComponentToken => {
  const colorBgBase = new TinyColor(token.colorBgBase);
  const colorPrimary = new TinyColor(token.colorPrimary);

  return {
    ...baseTableToken,
    placeholderColorBg: colorBgBase.darken(92).toRgbString(),
    cellColorHoverBg: colorBgBase.darken(90).toRgbString(),
    cellColorActiveBg: colorBgBase.darken(93).toRgbString(),
    sortableCellColorBg: colorBgBase.darken(82).toRgbString(),
    overableCellColorBg: colorBgBase.darken(80).toRgbString(),
    previewHiddenCellColorBg: colorPrimary.darken(80).toRgbString(),
    previewRestoredCellColorBg: colorBgBase.darken(82).toRgbString(),
  };
};

export const prepareTableToken = (
  token: DerivativeToken,
  isDark: boolean,
): TableComponentToken =>
  isDark ? prepareDarkTableToken(token) : prepareLightTableToken(token);
