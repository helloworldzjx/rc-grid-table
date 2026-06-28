import {
  unit,
  useCSSVarRegister,
  useStyleRegister,
  type CSSInterpolation,
} from '@ant-design/cssinjs';
import { useMemo } from 'react';

import { COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X } from '../../_utils/const';
import useToken from '../../theme/hooks/useToken';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { prepareTableToken, type TableComponentToken } from '../design';
import {
  ComponentClsType,
  CssVarType,
  getComponentCls,
  getCssVar,
  getScrollbarCls,
  ScrollbarClsType,
} from './classNames';
import { genScrollbarInitialStyle, genScrollBarStyle } from './scrollbarStyle';

const genInitialStyle = ({
  wrapperCls,
  wrapperInitializedCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${wrapperCls}`]: {
    opacity: 0,
    pointerEvents: 'none',

    [`&.${wrapperInitializedCls}`]: {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
});

const genPlaceholderStyle = (
  { componentCls, placeholderCls, placeholderDisabledCls }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`.${placeholderCls}`]: {
      position: 'absolute',
      height: '100%',
      top: 0,
      right: 0,
      boxSizing: 'border-box',
      backgroundColor: token.placeholderColorBg,
      transition: 'background-color 0.3s',
      userSelect: 'none',
      zIndex: 5,

      [`&:not(.${placeholderDisabledCls}):hover`]: {
        backgroundColor: token.cellColorHoverBg,
      },

      [`&:not(.${placeholderDisabledCls}):active`]: {
        backgroundColor: token.cellColorActiveBg,
      },

      [`&.${placeholderDisabledCls}`]: {
        cursor: 'not-allowed',
      },
    },
  },
});

const genComponentStyle = ({
  componentCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${componentCls}`]: {
    position: 'relative',
  },
});

const getCurrentHeadRowSelector = ({
  headCls,
  headInnerCls,
  headRowCls,
}: ComponentClsType) => `& > .${headCls} > .${headInnerCls} > .${headRowCls}`;

const getCurrentBodyRowSelectors = ({
  bodyCls,
  bodyInnerCls,
  bodyRowCls,
  bodyVirtualFillerCls,
  bodyVirtualInnerCls,
}: ComponentClsType) => [
  `& > .${bodyCls} > .${bodyInnerCls} > .${bodyRowCls}`,
  `& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyRowCls}`,
];

const appendCurrentBodyRowSelector = (
  classNames: ComponentClsType,
  selector: string,
) =>
  getCurrentBodyRowSelectors(classNames)
    .map((rowSelector) => `${rowSelector}${selector}`)
    .join(', ');

const getCurrentSummaryRowSelector = ({
  summaryCls,
  summaryInnerCls,
  summaryRowCls,
}: ComponentClsType) =>
  `& > .${summaryCls} > .${summaryInnerCls} > .${summaryRowCls}`;

const genVirtualStyle = (
  {
    componentCls,
    virtualCls,
    bodyCls,
    bodyInnerCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    bodyVirtualRowSpanCls,
    bodyVirtualRowSpanTopCls,
    bodyVirtualPreservedCls,
    bodyFixedHeightRowCls,
    cellCls,
  }: ComponentClsType,
  {
    columnsWidthCssVar,
    columnsWidthTotalCssVar,
    bodyFixedHeightRowCssVar,
  }: CssVarType,
): CSSInterpolation => ({
  [`.${componentCls}.${virtualCls}`]: {
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls}`]: {
      position: 'relative',
      gridColumn: '1 / -1',
      width: `max(100%, var(${columnsWidthTotalCssVar}))`,
      minHeight: '100%',
    },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls}`]:
      {
        position: 'absolute',
        insetInline: 0,
        top: 0,
        display: 'grid',
        gridTemplateColumns: `var(${columnsWidthCssVar})`,
      },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyVirtualRowSpanCls}`]:
      {
        position: 'absolute',
        insetInline: 0,
        top: 0,
        pointerEvents: 'none',

        [`& > .${cellCls}`]: {
          pointerEvents: 'auto',
        },
      },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyVirtualPreservedCls}`]:
      {
        position: 'absolute',
        insetInline: 0,
        top: 0,
        display: 'grid',
        gridTemplateColumns: `var(${columnsWidthCssVar})`,
      },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyVirtualRowSpanTopCls} > .${cellCls}`]:
      {
        borderTopColor: 'transparent',
      },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyFixedHeightRowCls}`]:
      {
        gridTemplateRows: `var(${bodyFixedHeightRowCssVar})`,
      },
  },
});

const genBorderedStyle = (
  {
    componentCls,
    borderedCls,
    hasXScrollbarCls,
    hasSummaryCls,
    placeholderCls,
    headCls,
    headInnerCls,
    bodyCls,
    bodyInnerCls,
    summaryCls,
    summaryInnerCls,
    headRowCls,
    bodyRowCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    summaryRowCls,
    cellCls,
    pingStartCls,
    pingEndCls,
    headCellResizeHandleCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => {
  const currentHeadRowSelector = getCurrentHeadRowSelector({
    headCls,
    headInnerCls,
    headRowCls,
  } as ComponentClsType);
  const currentBodyCellSelector = appendCurrentBodyRowSelector(
    {
      bodyCls,
      bodyInnerCls,
      bodyRowCls,
      bodyVirtualFillerCls,
      bodyVirtualInnerCls,
    } as ComponentClsType,
    ` > .${cellCls}`,
  );
  const currentSummaryRowSelector = getCurrentSummaryRowSelector({
    summaryCls,
    summaryInnerCls,
    summaryRowCls,
  } as ComponentClsType);

  return {
    [`.${componentCls}.${borderedCls}`]: {
      '&::before': {
        content: "' '",
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.cellBorderRadius,
        pointerEvents: 'none',
        zIndex: 2,
      },

      [`& > .${placeholderCls}`]: {
        border: `1px solid ${token.colorBorder}`,
        borderTopRightRadius: token.cellBorderRadius,
        borderBottomRightRadius: token.cellBorderRadius,
      },

      [`&.${hasXScrollbarCls}`]: {
        [`&.${pingStartCls}::after`]: {
          borderTopLeftRadius: token.cellBorderRadius,
          borderBottomLeftRadius: token.cellBorderRadius,
        },
        [`&.${pingEndCls}::after`]: {
          borderTopRightRadius: token.cellBorderRadius,
          borderBottomRightRadius: token.cellBorderRadius,
        },
        [`&.${pingStartCls}.${pingEndCls}::after`]: {
          borderRadius: token.cellBorderRadius,
        },
      },

      [`& > .${headCls}`]: {
        '&::before': {
          // 使用outline替代border，避免sticky情况下border叠加导致的宽度问题
          borderBottomColor: 'transparent',
          outline: `1px solid ${token.colorBorder}`,
          outlineOffset: -1,
          borderTopLeftRadius: token.cellBorderRadius,
          borderTopRightRadius: token.cellBorderRadius,
        },

        [`& > .${headInnerCls}`]: {
          borderTopLeftRadius: token.cellBorderRadius,
          borderTopRightRadius: token.cellBorderRadius,
        },
      },

      [`${currentHeadRowSelector} .${headCellResizeHandleCls}`]: {
        insetBlock: 0,
      },

      [`& > .${bodyCls}::before`]: {
        borderBottomLeftRadius: token.cellBorderRadius,
        borderBottomRightRadius: token.cellBorderRadius,
      },
      [`&:not(.${hasSummaryCls}) > .${bodyCls} > .${bodyInnerCls}`]: {
        borderBottomLeftRadius: token.cellBorderRadius,
        borderBottomRightRadius: token.cellBorderRadius,
      },

      [`& > .${summaryCls}`]: {
        '&::before': {
          // 使用outline替代border，避免sticky情况下border叠加导致的宽度问题
          borderBottomColor: 'transparent',
          outline: `1px solid ${token.colorBorder}`,
          outlineOffset: -1,
          borderBottomLeftRadius: token.cellBorderRadius,
          borderBottomRightRadius: token.cellBorderRadius,
        },

        [`& > .${summaryInnerCls}`]: {
          borderBottomLeftRadius: token.cellBorderRadius,
          borderBottomRightRadius: token.cellBorderRadius,
        },
      },

      [`${currentHeadRowSelector} > .${cellCls}::before`]: {
        display: 'none',
      },

      [`${currentHeadRowSelector} > .${cellCls}, ${currentBodyCellSelector}, ${currentSummaryRowSelector} > .${cellCls}`]:
        {
          borderLeft: `1px solid ${token.colorBorder}`,
        },
    },
  };
};

const genHeadStyle = (
  {
    componentCls,
    headCls,
    headStickyCls,
    headInnerCls,
    headRowCls,
  }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar }: CssVarType,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`& > .${headCls}`]: {
      position: 'relative',

      '&::before': {
        content: "' '",
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        borderBottom: `1px solid ${token.colorBorder}`,
        pointerEvents: 'none',
        zIndex: 3,
      },

      [`&.${headStickyCls}`]: {
        position: 'sticky',
        zIndex: 4,
      },

      [`& > .${headInnerCls}`]: {
        display: 'grid',
        gridTemplateColumns: `var(${columnsWidthCssVar})`,
        overflow: 'auto hidden',
        scrollbarWidth: 'none',

        [`& > .${headRowCls}`]: {
          display: 'contents',
        },
      },
    },
  },
});

const genBodyStyle = (
  {
    componentCls,
    hasSummaryCls,
    bodyCls,
    bodyInnerCls,
    bodyRowCls,
    bodyGridRowCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    bodySortDraggingOverlayRowCls,
  }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar }: CssVarType,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`& > .${bodyCls}`]: {
      position: 'relative',
      boxSizing: 'border-box',
      overflow: 'hidden',

      '&::before': {
        content: "' '",
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        borderBottom: `1px solid ${token.colorBorder}`,
        pointerEvents: 'none',
        zIndex: 3,
      },
    },

    [`&.${hasSummaryCls} > .${bodyCls}::before`]: {
      display: 'none',
    },

    [`& > .${bodyCls} > .${bodyInnerCls}`]: {
      display: 'grid',
      gridTemplateColumns: `var(${columnsWidthCssVar})`,
      boxSizing: 'border-box',
      overflow: 'auto',
      scrollbarWidth: 'none',

      [`& > .${bodyRowCls}`]: {
        display: 'contents',
      },

      [`& > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyRowCls}`]:
        {
          display: 'contents',
        },

      [`& > .${bodyGridRowCls}, & > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyGridRowCls}`]:
        {
          display: 'grid',
          gridTemplateColumns: `var(${columnsWidthCssVar})`,
          gridColumn: '1 / -1',
        },
    },

    [`.${bodyRowCls}.${bodySortDraggingOverlayRowCls}`]: {
      borderRadius: token.cellBorderRadius,
      boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
      outline: `1px solid ${token.colorBorder}`,
      outlineOffset: -1,
      pointerEvents: 'none',
    },
  },
});

const genSummaryCls = (
  {
    componentCls,
    summaryCls,
    summaryStickyCls,
    summaryInnerCls,
    summaryRowCls,
  }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar }: CssVarType,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`& > .${summaryCls}`]: {
      position: 'relative',
      boxSizing: 'border-box',

      '&::before': {
        content: "' '",
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        borderBottom: `1px solid ${token.colorBorder}`,
        pointerEvents: 'none',
        zIndex: 3,
      },

      [`&.${summaryStickyCls}`]: {
        position: 'sticky',
        zIndex: 4,
      },

      [`& > .${summaryInnerCls}`]: {
        display: 'grid',
        gridTemplateColumns: `var(${columnsWidthCssVar})`,
        boxSizing: 'border-box',
        overflow: 'auto hidden',
        scrollbarWidth: 'none',

        [`& > .${summaryRowCls}`]: {
          display: 'contents',
        },
      },
    },
  },
});

const genCellStyle = (
  {
    componentCls,
    rowSortingCls,
    headRowCls,
    bodyCls,
    bodyInnerCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    bodyRowCls,
    bodyHoverRowCls,
    bodyHoverCellCls,
    bodySortDraggingRowCls,
    bodySortDraggingOverlayRowCls,
    bodySortFirstRowCls,
    bodyExpandableRowCls,
    bodyExpandedRowCls,
    bodyExpandedRowCellCls,
    summaryRowCls,
    cellCls,
    filterCellCls,
    ellipsisCellCls,
    ellipsisCellInnerCls,
    dataSortCellInnerCls,
    dataSortContentCls,
    dataSortControlCls,
    rowSortCellCls,
    rowSortHandleCls,
    rowSortHandleDisabledCls,
    rowSortHandleDraggingCls,
    expandControlCls,
    expandTreeCellInnerCls,
    expandTreeCellInnerSpacedCls,
    expandTreeContentCls,
    headLastCellCls,
    headCellResizeHandleCls,
    headCellResizeHandleDisabledCls,
    headSortableCellCls,
    headDraggingOverlayCellCls,
    columnSortableActiveCellCls,
    columnSortableHotCellCls,
    previewHiddenCellCls,
    previewRestoredCellCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`.${headRowCls}`]: {
      [`& > .${cellCls}`]: {
        position: 'relative',
        backgroundColor: token.colorBgLayout,
        borderTop: `1px solid ${token.colorBorder}`,
      },
      [`&:first-child > .${cellCls}`]: {
        borderTopColor: 'transparent',
      },

      [`& > .${cellCls}:not(.${headLastCellCls})::before`]: {
        content: "' '",
        position: 'absolute',
        right: 0,
        insetBlock: unit(token.cellPaddingBlock),
        borderRight: `1px solid ${token.colorBorder}`,
      },

      [`.${headCellResizeHandleCls}`]: {
        position: 'absolute',
        top: 0,
        right: 0,
        insetBlock: unit(token.cellPaddingBlock),
        width: 10,
        backgroundColor: 'transparent',
        cursor: 'e-resize',
        userSelect: 'none',
      },
      [`.${headCellResizeHandleDisabledCls}`]: {
        cursor: 'default',
      },
      [`.${headSortableCellCls}`]: {
        userSelect: 'none',
      },
      [`.${headDraggingOverlayCellCls}`]: {
        paddingLeft: COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X * 1.75,
        paddingRight: COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X,
        boxSizing: 'border-box',
        fontSize: token.fontSize,
        color: token.colorText,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        border: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorBgContainer,
        borderRadius: token.cellBorderRadius,
        boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
        cursor: 'move',
      },
    },

    [`.${bodyRowCls}`]: {
      [`& > .${cellCls}`]: {
        backgroundColor: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorder}`,
      },
      [`&:first-child:not(.${bodySortDraggingRowCls}, .${bodySortDraggingOverlayRowCls}) > .${cellCls}`]:
        {
          borderTopColor: 'transparent',
        },

      [`&.${bodySortFirstRowCls} > .${cellCls}`]: {
        borderTopColor: 'transparent',
      },
      [`&.${bodySortDraggingRowCls} > .${cellCls}`]: {
        pointerEvents: 'none',
        opacity: 0.4,
      },
      [`&.${bodySortDraggingOverlayRowCls} > .${cellCls}`]: {
        borderTop: `1px solid ${token.colorBorder}`,
        borderBottom: `1px solid ${token.colorBorder}`,
        borderLeft: `1px solid ${token.colorBorder}`,

        '&:first-child': {
          borderTopLeftRadius: token.cellBorderRadius,
          borderBottomLeftRadius: token.cellBorderRadius,
        },

        '&:last-child': {
          borderRight: `1px solid ${token.colorBorder}`,
          borderTopRightRadius: token.cellBorderRadius,
          borderBottomRightRadius: token.cellBorderRadius,
        },
      },
    },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyRowCls}.${bodyHoverRowCls} > .${cellCls}`]:
      {
        backgroundColor: token.cellColorHoverBg,
        transition: 'background-color 0.3s',
      },
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyRowCls} > .${cellCls}.${bodyHoverCellCls}`]:
      {
        backgroundColor: token.cellColorHoverBg,
        transition: 'background-color 0.3s',
      },
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyRowCls}.${bodyHoverRowCls} > .${cellCls}`]:
      {
        backgroundColor: token.cellColorHoverBg,
      },
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyRowCls} > .${cellCls}.${bodyHoverCellCls}`]:
      {
        backgroundColor: token.cellColorHoverBg,
      },

    [`&.${rowSortingCls} .${bodyRowCls}:first-child:not(.${bodySortFirstRowCls}) > .${cellCls}`]:
      {
        borderTopColor: token.colorBorder,
      },
    [`&.${rowSortingCls} .${bodyRowCls} > .${cellCls}`]: {
      pointerEvents: 'none',
    },

    [`.${bodyExpandableRowCls}`]: {
      cursor: 'pointer',
    },

    [`.${bodyExpandedRowCls}`]: {
      [`& > .${bodyExpandedRowCellCls}`]: {
        position: 'sticky',
        left: 0,
      },
    },

    [`.${summaryRowCls} > .${cellCls}`]: {
      backgroundColor: token.colorBgLayout,
      borderTop: `1px solid ${token.colorBorder}`,
    },

    [`.${cellCls}`]: {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorText,
      paddingBlock: unit(token.cellPaddingBlock),
      paddingInline: unit(token.cellPaddingInline),
      alignContent: 'center',
      overflowWrap: 'break-word',
      boxSizing: 'border-box',
    },

    [`.${ellipsisCellCls} .${ellipsisCellInnerCls}:not(.${dataSortCellInnerCls}, .${expandTreeCellInnerCls})`]:
      {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      },

    [`.${dataSortCellInnerCls}`]: {
      display: 'flex',
      alignItems: 'center',
      minWidth: 0,
      gap: 8,
    },

    [`.${dataSortContentCls}`]: {
      flex: 1,
      minWidth: 0,
    },

    [`.${dataSortControlCls}`]: {
      display: 'flex',
      alignItems: 'center',
    },

    [`.${ellipsisCellCls} .${dataSortContentCls}`]: {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },

    [`.${filterCellCls}`]: {
      minWidth: 0,
    },

    [`.${columnSortableHotCellCls}`]: {
      backgroundColor: `${token.overableCellColorBg} !important`,
    },
    [`.${columnSortableActiveCellCls}`]: {
      backgroundColor: `${token.sortableCellColorBg} !important`,
    },
    [`.${previewHiddenCellCls}`]: {
      backgroundColor: `${token.previewHiddenCellColorBg} !important`,
    },
    [`.${previewRestoredCellCls}`]: {
      backgroundColor: `${token.previewRestoredCellColorBg} !important`,
    },

    [`.${rowSortCellCls}`]: {
      [`.${rowSortHandleCls}`]: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 'inherit',
        color: token.colorText,
        width: `calc(1em + 2px)`,
        height: `calc(1em + 2px)`,
        verticalAlign: -2,
        margin: 0,
        padding: 0,
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'grab',

        [`&:not(.${rowSortHandleDisabledCls}):active`]: {
          cursor: 'grabbing',
        },
      },

      [`.${rowSortHandleDisabledCls}`]: {
        cursor: 'not-allowed',
        opacity: 0.4,
      },

      [`.${rowSortHandleDraggingCls}`]: {
        cursor: 'grabbing',
      },
    },

    [`.${expandTreeCellInnerCls}`]: {
      display: 'flex',
      alignItems: 'center',
      minWidth: 0,
    },

    [`.${expandTreeCellInnerSpacedCls}`]: {
      gap: 8,
    },

    [`.${expandTreeContentCls}`]: {
      flex: 1,
      minWidth: 0,
    },

    [`.${ellipsisCellCls} .${expandTreeContentCls}`]: {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },

    [`.${expandControlCls}`]: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: 'inherit',
      color: token.colorText,
      width: `calc(1em + 2px)`,
      height: `calc(1em + 2px)`,
      verticalAlign: -2,
      margin: 0,
      padding: 0,
      border: `1px solid ${token.colorBorder}`,
      boxSizing: 'border-box',
      borderRadius: token.borderRadiusSM,
      backgroundColor: token.colorBgContainer,
      cursor: 'pointer',
    },

    [`.${expandControlCls}:disabled`]: {
      cursor: 'default',
      visibility: 'hidden',
    },
  },
});

const getFixedStartShadow = (token: TableComponentToken) =>
  `inset 10px 0 8px -8px ${token.fixedColumnShadowColor}`;

const getFixedEndShadow = (token: TableComponentToken) =>
  `inset -10px 0 8px -8px ${token.fixedColumnShadowColor}`;

const genFixedCellStyle = (
  {
    componentCls,
    pingStartCls,
    pingEndCls,
    headRowCls,
    bodyRowCls,
    bodySortDraggingRowCls,
    cellCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`.${headRowCls} .${fixedStartCellCls}, .${headRowCls} .${fixedEndCellCls}`]:
      {
        position: 'sticky',
        zIndex: 1,
      },
    [`.${fixedStartCellCls}, .${fixedEndCellCls}`]: {
      position: 'sticky',
      zIndex: 1,
    },

    [`.${bodyRowCls} .${fixedStartCellCls}, .${bodyRowCls} .${fixedEndCellCls}`]:
      {
        backgroundColor: token.colorBgContainer,
      },

    [`.${fixedStartLastCellCls}::after`]: {
      content: "' '",
      position: 'absolute',
      width: 30,
      // 单元格边框是顶部边框，宽度为1px，所以阴影距离需要加1px，避免出现1px的缝隙
      top: -1,
      bottom: 0,
      right: 0,
      transform: 'translateX(100%)',
      boxShadow: getFixedStartShadow(token),
      opacity: 0,
      transition: 'opacity 0.3s',
      pointerEvents: 'none',
    },

    [`.${fixedEndFirstCellCls}::after`]: {
      content: "' '",
      position: 'absolute',
      width: 30,
      // 单元格边框是顶部边框，宽度为1px，所以阴影距离需要加1px，避免出现1px的缝隙
      top: -1,
      bottom: 0,
      left: 0,
      transform: 'translateX(-100%)',
      boxShadow: getFixedEndShadow(token),
      opacity: 0,
      transition: 'opacity 0.3s',
      pointerEvents: 'none',
    },

    [`&.${pingStartCls}.${pingEndCls} .${bodyRowCls}.${bodySortDraggingRowCls} .${cellCls}.${fixedStartCellCls}`]:
      {
        opacity: 1,
      },
    [`&.${pingStartCls}.${pingEndCls} .${bodyRowCls}.${bodySortDraggingRowCls} .${cellCls}.${fixedEndCellCls}`]:
      {
        opacity: 1,
      },
    [`&.${pingStartCls} .${bodyRowCls}.${bodySortDraggingRowCls} .${cellCls}.${fixedStartCellCls}`]:
      {
        opacity: 1,
      },
    [`&.${pingEndCls} .${bodyRowCls}.${bodySortDraggingRowCls} .${cellCls}.${fixedEndCellCls}`]:
      {
        opacity: 1,
      },
  },
});

const genFixedShadowStyle = (
  {
    componentCls,
    hasFixStartColumnsCls,
    hasFixEndColumnsCls,
    fixColumnsGappedCls,
    pingStartCls,
    pingEndCls,
    hasXScrollbarCls,
    headRowCls,
    fixedStartLastCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndFirstCellCls,
    fixedEndShadowActiveCellCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}.${hasXScrollbarCls}`]: {
    '&::after': {
      content: "' '",
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '100%',
      pointerEvents: 'none',
      zIndex: 6,
    },
    [`&.${hasFixStartColumnsCls}.${hasFixEndColumnsCls}::after`]: {
      display: 'none',
    },

    [`&.${pingStartCls}::after`]: {
      boxShadow: getFixedStartShadow(token),
    },
    [`&.${pingEndCls}::after`]: {
      boxShadow: getFixedEndShadow(token),
    },
    [`&.${pingStartCls}.${pingEndCls}::after`]: {
      boxShadow: `${getFixedEndShadow(token)}, ${getFixedStartShadow(token)}`,
    },

    [`&.${hasFixStartColumnsCls}:not(.${hasFixEndColumnsCls}).${pingStartCls}:not(.${pingEndCls})::after`]:
      {
        boxShadow: 'none',
      },
    [`&.${hasFixStartColumnsCls}:not(.${hasFixEndColumnsCls}).${pingStartCls}.${pingEndCls}::after`]:
      {
        boxShadow: getFixedEndShadow(token),
      },
    [`&.${hasFixEndColumnsCls}:not(.${hasFixStartColumnsCls}).${pingEndCls}:not(.${pingStartCls})::after`]:
      {
        boxShadow: 'none',
      },
    [`&.${hasFixEndColumnsCls}:not(.${hasFixStartColumnsCls}).${pingStartCls}.${pingEndCls}::after`]:
      {
        boxShadow: getFixedStartShadow(token),
      },

    [`&.${pingStartCls}:not(.${fixColumnsGappedCls}) .${fixedStartLastCellCls}::after`]:
      {
        opacity: 1,
      },
    [`&.${pingEndCls}:not(.${fixColumnsGappedCls}) .${fixedEndFirstCellCls}::after`]:
      {
        opacity: 1,
      },
    [`.${fixedStartShadowActiveCellCls}::after`]: {
      opacity: 1,
    },
    [`.${fixedEndShadowActiveCellCls}::after`]: {
      opacity: 1,
    },

    // 左侧最后一列固定列在显示阴影时不显示伪元素border
    [`&.${pingStartCls} .${headRowCls} .${fixedStartLastCellCls}::before`]: {
      display: 'none',
    },
    [`.${headRowCls} .${fixedStartShadowActiveCellCls}::before`]: {
      display: 'none',
    },
  },
});

const genSizeClsStyle = (
  {
    componentCls,
    componentSMCls,
    componentMDCls,
    headCls,
    headInnerCls,
    headRowCls,
    bodyCls,
    bodyInnerCls,
    bodyRowCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    summaryCls,
    summaryInnerCls,
    summaryRowCls,
    headLastCellCls,
    headCellResizeHandleCls,
    cellCls,
    noDataCellContentCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => {
  const currentHeadRowSelector = getCurrentHeadRowSelector({
    headCls,
    headInnerCls,
    headRowCls,
  } as ComponentClsType);
  const currentBodyCellSelector = appendCurrentBodyRowSelector(
    {
      bodyCls,
      bodyInnerCls,
      bodyRowCls,
      bodyVirtualFillerCls,
      bodyVirtualInnerCls,
    } as ComponentClsType,
    ` > .${cellCls}`,
  );
  const currentSummaryRowSelector = getCurrentSummaryRowSelector({
    summaryCls,
    summaryInnerCls,
    summaryRowCls,
  } as ComponentClsType);
  const currentCellSelector = `${currentHeadRowSelector} > .${cellCls}, ${currentBodyCellSelector}, ${currentSummaryRowSelector} > .${cellCls}`;

  return {
    [`.${componentCls}.${componentSMCls}`]: {
      [`${currentHeadRowSelector} > .${cellCls}:not(.${headLastCellCls})::before`]:
        {
          insetBlock: unit(token.cellPaddingBlockSM),
        },

      [`${currentHeadRowSelector} .${headCellResizeHandleCls}`]: {
        insetBlock: unit(token.cellPaddingBlockSM),
      },

      [currentCellSelector]: {
        paddingBlock: unit(token.cellPaddingBlockSM),
        paddingInline: unit(token.cellPaddingInlineSM),
      },

      [currentBodyCellSelector]: {
        [`.${noDataCellContentCls}`]: {
          marginInline: unit(-token.cellPaddingInlineSM),
        },
      },
    },

    [`.${componentCls}.${componentMDCls}`]: {
      [`${currentHeadRowSelector} > .${cellCls}:not(.${headLastCellCls})::before`]:
        {
          insetBlock: unit(token.cellPaddingBlockMD),
        },

      [`${currentHeadRowSelector} .${headCellResizeHandleCls}`]: {
        insetBlock: unit(token.cellPaddingBlockMD),
      },

      [currentCellSelector]: {
        paddingBlock: unit(token.cellPaddingBlockMD),
        paddingInline: unit(token.cellPaddingInlineMD),
      },

      [currentBodyCellSelector]: {
        [`.${noDataCellContentCls}`]: {
          marginInline: unit(-token.cellPaddingInlineMD),
        },
      },
    },
  };
};

const genStripeClsStyle = (
  {
    componentCls,
    stripeCls,
    bodyCls,
    bodyInnerCls,
    bodyStripeRowCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    cellCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}.${stripeCls}`]: {
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyStripeRowCls} > .${cellCls}, & > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyStripeRowCls} > .${cellCls}`]:
      {
        backgroundColor: token.colorBgLayout,
      },
  },
});

const genEmptyClsStyle = (
  { componentCls, noDataCls, noDataCellContentCls }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}.${noDataCls} .${noDataCellContentCls}`]: {
    position: 'sticky',
    left: 0,
    marginInline: unit(-token.cellPaddingInline),
  },
});

const genNestStyles = (
  clsObj: ComponentClsType,
  scrollbarClsObj: ScrollbarClsType,
  cssVar: CssVarType,
  mergedToken: TableComponentToken,
): CSSInterpolation => [
  genInitialStyle(clsObj),
  genPlaceholderStyle(clsObj, mergedToken),
  genComponentStyle(clsObj),
  genVirtualStyle(clsObj, cssVar),
  genFixedShadowStyle(clsObj, mergedToken),
  genSizeClsStyle(clsObj, mergedToken),
  genBorderedStyle(clsObj, mergedToken),
  genStripeClsStyle(clsObj, mergedToken),
  genEmptyClsStyle(clsObj, mergedToken),
  // content style
  genHeadStyle(clsObj, mergedToken, cssVar),
  genBodyStyle(clsObj, mergedToken, cssVar),
  genSummaryCls(clsObj, mergedToken, cssVar),
  genCellStyle(clsObj, mergedToken),
  genFixedCellStyle(clsObj, mergedToken),
  // scrollbar style
  genScrollbarInitialStyle(clsObj, scrollbarClsObj),
  genScrollBarStyle(clsObj, scrollbarClsObj, mergedToken),
];

const getTokenPathKey = (token: Partial<TableComponentToken>) =>
  Object.keys(token)
    .sort()
    .map((key) => `${key}:${token[key as keyof TableComponentToken]}`)
    .join(';');

export const useStyles = () => {
  const prefixCls = usePrefixClsContext();
  const [theme, token, hashId, realToken, isDark, cssVar, components] =
    useToken();

  const clsObj = useMemo(() => getComponentCls(prefixCls), [prefixCls]);
  const scrollbarClsObj = useMemo(
    () => getScrollbarCls(prefixCls),
    [prefixCls],
  );

  const componentCssVar = useMemo(() => getCssVar(prefixCls), [prefixCls]);

  const tableToken = components?.Table;
  const componentBaseToken = useMemo(
    () => ({
      ...realToken,
      ...tableToken,
    }),
    [realToken, tableToken],
  );
  const defaultTableToken = useMemo(
    () => prepareTableToken(componentBaseToken, isDark),
    [componentBaseToken, isDark],
  );
  const mergedComponentToken = useMemo(
    () => ({
      ...defaultTableToken,
      ...tableToken,
    }),
    [defaultTableToken, tableToken],
  );

  const componentTokenKey = useMemo(
    () => getTokenPathKey(mergedComponentToken),
    [mergedComponentToken],
  );

  const [cssVarToken] = useCSSVarRegister(
    {
      path: [prefixCls, componentTokenKey],
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
    () => mergedComponentToken,
  );

  const mergedToken = useMemo(
    () => ({
      ...token,
      ...((cssVar?.key
        ? cssVarToken
        : mergedComponentToken) as TableComponentToken),
    }),
    [token, cssVar?.key, cssVarToken, mergedComponentToken],
  );

  useStyleRegister(
    { theme, token, hashId, path: [prefixCls, `${isDark}`, componentTokenKey] },
    () => genNestStyles(clsObj, scrollbarClsObj, componentCssVar, mergedToken),
  );

  return {
    hashId,
    cssVarCls: cssVar?.key,
  };
};
