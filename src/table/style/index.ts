import { type CSSInterpolation, useCSSVarRegister, useStyleRegister } from '@ant-design/cssinjs';

import { useTableContext } from '../context';
import { tableToken, type ComponentToken } from '../design';
import useToken from "../../theme/hooks/useToken"

type ComponentClsType = {
  wrapperCls: string
  wrapperInitializedCls: string
  componentCls: string
  contentCls: string
  borderedCls: string
  hasFixColumnsCls: string
  pingStartCls: string
  pingEndCls: string
  hasSummaryCls: string
  headCls: string
  headRowCls: string
  bodyCls: string
  bodyInnerCls: string
  bodyRowCls: string
  cellCls: string
  cellEllipsisCls: string
  cellEllipsisInnerCls: string
  cellEllipsisInnerShowTitleCls: string
  headLastCellCls: string
  headCellResizableCls: string
  headCellResizeDisabledCls: string
  headSortableCellCls: string
  sortableColumnCellCls: string
  overableColumnCellCls: string
  headDraggingOverlayCellCls: string
  cellFixedStartCls: string
  cellFixedStartLastCls: string
  cellFixedEndCls: string
  cellFixedEndFirstCls: string
  summaryCls: string
  summaryRowCls: string
}

const genInitialStyle = ({
  wrapperCls: initialCls,
  wrapperInitializedCls: initializedCls,
}: ComponentClsType,): CSSInterpolation => ({
  [`.${initialCls}`]: {
    opacity: 0,
    pointerEvents: 'none',
  },

  [`.${initializedCls}`]: {
    opacity: 1,
    pointerEvents: 'auto',
  },
});

const genBorderedStyle = (
  {
    componentCls,
    borderedCls,  
    headRowCls,
    cellCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}::before`]: {
    content: "' '",
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    borderBottom: `1px solid ${token.borderColor}`,
    pointerEvents: 'none',
    zIndex: 2,
  },
  
  [`.${borderedCls}`]: {
    borderRadius: token.borderRadius,
    // boxShadow: `0px 0.5px 0.5px ${token.borderColor}, 0px -0.5px 0.5px ${token.borderColor}, inset 0.5px 0px 0.5px ${adjustColor(token.borderColor, {r: -5, g: -5, b: -5})}, 0.5px 0px 0.5px ${token.borderColor}`,

    '&::before': {
      border: `1px solid ${token.borderColor}`,
      borderRadius: token.borderRadius,
    },

    [`.${headRowCls} .${cellCls}::before`]: {
      // content: "none",
      display: 'none',
    },

    [`.${cellCls}`]: {
      borderLeft: `1px solid ${token.borderColor}`,
    },
  },
});

const genHeadStyle = (
  {
    componentCls,
    headCls,
    headRowCls,
  }: ComponentClsType,
  _: ComponentToken,
): CSSInterpolation => ({
  [`.${headCls}`]: {
    display: 'grid',
    gridTemplateColumns: `var(--${componentCls}-cols-width)`,
    overflow: 'hidden',

    [`.${headRowCls}`]: {
      display: 'contents',
    },
  },
});

const genBodyStyle = (
  {
    componentCls,
    bodyCls,
    bodyInnerCls,
    bodyRowCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${bodyCls}::before`]: {
    content: "' '",
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 0,
    width: `var(--${componentCls}-cols-width-total)`,
    boxSizing: 'border-box',
    borderBottom: `1px solid ${token.borderColor}`,
    pointerEvents: 'none',
    zIndex: 2,
  },

  [`.${bodyInnerCls}`]: {
    display: 'grid',
    gridTemplateColumns: `var(--${componentCls}-cols-width)`,

    [`.${bodyRowCls}`]: {
      display: 'contents',
    },
  },
});

const genSummaryCls = ({
  componentCls,
  summaryCls,
  summaryRowCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${summaryCls}`]: {
    display: 'grid',
    gridTemplateColumns: `var(--${componentCls}-cols-width)`,
    overflow: 'auto',
    scrollbarWidth: 'none',

    [`.${summaryRowCls}`]: {
      display: 'contents',
    },
  },
});

const genCellStyle = (
  {
    headRowCls,
    bodyRowCls,
    summaryRowCls,
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
    cellEllipsisInnerShowTitleCls,
    headLastCellCls,
    headCellResizableCls,
    headCellResizeDisabledCls,
    headSortableCellCls,
    sortableColumnCellCls,
    overableColumnCellCls,
    headDraggingOverlayCellCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${headRowCls}`]: {

    [`.${cellCls}`] : {
      position: 'relative',
      backgroundColor: '#fafafa',
      borderBottom: `1px solid ${token.borderColor}`,
    },

    [`.${cellCls}:not(.${headLastCellCls})::before`]: {
      content: "' '",
      position: 'absolute',
      right: 1,
      insetBlock: token.cellPaddingBlock,
      borderRight: `1px solid ${token.borderColor}`,
    },

    [`.${headCellResizableCls}`]: {
      position: 'absolute',
      right: 1,
      insetBlock: token.cellPaddingBlock,
      width: 10,
      backgroundColor: 'transparent',
    },
    [`.${headCellResizableCls}:not(.${headCellResizeDisabledCls})`]: {
      cursor: 'e-resize',
    },
    [`.${headSortableCellCls}`]: {
      userSelect: 'none',
    },
    [`.${sortableColumnCellCls}::before, .${overableColumnCellCls}::before`]: {
      display: 'none',
    },
    [`.${headDraggingOverlayCellCls}`]: {
      display: 'flex',
      alignItems: 'center',
      gap: token.cellPaddingInline,
      paddingInline: token.cellPaddingInline,
      boxSizing: 'border-box',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      border: `1px solid ${token.borderColor}`,
      backgroundColor: '#fff',
      cursor: 'move',
    },
  },

  [`.${bodyRowCls} .${cellCls}`]: {
    // backgroundColor: '#fff',
    borderBottom: `1px solid ${token.borderColor}`,
  },

  // [`.${summaryRowCls}:not(:last-of-type) .${cellCls}`]: {
  [`.${summaryRowCls} .${cellCls}`]: {
    backgroundColor: '#fafafa',
    borderBottom: `1px solid ${token.borderColor}`,
  },

  [`.${cellCls}`]: {
    paddingBlock: token.cellPaddingBlock,
    paddingInline: token.cellPaddingInline,
    alignContent: 'center',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
  },

  [`.${cellEllipsisCls}`]: {

    [`.${cellEllipsisInnerCls}`]: {
      overflow: 'hidden',
      
      [`&.${cellEllipsisInnerShowTitleCls}`]: {
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }
    }
  },

  [`.${overableColumnCellCls}`]: {
    backgroundColor: `${token.overableCellBgColor} !important`,
  },
  
  [`.${sortableColumnCellCls}`]: {
    backgroundColor: `${token.sortableCellBgColor} !important`,
  },
});

const genFixedCellStyle = (
  {
    headRowCls,
    bodyRowCls,
    cellFixedStartCls,
    cellFixedStartLastCls,
    cellFixedEndCls,
    cellFixedEndFirstCls,
  }: ComponentClsType,
  _: ComponentToken,
): CSSInterpolation => ({
  [`.${headRowCls} .${cellFixedStartCls}, .${headRowCls} .${cellFixedEndCls}`]: {
    position: 'sticky',
    zIndex: 1,
  },
  [`.${cellFixedStartCls}, .${cellFixedEndCls}`]: {
    position: 'sticky',
    zIndex: 1,
  },

  [`.${bodyRowCls} .${cellFixedStartCls}, .${bodyRowCls} .${cellFixedEndCls}`]: {
    backgroundColor: '#fff',
  },

  [`.${headRowCls} .${cellFixedStartLastCls}::before`]: {
    right: '0px !important',
  },
  [`.${cellFixedStartLastCls}::after`]: {
    content: "' '",
    position: 'absolute',
    width: 30,
    top: 0,
    bottom: -1,
    right: 0,
    transform: 'translateX(100%)',
    transition: 'box-shadow 0.3s',
    pointerEvents: 'none',
  },

  [`.${cellFixedEndFirstCls}::after`]: {
    content: "' '",
    position: 'absolute',
    width: 30,
    top: 0,
    bottom: -1,
    left: 0,
    transform: 'translateX(-100%)',
    transition: 'box-shadow 0.3s',
    pointerEvents: 'none',
  },
});

const genFixedShadowStyle = ({
  componentCls,
  hasFixColumnsCls,
  pingStartCls,
  pingEndCls,
  headRowCls,
  cellFixedStartLastCls,
  cellFixedEndFirstCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${componentCls}`]: {

    '&::after': {
      content: "' '",
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '100%',
      pointerEvents: 'none',
      zIndex: 2,
    },

    [`&.${pingStartCls}::after`]: {
      boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },

    [`&.${pingEndCls}::after`]: {
      boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },
  },
  [`.${hasFixColumnsCls}::after`]: {
    content: 'none',
  },
  
  [`.${componentCls}.${pingStartCls} .${cellFixedStartLastCls}::after`]: {
    boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
  },
  [`.${componentCls}.${pingEndCls} .${cellFixedEndFirstCls}::after`]: {
    boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
  },
  [`.${pingStartCls} .${headRowCls} .${cellFixedStartLastCls}::before`]: {
    display: 'none',
  },
});

const genNestStyles = (clsObj: ComponentClsType, mergedToken: ComponentToken): CSSInterpolation => [
  genInitialStyle(clsObj),
  genBorderedStyle(clsObj, mergedToken),
  genFixedShadowStyle(clsObj),
  { [`.${clsObj.componentCls}`]: genHeadStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genBodyStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genSummaryCls(clsObj) },
  { [`.${clsObj.componentCls}`]: genCellStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genFixedCellStyle(clsObj, mergedToken) },
];

export const useStyles = () => {
  const prefixCls = useTableContext().prefixCls as string;
  const [theme, token, hashId, realToken, cssVar] = useToken();

  const clsObj: ComponentClsType = {
    wrapperCls: `${prefixCls}-wrapper`,
    wrapperInitializedCls: `${prefixCls}-wrapper-initialized`,
    componentCls: prefixCls,
    contentCls: `${prefixCls}-content`,
    borderedCls: `${prefixCls}-bordered`,
    hasFixColumnsCls: `${prefixCls}-has-fix-columns`,
    pingStartCls: `${prefixCls}-ping-start`,
    pingEndCls: `${prefixCls}-ping-end`,
    hasSummaryCls: `${prefixCls}-has-summary`,
    headCls: `${prefixCls}-head`,
    headRowCls: `${prefixCls}-head-row`,
    bodyCls: `${prefixCls}-body`,
    bodyInnerCls: `${prefixCls}-body-inner`,
    bodyRowCls: `${prefixCls}-body-row`,
    cellCls: `${prefixCls}-cell`,
    cellEllipsisCls: `${prefixCls}-cell-ellipsis`,
    cellEllipsisInnerCls: `${prefixCls}-cell-ellipsis-inner`,
    cellEllipsisInnerShowTitleCls: `${prefixCls}-cell-ellipsis-inner-show-title`,
    headLastCellCls: `${prefixCls}-head-last-cell`,
    headCellResizableCls: `${prefixCls}-head-cell-resizable`,
    headCellResizeDisabledCls: `${prefixCls}-head-cell-resize-disabled`,
    headSortableCellCls: `${prefixCls}-head-sortable-cell`,
    sortableColumnCellCls: `${prefixCls}-sortable-column-cell`,
    overableColumnCellCls: `${prefixCls}-head-cell-overable`,
    headDraggingOverlayCellCls: `${prefixCls}-head-dragging-verlay-cell`,
    cellFixedStartCls: `${prefixCls}-cell-fixed-start`,
    cellFixedStartLastCls: `${prefixCls}-cell-fixed-start-last`,
    cellFixedEndCls: `${prefixCls}-cell-fixed-end`,
    cellFixedEndFirstCls: `${prefixCls}-cell-fixed-end-first`,
    summaryCls: `${prefixCls}-summary`,
    summaryRowCls: `${prefixCls}-summary-row`,
  }

  const [cssVarToken] = useCSSVarRegister(
    {
      path: [prefixCls],
      key: cssVar?.key as string,
      token: realToken,
      prefix: prefixCls,
      unitless: {
        lineHeight: true,
      },
      ignore: {
        lineHeightBase: true,
      },
      scope: clsObj.wrapperCls,
    },
    // @ts-ignore
    () => tableToken,
  );

  const mergedToken: any = {
    ...token,
    ...cssVar?.key ? cssVarToken : tableToken
  };

  useStyleRegister(
    { theme, token, hashId, path: [prefixCls] },
    () => genNestStyles(clsObj, mergedToken),
  );

  return {
    hashId,
    cssVarCls: cssVar?.key,
    ...clsObj
  };
};
