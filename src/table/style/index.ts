import { type CSSInterpolation, unit, useCSSVarRegister, useStyleRegister } from '@ant-design/cssinjs';

import { useTableContext } from '../context';
import { lightTableToken, darkTableToken, type ComponentToken } from '../design';
import useToken from "../../theme/hooks/useToken"

type ComponentClsType = {
  wrapperCls: string
  wrapperInitializedCls: string
  placeholderCls: string
  placeholderBorderedCls: string
  componentCls: string
  componentSMCls: string
  componentMDCls: string
  contentCls: string
  borderedCls: string
  stripeCls: string
  noDataCls: string
  hasFixColumnsCls: string
  fixColumnsGappedCls: string
  pingStartCls: string
  pingEndCls: string
  hasSummaryCls: string
  hasXScrollbarCls: string
  hasYScrollbarCls: string
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
  noDataCellCls: string
  noDataCellContentCls: string
  summaryCls: string
  summaryRowCls: string
}

const genInitialStyle = ({
  wrapperCls: initialCls,
  wrapperInitializedCls: initializedCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${initialCls}`]: {
    opacity: 0,
    pointerEvents: 'none',
  },

  [`.${initializedCls}`]: {
    opacity: 1,
    pointerEvents: 'auto',
  },
});

const genPlaceholderStyle = (
  {
    placeholderCls,
    placeholderBorderedCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${placeholderCls}`]: {
    position: 'absolute',
    height: '100%',
    top: 0,
    right: 0,
    boxSizing: 'border-box',
    backgroundColor: token.placeholderColorBg,
    transition: 'background-color 0.3s',
    userSelect: 'none',

    '&:hover': {
      backgroundColor: token.cellColorHoverBg,
    },

    '&:active': {
      backgroundColor: token.cellColorActiveBg,
    },
  },

  [`.${placeholderBorderedCls}`]: {
    height: 'calc(100% - 2px)',
    top: 1,
    borderLeft: `1px solid ${token.colorBorder}`,
    borderTopRightRadius: token.borderRadius,
    borderBottomRightRadius: token.borderRadius,
  },
});

const genBorderedStyle = (
  {
    componentCls,
    fixColumnsGappedCls,
    cellFixedStartLastCls,
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
    borderBottom: `1px solid ${token.colorBorder}`,
    pointerEvents: 'none',
    zIndex: 2,
  },
  
  [`.${borderedCls}`]: {
    borderRadius: token.borderRadius,
    // boxShadow: `0px 0.5px 0.5px ${token.colorBorder}, 0px -0.5px 0.5px ${token.colorBorder}, inset 0.5px 0px 0.5px ${adjustColor(token.colorBorder, {r: -5, g: -5, b: -5})}, 0.5px 0px 0.5px ${token.colorBorder}`,

    '&::before': {
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
    },

    [`.${headRowCls} .${cellCls}::before`]: {
      // content: "none",
      display: 'none',
    },

    [`.${cellCls}`]: {
      borderLeft: `1px solid ${token.colorBorder}`,
    },

    [`&.${fixColumnsGappedCls} .${cellFixedStartLastCls}::after`]: {
      width: 32,
      borderLeft: `1px solid ${token.colorBorder}`,
    }
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
    overflow: 'auto',
    scrollbarWidth: 'none',

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
    borderBottom: `1px solid ${token.colorBorder}`,
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
      backgroundColor: token.colorBgLayout,
      borderBottom: `1px solid ${token.colorBorder}`,
    },

    [`.${cellCls}:not(.${headLastCellCls})::before`]: {
      content: "' '",
      position: 'absolute',
      right: 0,
      insetBlock: unit(token.cellPaddingBlock),
      borderRight: `1px solid ${token.colorBorder}`,
    },

    [`.${headCellResizableCls}`]: {
      position: 'absolute',
      top: 0,
      right: 0,
      // insetBlock: unit(token.cellPaddingBlock), // 暂时不使用自动高度
      width: 10,
      height: 999,
      backgroundColor: 'transparent',
    },
    [`.${headCellResizableCls}:not(.${headCellResizeDisabledCls})`]: {
      cursor: 'e-resize',
    },
    [`.${headSortableCellCls}`]: {
      userSelect: 'none',
    },
    [`.${headDraggingOverlayCellCls}`]: {
      display: 'flex',
      alignItems: 'center',
      gap: unit(token.cellPaddingInline),
      paddingInline: unit(token.cellPaddingInline),
      boxSizing: 'border-box',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      border: `1px solid ${token.colorBorder}`,
      backgroundColor: token.colorBgContainer,
      cursor: 'move',
    },
  },

  [`.${bodyRowCls}`]: {
    
    [`.${cellCls}`]: {
      backgroundColor: token.colorBgContainer,
      borderBottom: `1px solid ${token.colorBorder}`,
    },

    [`&:hover .${cellCls}`]: {
      backgroundColor: token.cellColorHoverBg,
      transition: 'background-color 0.3s',
    }
  },

  // [`.${summaryRowCls}:not(:last-of-type) .${cellCls}`]: {
  [`.${summaryRowCls} .${cellCls}`]: {
    backgroundColor: token.colorBgLayout,
    borderBottom: `1px solid ${token.colorBorder}`,
  },

  [`.${cellCls}`]: {
    fontSize: token.fontSize,
    color: token.colorText,
    paddingBlock: unit(token.cellPaddingBlock),
    paddingInline: unit(token.cellPaddingInline),
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
    backgroundColor: `${token.overableCellColorBg} !important`,
  },
  
  [`.${sortableColumnCellCls}`]: {
    backgroundColor: `${token.sortableCellColorBg} !important`,
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
  token: ComponentToken,
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
    backgroundColor: token.colorBgContainer,
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
  fixColumnsGappedCls,
  pingStartCls,
  pingEndCls,
  hasXScrollbarCls,
  headRowCls,
  cellFixedStartLastCls,
  cellFixedEndFirstCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${componentCls}.${hasXScrollbarCls}`]: {

    '&::after': {
      content: "' '",
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: `min(100%, var(--${componentCls}-cols-width-total))`,
      pointerEvents: 'none',
      zIndex: 2,
    },

    [`&.${pingStartCls}::after`]: {
      boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },
    [`&.${pingEndCls}::after`]: {
      boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },
    [`&.${pingStartCls}.${pingEndCls}::after`]: {
      boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1), inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },
  },
  [`.${hasFixColumnsCls}::after`]: {
    display: 'none',
  },
  
  [`.${componentCls}.${pingStartCls}:not(.${fixColumnsGappedCls}) .${cellFixedStartLastCls}::after`]: {
    boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
  },
  [`.${componentCls}.${pingEndCls}:not(.${fixColumnsGappedCls}) .${cellFixedEndFirstCls}::after`]: {
    boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
  },
  [`.${pingStartCls} .${headRowCls} .${cellFixedStartLastCls}::before`]: {
    display: 'none',
  },
});

const genSizeClsStyle = (
  {
    componentCls,
    componentSMCls,
    componentMDCls,
    headRowCls,
    headLastCellCls,
    headCellResizableCls,
    cellCls,
  }: ComponentClsType,
  token: ComponentToken
): CSSInterpolation => ({
  [`.${componentCls}.${componentSMCls} .${headRowCls}`]: {
    [`.${cellCls}:not(.${headLastCellCls})::before`]: {
      insetBlock: unit(token.cellPaddingBlockSM),
    },

    [`.${headCellResizableCls}`]: {
      insetBlock: unit(token.cellPaddingBlockSM),
    },
  },
  [`.${componentCls}.${componentMDCls} .${headRowCls}`]: {
    [`.${cellCls}:not(.${headLastCellCls})::before`]: {
      insetBlock: unit(token.cellPaddingBlockMD),
    },

    [`.${headCellResizableCls}`]: {
      insetBlock: unit(token.cellPaddingBlockMD),
    },
  },

  [`.${componentCls}.${componentSMCls} .${cellCls}`]: {
    paddingBlock: unit(token.cellPaddingBlockSM),
    paddingInline: unit(token.cellPaddingInlineSM),
  },
  [`.${componentCls}.${componentMDCls} .${cellCls}`]: {
    paddingBlock: unit(token.cellPaddingBlockMD),
    paddingInline: unit(token.cellPaddingInlineMD),
  },
});

const genStripeClsStyle = (
  {
    stripeCls,
    bodyRowCls,
    cellCls,
  }: ComponentClsType,
  token: ComponentToken
): CSSInterpolation => ({
  // 这里使用nth-of-type去判断，后面展开行会使用p元素
  [`.${stripeCls} .${bodyRowCls}:nth-of-type(even) .${cellCls}`]: {
    backgroundColor: token.colorBgLayout,
  }
});

const genEmptyClsStyle = (
  {
    noDataCls,
    noDataCellCls,
    noDataCellContentCls,
  }: ComponentClsType,
  _: ComponentToken
): CSSInterpolation => ({
  [`.${noDataCls}`]: {
    
    [`.${noDataCellCls}`]: {
      minHeight: '200px',
    },

    [`.${noDataCellContentCls}`]: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      pointerEvents: 'none',
    }
  }
});

const genNestStyles = (clsObj: ComponentClsType, mergedToken: ComponentToken): CSSInterpolation => [
  genInitialStyle(clsObj),
  genPlaceholderStyle(clsObj, mergedToken),
  genBorderedStyle(clsObj, mergedToken),
  genFixedShadowStyle(clsObj),
  genSizeClsStyle(clsObj, mergedToken),
  genStripeClsStyle(clsObj, mergedToken),
  genEmptyClsStyle(clsObj, mergedToken),
  // 避免对象属性冲突，分开来构建样式
  { [`.${clsObj.componentCls}`]: genHeadStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genBodyStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genSummaryCls(clsObj) },
  { [`.${clsObj.componentCls}`]: genCellStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genFixedCellStyle(clsObj, mergedToken) },
];

export const useStyles = () => {
  const prefixCls = useTableContext().prefixCls as string;
  const [theme, token, hashId, realToken, isDark, cssVar] = useToken();

  const clsObj: ComponentClsType = {
    wrapperCls: `${prefixCls}-wrapper`,
    wrapperInitializedCls: `${prefixCls}-wrapper-initialized`,
    placeholderCls: `${prefixCls}-placeholder`,
    placeholderBorderedCls: `${prefixCls}-placeholder-bordered`,
    componentCls: prefixCls,
    componentSMCls: `${prefixCls}-wrapper-small`,
    componentMDCls: `${prefixCls}-wrapper-middle`,
    contentCls: `${prefixCls}-content`,
    borderedCls: `${prefixCls}-bordered`,
    stripeCls: `${prefixCls}-stripe`,
    noDataCls: `${prefixCls}-no-data`,
    hasFixColumnsCls: `${prefixCls}-has-fix-columns`,
    fixColumnsGappedCls: `${prefixCls}-fix-columns-gapped`,
    pingStartCls: `${prefixCls}-ping-start`,
    pingEndCls: `${prefixCls}-ping-end`,
    hasSummaryCls: `${prefixCls}-has-summary`,
    hasXScrollbarCls: `${prefixCls}-has-horizontal-scrollbar`,
    hasYScrollbarCls: `${prefixCls}-has-vertical-scrollbar`,
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
    noDataCellCls: `${prefixCls}-no-data-cell`,
    noDataCellContentCls: `${prefixCls}-no-data-cell-content`,
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
    () => isDark ? darkTableToken : lightTableToken,
  );

  const mergedToken: any = {
    ...token,
    ...cssVar?.key ? cssVarToken : isDark ? darkTableToken : lightTableToken
  };

  useStyleRegister(
    { theme, token, hashId, path: [prefixCls, `${isDark}`] },
    () => genNestStyles(clsObj, mergedToken),
  );

  return {
    hashId,
    cssVarCls: cssVar?.key,
    ...clsObj
  };
};
