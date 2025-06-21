import { type CSSInterpolation, useCSSVarRegister, useStyleRegister } from '@ant-design/cssinjs';
import { useTableContext } from '../context';
import { tableToken, type ComponentToken } from '../design';
import useToken from "../../theme/hooks/useToken"

type genStylesProps = {
  
};

type ComponentClsType = {
  wrapperCls: string
  wrapperInitializedCls: string
  wrapperborderedCls: string
  componentCls: string
  contentCls: string
  borderedCls: string
  borderCls: string
  pingStartCls: string
  pingEndCls: string
  topBorderCls: string
  rightBorderCls: string
  bottomBorderCls: string
  leftBorderCls: string
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

const genWrapperBorderedStyle = (
  {
    wrapperCls,
    wrapperborderedCls,
    borderCls,
    topBorderCls,
    rightBorderCls,
    bottomBorderCls,
    leftBorderCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${wrapperCls}`]: {

    [`.${borderCls}`]: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '100%',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      zIndex: 2,
    },

    [`.${bottomBorderCls}`]: {
      // height: 'calc(100% - 1px)',
      borderBottom: `1px solid ${token.borderColor}`,
    },
  },

  [`.${wrapperborderedCls}`]: {

    [`.${borderCls}`]: {
      borderRadius: token.borderRadius,
    },

    [`.${topBorderCls}`]: {
      borderTop: `1px solid ${token.borderColor}`,
    },
    [`.${rightBorderCls}`]: {
      borderRight: `1px solid ${token.borderColor}`,
    },
    [`.${leftBorderCls}`]: {
      borderLeft: `1px solid ${token.borderColor}`,
    },
  },
});

const genBorderedStyle = (
  {
    borderedCls,  
    headRowCls,
    cellCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${borderedCls}`]: {
    borderRadius: token.borderRadius,
    // boxShadow: `0px 0.5px 0.5px ${token.borderColor}, 0px -0.5px 0.5px ${token.borderColor}, inset 0.5px 0px 0.5px ${adjustColor(token.borderColor, {r: -5, g: -5, b: -5})}, 0.5px 0px 0.5px ${token.borderColor}`,

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

    [`.${headRowCls}`]: {
      display: 'contents',
    },
  },
});

const genBodyStyle = ({
  componentCls,
  bodyInnerCls,
  bodyRowCls,
}: ComponentClsType): CSSInterpolation => ({
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
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${headRowCls}`]: {

    [`.${cellCls}`] : {
      position: 'relative',
      backgroundColor: '#fafafa',
      borderBottom: `1px solid ${token.borderColor}`,
    },

    [`&:first-child .${cellCls}:not(:last-child)::before`]: {
      content: "' '",
      position: 'absolute',
      right: 1,
      top: token.cellPaddingBlock || 8,
      bottom: token.cellPaddingBlock || 8,
      borderRight: `1px solid ${token.borderColor}`,
    },

    [`&:not(:first-child) .${cellCls}::before`]: {
      content: "' '",
      position: 'absolute',
      right: 1,
      top: token.cellPaddingBlock || 8,
      bottom: token.cellPaddingBlock || 8,
      borderRight: `1px solid ${token.borderColor}`,
    },
  },

  [`.${bodyRowCls} .${cellCls}`]: {
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
    transition: 'opacity 0.3s',
    opacity: 0,
    boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
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
    transition: 'opacity 0.3s',
    opacity: 0,
    boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'none',
  },
});

const genFixedShadowStyle = ({
  componentCls,
  pingStartCls,
  pingEndCls,
  headRowCls,
  cellFixedStartLastCls,
  cellFixedEndFirstCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${componentCls}.${pingStartCls} .${cellFixedStartLastCls}::after`]: {
    opacity: 1,
  },

  [`.${componentCls}.${pingEndCls} .${cellFixedEndFirstCls}::after`]: {
    opacity: 1,
  },

  [`.${pingStartCls} .${headRowCls} .${cellFixedStartLastCls}::before`]: {
    display: 'none',
  },
});

const genNestStyles = (clsObj: ComponentClsType, mergedToken: ComponentToken): CSSInterpolation => [
  genInitialStyle(clsObj),
  genWrapperBorderedStyle(clsObj, mergedToken),
  genBorderedStyle(clsObj, mergedToken),
  genFixedShadowStyle(clsObj),
  { [`.${clsObj.componentCls}`]: genHeadStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genBodyStyle(clsObj) },
  { [`.${clsObj.componentCls}`]: genSummaryCls(clsObj) },
  { [`.${clsObj.componentCls}`]: genCellStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genFixedCellStyle(clsObj, mergedToken) },
];

export const useStyles = ({  }: genStylesProps) => {
  const prefixCls = useTableContext().prefixCls as string;
  const [theme, token, hashId, realToken, cssVar] = useToken();

  const clsObj: ComponentClsType = {
    wrapperCls: `${prefixCls}-wrapper`,
    wrapperInitializedCls: `${prefixCls}-wrapper-initialized`,
    wrapperborderedCls: `${prefixCls}-wrapper-bordered`,
    componentCls: prefixCls,
    contentCls: `${prefixCls}-content`,
    borderedCls: `${prefixCls}-bordered`,
    borderCls: `${prefixCls}-border`,
    pingStartCls: `${prefixCls}-ping-start`,
    pingEndCls: `${prefixCls}-ping-end`,
    topBorderCls: `${prefixCls}-top-border`,
    rightBorderCls: `${prefixCls}-right-border`,
    bottomBorderCls: `${prefixCls}-bottom-border`,
    leftBorderCls: `${prefixCls}-left-border`,
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
    cssVarKey: cssVar?.key,
    ...clsObj
  };
};
