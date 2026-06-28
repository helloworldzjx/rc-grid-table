import { TinyColor } from '@ctrl/tinycolor';

import type { DerivativeToken } from '../../theme';

export interface TableComponentToken extends Partial<DerivativeToken> {
  placeholderColorBg: string;
  cellBorderRadius: number;
  cellPaddingBlockSM: number | string;
  cellPaddingInlineSM: number | string;
  cellPaddingBlockMD: number | string;
  cellPaddingInlineMD: number | string;
  cellPaddingBlock: number | string;
  cellPaddingInline: number | string;
  cellColorHoverBg: string;
  cellColorActiveBg: string;
  fixedColumnShadowColor: string;
  sortableCellColorBg: string;
  overableCellColorBg: string;
  previewHiddenCellColorBg: string;
  previewRestoredCellColorBg: string;
  scrollbarThumbColor: string;
  scrollbarThumbHoverColor: string;
  scrollbarThumbActiveColor: string;
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
  const colorTextBase = new TinyColor(token.colorTextBase);
  const colorBgBase = new TinyColor(token.colorBgBase);
  const colorPrimary = new TinyColor(token.colorPrimary);

  return {
    ...baseTableToken,
    placeholderColorBg: colorBgBase.darken(7).toRgbString(),
    cellBorderRadius: token.borderRadiusLG,
    cellColorHoverBg: colorBgBase.darken(5).toRgbString(),
    cellColorActiveBg: colorBgBase.darken(9).toRgbString(),
    fixedColumnShadowColor: colorTextBase.setAlpha(0.1).toRgbString(),
    sortableCellColorBg: colorPrimary.lighten(35).toRgbString(),
    overableCellColorBg: colorPrimary.lighten(42).toRgbString(),
    previewHiddenCellColorBg: colorPrimary.lighten(42).toRgbString(),
    previewRestoredCellColorBg: colorPrimary.lighten(35).toRgbString(),
    scrollbarThumbColor: colorTextBase.setAlpha(0.2).toRgbString(),
    scrollbarThumbHoverColor: colorTextBase.setAlpha(0.35).toRgbString(),
    scrollbarThumbActiveColor: colorTextBase.setAlpha(0.5).toRgbString(),
  };
};

const prepareDarkTableToken = (token: DerivativeToken): TableComponentToken => {
  const colorTextBase = new TinyColor(token.colorTextBase);
  const colorBgBase = new TinyColor(token.colorBgBase);
  const colorPrimary = new TinyColor(token.colorPrimary);

  return {
    ...baseTableToken,
    placeholderColorBg: colorBgBase.lighten(10).toRgbString(),
    cellBorderRadius: token.borderRadiusLG,
    cellColorHoverBg: colorBgBase.lighten(12).toRgbString(),
    cellColorActiveBg: colorBgBase.lighten(11).toRgbString(),
    fixedColumnShadowColor: colorTextBase.setAlpha(0.1).toRgbString(),
    sortableCellColorBg: colorPrimary.darken(8).toRgbString(),
    overableCellColorBg: colorPrimary.darken(20).toRgbString(),
    previewHiddenCellColorBg: colorPrimary.darken(20).toRgbString(),
    previewRestoredCellColorBg: colorPrimary.darken(8).toRgbString(),
    scrollbarThumbColor: colorTextBase.setAlpha(0.2).toRgbString(),
    scrollbarThumbHoverColor: colorTextBase.setAlpha(0.35).toRgbString(),
    scrollbarThumbActiveColor: colorTextBase.setAlpha(0.5).toRgbString(),
  };
};

export const prepareTableToken = (
  token: DerivativeToken,
  isDark: boolean,
): TableComponentToken =>
  isDark ? prepareDarkTableToken(token) : prepareLightTableToken(token);
