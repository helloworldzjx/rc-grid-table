import { DerivativeToken } from '../..';

export interface ComponentToken extends Partial<DerivativeToken> {
  cellPaddingBlock: number | string;
  cellPaddingInline: number | string;
}

export const tableToken: ComponentToken = {
  cellPaddingBlock: 8,
  cellPaddingInline: 12,
}
