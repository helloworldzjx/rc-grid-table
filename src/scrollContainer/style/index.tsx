import { type CSSInterpolation, useStyleRegister } from '@ant-design/cssinjs';

import { useTableContext } from '../../table/context';
import useToken from '../../theme/hooks/useToken';

const genToggleShowStyle = (
  initialCls: string,
  initializedCls: string,
): CSSInterpolation => ({
  [`.${initialCls}`]: {
    opacity: 0,
    pointerEvents: 'none',
  },

  [`.${initializedCls}`]: {
    opacity: 1,
    pointerEvents: 'auto',
  },
});

const genScrollBarStyle = (
  scrollbarCls: string,
  scrollbarInnerCls: string,
  xScrollBarCls: string,
  xScrollBarThumbCls: string,
  xScrollBarShowCls: string,
  yScrollBarCls: string,
  yScrollBarThumbCls: string,
  yScrollBarShowCls: string,
): CSSInterpolation => ({
  [`.${scrollbarCls}`]: {
    position: 'relative',
    boxSizing: 'border-box',
    overflow: 'hidden',

    [`.${scrollbarInnerCls}`]: {
      height: '100%',
      boxSizing: 'border-box',
      overflow: 'auto',
      scrollbarWidth: 'none',
    },
  },

  [`.${xScrollBarCls}`]: {
    position: 'absolute',
    width: '100%',
    height: 12,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 12,
    userSelect: 'none',
    transition: 'background-color 0.2s',
    zIndex: 1,

    [`&.${xScrollBarShowCls} .${xScrollBarThumbCls}`]: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },

    [`.${xScrollBarThumbCls}`]: {
      position: 'absolute',
      height: 8,
      top: 'calc(50% - 4px)',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderRadius: 8,
      transition: 'background-color 0.2s',

      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },

      '&:active': {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
    },
  },

  [`.${yScrollBarCls}`]: {
    position: 'absolute',
    width: 12,
    height: '100%',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 12,
    userSelect: 'none',
    transition: 'background-color 0.2s',
    zIndex: 1,

    [`&.${yScrollBarShowCls} .${yScrollBarThumbCls}`]: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },

    [`.${yScrollBarThumbCls}`]: {
      position: 'absolute',
      width: 8,
      left: 'calc(50% - 4px)',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderRadius: 8,
      transition: 'background-color 0.2s',

      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },

      '&:active': {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
    },
  },
});

export const useStyles = () => {
  const prefixCls = useTableContext().prefixCls as string;
  const [theme, token, hashId] = useToken();
  const scrollbarCls = `${prefixCls}-scrollbar-container`;
  const scrollbarInnerCls = `${prefixCls}-scrollbar-inner`;
  const xScrollBarCls = `${prefixCls}-horizontal-scrollbar`;
  const xScrollBarThumbCls = `${prefixCls}-horizontal-scrollbar-thumb`;
  const xScrollBarShowCls = `${prefixCls}-horizontal-scrollbar-show`;
  const yScrollBarCls = `${prefixCls}-vertical-scrollbar`;
  const yScrollBarThumbCls = `${prefixCls}-vertical-scrollbar-thumb`;
  const yScrollBarShowCls = `${prefixCls}-vertical-scrollbar-show`;

  useStyleRegister(
    { theme, token, hashId, path: [`${prefixCls}-scrollbar`] },
    () => [
      genToggleShowStyle(xScrollBarCls, xScrollBarShowCls),
      genToggleShowStyle(yScrollBarCls, yScrollBarShowCls),
      genScrollBarStyle(
        scrollbarCls,
        scrollbarInnerCls,
        xScrollBarCls,
        xScrollBarThumbCls,
        xScrollBarShowCls,
        yScrollBarCls,
        yScrollBarThumbCls,
        yScrollBarShowCls,
      ),
    ],
  );

  return {
    hashId,
    scrollbarCls,
    scrollbarInnerCls,
    xScrollBarCls,
    xScrollBarThumbCls,
    xScrollBarShowCls,
    yScrollBarCls,
    yScrollBarThumbCls,
    yScrollBarShowCls,
  };
};
