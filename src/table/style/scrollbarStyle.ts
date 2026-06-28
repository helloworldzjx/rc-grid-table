import { type CSSInterpolation } from '@ant-design/cssinjs';
import { ComponentClsType, ScrollbarClsType } from './classNames';

import {
  SCROLLBAR_SIZE,
  SCROLLBAR_THUMB_ABSOLUTE_LEFT_TOP,
  SCROLLBAR_THUMB_SIZE,
} from '../../_utils/const';
import type { TableComponentToken } from '../design';

export const genScrollbarInitialStyle = (
  { componentCls }: ComponentClsType,
  {
    xScrollBarCls: initialCls,
    xScrollBarShowCls: initializedCls,
  }: ScrollbarClsType,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`.${initialCls}`]: {
      opacity: 0,
      pointerEvents: 'none',
    },

    [`.${initializedCls}`]: {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
});

export const genScrollBarStyle = (
  { componentCls }: ComponentClsType,
  {
    xScrollBarCls,
    xScrollBarStickyCls,
    xScrollBarThumbCls,
    xScrollBarShowCls,
    yScrollBarCls,
    yScrollBarThumbCls,
    yScrollBarShowCls,
  }: ScrollbarClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`.${xScrollBarCls}`]: {
      position: 'absolute',
      width: '100%',
      height: SCROLLBAR_SIZE,
      left: 0,
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderRadius: SCROLLBAR_SIZE,
      touchAction: 'none',
      userSelect: 'none',
      transition: 'background-color 0.2s',
      zIndex: 2,

      [`&.${xScrollBarShowCls} .${xScrollBarThumbCls}`]: {
        backgroundColor: token.scrollbarThumbColor,
      },

      [`.${xScrollBarThumbCls}`]: {
        position: 'absolute',
        height: SCROLLBAR_THUMB_SIZE,
        top: SCROLLBAR_THUMB_ABSOLUTE_LEFT_TOP,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderRadius: SCROLLBAR_THUMB_SIZE,
        transition: 'background-color 0.2s',

        '&:hover': {
          backgroundColor: token.scrollbarThumbHoverColor,
        },

        '&:active': {
          backgroundColor: token.scrollbarThumbActiveColor,
        },
      },
    },

    [`.${xScrollBarStickyCls}`]: {
      position: 'sticky',
      marginTop: -SCROLLBAR_SIZE,
      zIndex: 5,
    },

    [`.${yScrollBarCls}`]: {
      position: 'absolute',
      width: SCROLLBAR_SIZE,
      height: '100%',
      top: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderRadius: SCROLLBAR_SIZE,
      touchAction: 'none',
      userSelect: 'none',
      transition: 'background-color 0.2s',
      zIndex: 2,

      [`&.${yScrollBarShowCls} .${yScrollBarThumbCls}`]: {
        backgroundColor: token.scrollbarThumbColor,
      },

      [`.${yScrollBarThumbCls}`]: {
        position: 'absolute',
        width: SCROLLBAR_THUMB_SIZE,
        left: SCROLLBAR_THUMB_ABSOLUTE_LEFT_TOP,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderRadius: SCROLLBAR_THUMB_SIZE,
        transition: 'background-color 0.2s',

        '&:hover': {
          backgroundColor: token.scrollbarThumbHoverColor,
        },

        '&:active': {
          backgroundColor: token.scrollbarThumbActiveColor,
        },
      },
    },
  },
});
