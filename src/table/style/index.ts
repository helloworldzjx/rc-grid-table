import {
  unit,
  useStyleRegister,
  type CSSInterpolation,
} from '@ant-design/cssinjs';
import { theme as antdTheme } from 'antd';
import { useMemo } from 'react';

import { useConfig } from '../../configProvider/context';
import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { prepareTableToken, type TableComponentToken } from '../design';
import { COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X } from '../utils/const';
import {
  ComponentClsType,
  CssVarType,
  getComponentCls,
  getCssVar,
  getScrollbarCls,
  ScrollbarClsType,
} from './classNames';
import { genScrollBarStyle, genScrollbarToggleStyle } from './scrollbarStyle';

const genInitialStyle = ({
  wrapperCls,
  wrapperReadySkeletonCls,
  wrapperInitializedCls,
  spinReadySkeletonWrapperCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${wrapperCls}`]: {
    visibility: 'hidden',
    pointerEvents: 'none',

    [`&.${wrapperReadySkeletonCls}`]: {
      position: 'relative',
      visibility: 'visible',
      pointerEvents: 'auto',

      [`& > .${spinReadySkeletonWrapperCls}`]: {
        visibility: 'hidden',
        pointerEvents: 'none',
      },
    },

    [`&.${wrapperInitializedCls}`]: {
      visibility: 'visible',
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
      backgroundColor: token.placeholderBg,
      transition: 'background-color 0.3s',
      userSelect: 'none',
      zIndex: 8,

      [`&:not(.${placeholderDisabledCls}):hover`]: {
        backgroundColor: token.cellHoverBg,
      },

      [`&:not(.${placeholderDisabledCls}):active`]: {
        backgroundColor: token.cellActiveBg,
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

const genSkeletonStyle = ({
  componentCls,
  readySkeletonCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${componentCls}.${readySkeletonCls}`]: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
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
    bodyVirtualPreservedRowCls,
    bodyVirtualRowSpanRowCls,
    bodyVirtualRowSpanTopRowCls,
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

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyVirtualPreservedRowCls}`]:
      {
        position: 'absolute',
        insetInline: 0,
        top: 0,
        display: 'grid',
        gridTemplateColumns: `var(${columnsWidthCssVar})`,
      },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyVirtualRowSpanRowCls}`]:
      {
        position: 'absolute',
        insetInline: 0,
        top: 0,
        pointerEvents: 'none',

        [`& > .${cellCls}`]: {
          pointerEvents: 'auto',
        },
      },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyVirtualRowSpanTopRowCls} > .${cellCls}`]:
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
    fixedStartShadowCls,
    fixedEndShadowCls,
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
        border: `1px solid ${token.borderColor}`,
        borderRadius: token.borderRadius,
        pointerEvents: 'none',
        zIndex: 5,
      },

      [`& > .${placeholderCls}`]: {
        border: `1px solid ${token.borderColor}`,
        borderTopRightRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },

      [`&.${hasXScrollbarCls}`]: {
        [`.${fixedStartShadowCls}`]: {
          borderTopLeftRadius: token.borderRadius,
          borderBottomLeftRadius: token.borderRadius,
        },
        [`.${fixedEndShadowCls}`]: {
          borderTopRightRadius: token.borderRadius,
          borderBottomRightRadius: token.borderRadius,
        },
      },

      [`& > .${headCls}`]: {
        '&::before': {
          // 使用outline替代border，避免sticky情况下border叠加导致的宽度问题
          borderBottomColor: 'transparent',
          outline: `1px solid ${token.borderColor}`,
          outlineOffset: -1,
          borderTopLeftRadius: token.borderRadius,
          borderTopRightRadius: token.borderRadius,
        },

        [`& > .${headInnerCls}`]: {
          borderTopLeftRadius: token.borderRadius,
          borderTopRightRadius: token.borderRadius,
        },
      },

      [`${currentHeadRowSelector} .${headCellResizeHandleCls}`]: {
        insetBlock: 0,
      },

      [`& > .${bodyCls}::before`]: {
        borderBottomLeftRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },
      [`&:not(.${hasSummaryCls}) > .${bodyCls} > .${bodyInnerCls}`]: {
        borderBottomLeftRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },

      [`& > .${summaryCls}`]: {
        '&::before': {
          // 使用outline替代border，避免sticky情况下border叠加导致的宽度问题
          borderBottomColor: 'transparent',
          outline: `1px solid ${token.borderColor}`,
          outlineOffset: -1,
          borderBottomLeftRadius: token.borderRadius,
          borderBottomRightRadius: token.borderRadius,
        },

        [`& > .${summaryInnerCls}`]: {
          borderBottomLeftRadius: token.borderRadius,
          borderBottomRightRadius: token.borderRadius,
        },
      },

      [`${currentHeadRowSelector} > .${cellCls}::before`]: {
        display: 'none',
      },

      [`${currentHeadRowSelector} > .${cellCls}, ${currentBodyCellSelector}, ${currentSummaryRowSelector} > .${cellCls}`]:
        {
          borderLeft: `1px solid ${token.borderColor}`,
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
    headReadySkeletonInnerCls,
    headRowCls,
  }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar, readySkeletonHeadRowHeightCssVar }: CssVarType,
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
        borderBottom: `1px solid ${token.borderColor}`,
        pointerEvents: 'none',
        zIndex: 6,
      },

      [`&.${headStickyCls}`]: {
        position: 'sticky',
        zIndex: 7,
      },

      [`& > .${headInnerCls}`]: {
        display: 'grid',
        gridTemplateColumns: `var(${columnsWidthCssVar})`,
        overflow: 'auto hidden',
        scrollbarWidth: 'none',

        [`&.${headReadySkeletonInnerCls}`]: {
          gridTemplateRows: `var(${readySkeletonHeadRowHeightCssVar})`,
        },

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
    bodyReadySkeletonInnerCls,
    bodyRowCls,
    bodyGridRowCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    bodySortDraggingOverlayRowCls,
  }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar, readySkeletonBodyRowsHeightCssVar }: CssVarType,
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
        borderBottom: `1px solid ${token.borderColor}`,
        pointerEvents: 'none',
        zIndex: 6,
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

      [`&.${bodyReadySkeletonInnerCls}`]: {
        gridTemplateRows: `var(${readySkeletonBodyRowsHeightCssVar})`,
      },

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
      borderRadius: token.borderRadius,
      boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
      outline: `1px solid ${token.borderColor}`,
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
        borderBottom: `1px solid ${token.borderColor}`,
        pointerEvents: 'none',
        zIndex: 6,
      },

      [`&.${summaryStickyCls}`]: {
        position: 'sticky',
        zIndex: 7,
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
    fixedStartCellCls,
    fixedEndCellCls,
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
        backgroundColor: token.cellStrongBg,
        fontWeight: 500,
        borderTop: `1px solid ${token.borderColor}`,
      },
      [`&:first-child > .${cellCls}`]: {
        borderTopColor: 'transparent',
      },

      [`& > .${cellCls}:not(.${headLastCellCls})::before`]: {
        content: "' '",
        position: 'absolute',
        right: 0,
        insetBlock: unit(token.cellPaddingBlock),
        borderRight: `1px solid ${token.borderColor}`,
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
        border: `1px solid ${token.borderColor}`,
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadius,
        boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
        cursor: 'move',
      },
    },

    [`.${bodyRowCls}`]: {
      [`& > .${cellCls}`]: {
        backgroundColor: token.colorBgContainer,
        borderTop: `1px solid ${token.borderColor}`,
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
        borderTop: `1px solid ${token.borderColor}`,
        borderBottom: `1px solid ${token.borderColor}`,
        borderLeft: `1px solid ${token.borderColor}`,

        '&:first-child': {
          borderTopLeftRadius: token.borderRadius,
          borderBottomLeftRadius: token.borderRadius,
        },

        [`&:last-child`]: {
          borderRight: `1px solid ${token.borderColor}`,
          borderTopRightRadius: token.borderRadius,
          borderBottomRightRadius: token.borderRadius,
        },
      },
    },

    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyRowCls}.${bodyHoverRowCls} > .${cellCls}`]:
      {
        backgroundColor: token.cellHoverBg,
        transition: 'background-color 0.3s',
      },
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyRowCls} > .${cellCls}.${bodyHoverCellCls}`]:
      {
        backgroundColor: token.cellHoverBg,
        transition: 'background-color 0.3s',
      },
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyRowCls}.${bodyHoverRowCls} > .${cellCls}`]:
      {
        backgroundColor: token.cellHoverBg,
      },
    [`& > .${bodyCls} > .${bodyInnerCls} > .${bodyVirtualFillerCls} > .${bodyVirtualInnerCls} > .${bodyRowCls} > .${cellCls}.${bodyHoverCellCls}`]:
      {
        backgroundColor: token.cellHoverBg,
      },

    [`&.${rowSortingCls} .${bodyRowCls}:first-child:not(.${bodySortFirstRowCls}) > .${cellCls}`]:
      {
        borderTopColor: token.borderColor,
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
      backgroundColor: token.cellStrongBg,
      borderTop: `1px solid ${token.borderColor}`,
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
      backgroundColor: `${token.overableCellBg} !important`,
    },
    [`.${columnSortableActiveCellCls}`]: {
      zIndex: '2 !important',
      backgroundColor: `${token.sortableCellBg} !important`,
    },
    [`.${fixedStartCellCls}.${columnSortableActiveCellCls}, .${fixedEndCellCls}.${columnSortableActiveCellCls}`]:
      {
        zIndex: '4 !important',
      },
    [`.${previewHiddenCellCls}`]: {
      backgroundColor: `${token.previewHiddenCellBg} !important`,
    },
    [`.${previewRestoredCellCls}`]: {
      backgroundColor: `${token.previewRestoredCellBg} !important`,
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
      border: `1px solid ${token.borderColor}`,
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
    previewColumnsSortingCls,
    pingStartCls,
    pingEndCls,
    headRowCls,
    bodyRowCls,
    bodySortDraggingRowCls,
    cellCls,
    bodyVirtualRowSpanPlaceholderCellCls,
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
    [`&.${previewColumnsSortingCls} .${headRowCls} .${fixedStartCellCls}, &.${previewColumnsSortingCls} .${headRowCls} .${fixedEndCellCls}`]:
      {
        position: 'sticky',
        zIndex: 3,
      },
    [`&.${previewColumnsSortingCls} .${fixedStartCellCls}, &.${previewColumnsSortingCls} .${fixedEndCellCls}`]:
      {
        position: 'sticky',
        zIndex: 3,
      },

    [`.${bodyRowCls} .${fixedStartCellCls}, .${bodyRowCls} .${fixedEndCellCls}`]:
      {
        backgroundColor: token.colorBgContainer,
      },

    [`.${fixedStartLastCellCls}:not(.${bodyVirtualRowSpanPlaceholderCellCls})::after`]:
      {
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

    [`.${fixedEndFirstCellCls}:not(.${bodyVirtualRowSpanPlaceholderCellCls})::after`]:
      {
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

    // 行拖拽时，固定列透明度恢复为 1，避免显示下方内容
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
    hasXScrollbarCls,
    fixColumnsGappedCls,
    pingStartCls,
    pingEndCls,
    fixedStartShadowCls,
    fixedStartShadowActiveCls,
    fixedEndShadowCls,
    fixedEndShadowActiveCls,
    headRowCls,
    bodyRowCls,
    summaryRowCls,
    cellCls,
    headLastCellCls,
    fixedStartCellCls,
    fixedStartLastCellCls,
    fixedEndCellCls,
    fixedEndFirstCellCls,
    fixedStartShadowActiveCellCls,
    fixedEndShadowActiveCellCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}.${hasXScrollbarCls}`]: {
    [`.${fixedStartShadowCls}, .${fixedEndShadowCls}`]: {
      display: 'none',
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%',
      pointerEvents: 'none',
      zIndex: 9,
    },
    [`.${fixedStartShadowCls}`]: {
      left: 0,
      boxShadow: getFixedStartShadow(token),
    },
    [`.${fixedEndShadowCls}`]: {
      right: 0,
      boxShadow: getFixedEndShadow(token),
    },

    [`.${fixedStartShadowCls}.${fixedStartShadowActiveCls}`]: {
      display: 'block',
    },
    [`.${fixedEndShadowCls}.${fixedEndShadowActiveCls}`]: {
      display: 'block',
    },

    [`&.${pingStartCls}:not(.${fixColumnsGappedCls}) .${fixedStartLastCellCls}::after`]:
      {
        opacity: 1,
      },
    [`&.${pingEndCls}:not(.${fixColumnsGappedCls}) .${fixedEndFirstCellCls}::after`]:
      {
        opacity: 1,
      },
    [`.${fixedStartCellCls}.${fixedStartShadowActiveCellCls}::after`]: {
      opacity: 1,
    },
    [`.${fixedEndCellCls}.${fixedEndShadowActiveCellCls}::after`]: {
      opacity: 1,
    },

    // 左侧最后一列固定列在显示阴影时不显示伪元素border
    [`&.${pingStartCls} .${headRowCls} .${fixedStartLastCellCls}::before`]: {
      display: 'none',
    },
    [`.${headRowCls} .${fixedStartShadowActiveCellCls}::before`]: {
      display: 'none',
    },

    // 最后一列如果是start固定列则不显示boxShadow
    [`.${headRowCls} .${headLastCellCls}.${fixedStartCellCls}::after`]: {
      display: 'none',
    },
    [`.${bodyRowCls} .${cellCls}:last-child.${fixedStartCellCls}::after`]: {
      display: 'none',
    },
    [`.${summaryRowCls} .${cellCls}:last-child.${fixedStartCellCls}::after`]: {
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
        backgroundColor: token.cellStripeBg,
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
  genSkeletonStyle(clsObj),
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
  genScrollbarToggleStyle(clsObj, scrollbarClsObj),
  genScrollBarStyle(clsObj, scrollbarClsObj, mergedToken),
];

const getTokenPathKey = (token: Partial<TableComponentToken>) =>
  Object.keys(token)
    .sort()
    .map((key) => `${key}:${token[key as keyof TableComponentToken]}`)
    .join(';');

export const useStyles = () => {
  const prefixCls = usePrefixClsContext();
  const { gridTable } = useConfig();
  const { theme, token, hashId } = antdTheme.useToken();

  const clsObj = useMemo(() => getComponentCls(prefixCls), [prefixCls]);
  const scrollbarClsObj = useMemo(
    () => getScrollbarCls(prefixCls),
    [prefixCls],
  );

  const componentCssVar = useMemo(() => getCssVar(prefixCls), [prefixCls]);

  const componentBaseToken = useMemo(
    () => ({
      ...token,
      ...gridTable?.token,
    }),
    [gridTable?.token, token],
  );
  const defaultTableToken = useMemo(
    () => prepareTableToken(componentBaseToken),
    [componentBaseToken],
  );
  const mergedComponentToken = useMemo(
    () => ({
      ...defaultTableToken,
      ...gridTable?.token,
    }),
    [defaultTableToken, gridTable?.token],
  );

  const componentTokenKey = useMemo(
    () => getTokenPathKey(mergedComponentToken),
    [mergedComponentToken],
  );

  const mergedToken = useMemo(
    () => ({
      ...token,
      ...mergedComponentToken,
    }),
    [mergedComponentToken, token],
  );

  useStyleRegister(
    { theme, token, hashId, path: [prefixCls, componentTokenKey] },
    () => genNestStyles(clsObj, scrollbarClsObj, componentCssVar, mergedToken),
  );

  return {
    hashId,
    cssVarCls: undefined,
  };
};
