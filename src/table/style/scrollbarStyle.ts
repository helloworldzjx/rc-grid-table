import { type CSSInterpolation } from '@ant-design/cssinjs';
import { ScrollbarClsType } from './classNames';

export const genScrollbarToggleShowStyle = (
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

export const genScrollBarStyle = ({
  xScrollBarCls,
  xScrollBarStickyCls,
  xScrollBarThumbCls,
  xScrollBarShowCls,
  yScrollBarCls,
  yScrollBarThumbCls,
  yScrollBarShowCls,
}: ScrollbarClsType): CSSInterpolation => ({
  [`.${xScrollBarCls}`]: {
    position: 'absolute',
    width: '100%',
    height: 12,
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

  [`.${xScrollBarStickyCls}`]: {
    position: 'sticky',
    marginTop: -12,
    zIndex: 4,
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
