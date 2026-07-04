import { TinyColor } from '@ctrl/tinycolor';
import type { GlobalToken } from 'antd';

export interface TableComponentToken extends Partial<GlobalToken> {
  placeholderBg: string;
  borderColor: string;
  borderRadius: number;
  cellPaddingBlockSM: number | string;
  cellPaddingInlineSM: number | string;
  cellPaddingBlockMD: number | string;
  cellPaddingInlineMD: number | string;
  cellPaddingBlock: number | string;
  cellPaddingInline: number | string;
  cellStripeBg: string;
  cellStrongBg: string;
  cellHoverBg: string;
  cellActiveBg: string;
  fixedColumnShadowColor: string;
  sortableCellBg: string;
  overableCellBg: string;
  previewHiddenCellBg: string;
  previewRestoredCellBg: string;
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

const getSolidAlphaColor = (
  foreground: string,
  background: string,
  alpha: number,
) =>
  new TinyColor(foreground)
    .setAlpha(alpha)
    .onBackground(background)
    .toHexString();

const getSolidColor = (foreground: string, background: string) =>
  new TinyColor(foreground).onBackground(background).toHexString();

const getAlphaColor = (foreground: string, alpha: number) =>
  new TinyColor(foreground).setAlpha(alpha).toRgbString();

export const prepareTableToken = (token: GlobalToken): TableComponentToken => {
  const colorBgContainer = token.colorBgContainer || token.colorBgBase;
  const toSolidColor = (color: string) =>
    getSolidColor(color, colorBgContainer);

  return {
    ...baseTableToken,
    placeholderBg: toSolidColor(token.colorFillContent),
    borderColor: token.colorBorder,
    borderRadius: 8,
    cellStripeBg: toSolidColor(token.colorFillAlter),
    cellStrongBg: toSolidColor(token.colorFillTertiary),
    cellHoverBg: toSolidColor(token.colorFillTertiary),
    cellActiveBg: toSolidColor(token.colorFillContentHover),
    fixedColumnShadowColor: getSolidAlphaColor(
      token.colorTextBase,
      colorBgContainer,
      0.16,
    ),
    sortableCellBg: toSolidColor(token.controlItemBgActiveHover),
    overableCellBg: toSolidColor(token.controlItemBgActive),
    previewHiddenCellBg: toSolidColor(token.controlItemBgActive),
    previewRestoredCellBg: toSolidColor(token.controlItemBgActiveHover),
    scrollbarThumbColor: getAlphaColor(token.colorTextBase, 0.2),
    scrollbarThumbHoverColor: getAlphaColor(token.colorTextBase, 0.36),
    scrollbarThumbActiveColor: getAlphaColor(token.colorTextBase, 0.52),
  };
};
