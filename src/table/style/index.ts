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
import {
  genScrollBarStyle,
  genScrollbarToggleShowStyle,
} from './scrollbarStyle';

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
      zIndex: 4,

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

const genVirtualStyle = (
  {
    componentCls,
    virtualCls,
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
    [`.${bodyVirtualFillerCls}`]: {
      position: 'relative',
      gridColumn: '1 / -1',
      width: `max(100%, var(${columnsWidthTotalCssVar}))`,
      minHeight: '100%',
    },

    [`.${bodyVirtualInnerCls}`]: {
      position: 'absolute',
      insetInline: 0,
      top: 0,
      display: 'grid',
      gridTemplateColumns: `var(${columnsWidthCssVar})`,
    },

    [`.${bodyVirtualRowSpanCls}`]: {
      position: 'absolute',
      insetInline: 0,
      top: 0,
      pointerEvents: 'none',

      [`.${cellCls}`]: {
        pointerEvents: 'auto',
      },
    },

    [`.${bodyVirtualPreservedCls}`]: {
      position: 'absolute',
      insetInline: 0,
      top: 0,
      display: 'grid',
      gridTemplateColumns: `var(${columnsWidthCssVar})`,
    },

    [`.${bodyVirtualRowSpanTopCls} .${cellCls}`]: {
      borderTopColor: 'transparent',
    },

    [`.${bodyFixedHeightRowCls}`]: {
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
    cellCls,
    pingStartCls,
    pingEndCls,
    headCellResizeHandleCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
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
      borderRadius: token.borderRadius,
      pointerEvents: 'none',
      zIndex: 4,
    },

    [`.${placeholderCls}`]: {
      border: `1px solid ${token.colorBorder}`,
      borderTopRightRadius: token.borderRadius,
      borderBottomRightRadius: token.borderRadius,
    },

    [`&.${hasXScrollbarCls}`]: {
      [`&.${pingStartCls}::after`]: {
        borderTopLeftRadius: token.borderRadius,
        borderBottomLeftRadius: token.borderRadius,
      },
      [`&.${pingEndCls}::after`]: {
        borderTopRightRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },
      [`&.${pingStartCls}.${pingEndCls}::after`]: {
        borderRadius: token.borderRadius,
      },
    },

    [`.${headCls}`]: {
      '&::before': {
        // 使用outline替代border，避免sticky情况下border叠加导致的宽度问题
        borderBottomColor: 'transparent',
        outline: `1px solid ${token.colorBorder}`,
        outlineOffset: -1,
        borderTopLeftRadius: token.borderRadius,
        borderTopRightRadius: token.borderRadius,
      },

      [`.${headInnerCls}`]: {
        borderTopLeftRadius: token.borderRadius,
        borderTopRightRadius: token.borderRadius,
      },

      [`.${headRowCls} .${headCellResizeHandleCls}`]: {
        insetBlock: 0,
      },
    },

    [`.${bodyCls}::before`]: {
      borderBottomLeftRadius: token.borderRadius,
      borderBottomRightRadius: token.borderRadius,
    },
    [`&:not(.${hasSummaryCls}) .${bodyCls} .${bodyInnerCls}`]: {
      borderBottomLeftRadius: token.borderRadius,
      borderBottomRightRadius: token.borderRadius,
    },

    [`.${summaryCls}`]: {
      '&::before': {
        // 使用outline替代border，避免sticky情况下border叠加导致的宽度问题
        borderBottomColor: 'transparent',
        outline: `1px solid ${token.colorBorder}`,
        outlineOffset: -1,
        borderBottomLeftRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },

      [`.${summaryInnerCls}`]: {
        borderBottomLeftRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },
    },

    [`.${headRowCls} .${cellCls}::before`]: {
      display: 'none',
    },

    [`.${cellCls}`]: {
      borderLeft: `1px solid ${token.colorBorder}`,
    },
  },
});

const genHeadStyle = (
  { headCls, headStickyCls, headInnerCls, headRowCls }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar }: CssVarType,
): CSSInterpolation => ({
  [`.${headCls}`]: {
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
      zIndex: 2,
    },

    [`&.${headStickyCls}`]: {
      position: 'sticky',
      zIndex: 3,
    },

    [`.${headInnerCls}`]: {
      display: 'grid',
      gridTemplateColumns: `var(${columnsWidthCssVar})`,
      overflow: 'auto hidden',
      scrollbarWidth: 'none',
    },

    [`.${headRowCls}`]: {
      display: 'contents',
    },
  },
});

const genBodyStyle = (
  {
    hasSummaryCls,
    bodyCls,
    bodyInnerCls,
    bodyRowCls,
    bodyGridRowCls,
    bodySortDraggingOverlayRowCls,
  }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar }: CssVarType,
): CSSInterpolation => ({
  [`.${bodyCls}`]: {
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
      zIndex: 2,
    },
  },

  [`&.${hasSummaryCls} .${bodyCls}::before`]: {
    display: 'none',
  },

  [`.${bodyInnerCls}`]: {
    display: 'grid',
    gridTemplateColumns: `var(${columnsWidthCssVar})`,
    boxSizing: 'border-box',
    overflow: 'auto',
    scrollbarWidth: 'none',

    [`.${bodyRowCls}`]: {
      display: 'contents',
    },

    [`.${bodyGridRowCls}`]: {
      display: 'grid',
      gridTemplateColumns: `var(${columnsWidthCssVar})`,
      gridColumn: '1 / -1',
    },
  },

  [`.${bodyRowCls}.${bodySortDraggingOverlayRowCls}`]: {
    borderRadius: token.borderRadius,
    boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
    outline: `1px solid ${token.colorBorder}`,
    outlineOffset: -1,
    pointerEvents: 'none',
  },
});

const genSummaryCls = (
  {
    summaryCls,
    summaryStickyCls,
    summaryInnerCls,
    summaryRowCls,
  }: ComponentClsType,
  token: TableComponentToken,
  { columnsWidthCssVar }: CssVarType,
): CSSInterpolation => ({
  [`.${summaryCls}`]: {
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
      zIndex: 2,
    },

    [`&.${summaryStickyCls}`]: {
      position: 'sticky',
      zIndex: 3,
    },

    [`.${summaryInnerCls}`]: {
      display: 'grid',
      gridTemplateColumns: `var(${columnsWidthCssVar})`,
      boxSizing: 'border-box',
      overflow: 'auto hidden',
      scrollbarWidth: 'none',
    },

    [`.${summaryRowCls}`]: {
      display: 'contents',
    },
  },
});

const genCellStyle = (
  {
    rowSortingCls,
    headRowCls,
    bodyRowCls,
    bodySortDraggingRowCls,
    bodySortDraggingOverlayRowCls,
    bodySortFirstRowCls,
    bodyExpandableRowCls,
    summaryRowCls,
    cellCls,
    filterCellCls,
    noDataCellCls,
    ellipsisCellCls,
    ellipsisCellInnerCls,
    dataSortCellInnerCls,
    dataSortContentCls,
    dataSortControlCls,
    expandControlCls,
    rowSortHandleCls,
    rowSortHandleDisabledCls,
    rowSortHandleDraggingCls,
    rowSortControlCls,
    selectionControlCls,
    selectionControlInputCls,
    selectionControlContentCls,
    selectionCheckboxCls,
    selectionRadioCls,
    selectionControlCheckedCls,
    selectionControlIndeterminateCls,
    selectionControlDisabledCls,
    expandIconCls,
    expandIconExpandedCls,
    expandIconSpacedCls,
    expandTreeCellInnerCls,
    expandedRowCls,
    expandedRowCellCls,
    expandedRowContentCls,
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
  [`.${headRowCls}`]: {
    [`.${cellCls}`]: {
      position: 'relative',
      backgroundColor: token.colorBgLayout,
      borderTop: `1px solid ${token.colorBorder}`,
    },
    [`&:first-child .${cellCls}`]: {
      borderTopColor: 'transparent',
    },

    [`.${cellCls}:not(.${headLastCellCls})::before`]: {
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
    },
    [`.${headCellResizeHandleDisabledCls}`]: {
      cursor: 'default',
    },
    [`.${headSortableCellCls}`]: {
      userSelect: 'none',
    },
    [`.${headDraggingOverlayCellCls}`]: {
      paddingLeft: COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X * 1.5,
      paddingRight: COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X,
      boxSizing: 'border-box',
      fontSize: token.fontSize,
      color: token.colorText,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      border: `1px solid ${token.colorBorder}`,
      backgroundColor: token.colorBgContainer,
      borderRadius: token.borderRadius,
      boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
      cursor: 'move',
    },
  },

  [`.${bodyRowCls}`]: {
    [`.${cellCls}`]: {
      backgroundColor: token.colorBgContainer,
      borderTop: `1px solid ${token.colorBorder}`,
    },
    [`&:first-child:not(.${bodySortDraggingRowCls}, .${bodySortDraggingOverlayRowCls}) .${cellCls}`]:
      {
        borderTopColor: 'transparent',
      },

    [`&:hover .${cellCls}:not(.${noDataCellCls})`]: {
      backgroundColor: token.cellColorHoverBg,
      transition: 'background-color 0.3s',
    },

    [`&.${bodySortFirstRowCls} .${cellCls}`]: {
      borderTopColor: 'transparent',
    },
    [`&.${bodySortDraggingRowCls} .${cellCls}`]: {
      pointerEvents: 'none',
      opacity: 0.4,
    },
    [`&.${bodySortDraggingOverlayRowCls} .${cellCls}`]: {
      borderTop: `1px solid ${token.colorBorder}`,
      borderBottom: `1px solid ${token.colorBorder}`,
      borderLeft: `1px solid ${token.colorBorder}`,

      '&:first-child': {
        borderTopLeftRadius: token.borderRadius,
        borderBottomLeftRadius: token.borderRadius,
      },

      '&:last-child': {
        borderRight: `1px solid ${token.colorBorder}`,
        borderTopRightRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },
    },
  },

  [`&.${rowSortingCls} .${bodyRowCls}:first-child:not(.${bodySortFirstRowCls}) .${cellCls}`]:
    {
      borderTopColor: token.colorBorder,
    },
  [`&.${rowSortingCls} .${bodyRowCls} .${cellCls}`]: {
    pointerEvents: 'none',
  },

  [`.${bodyExpandableRowCls}`]: {
    cursor: 'pointer',
  },

  [`.${expandedRowCls}`]: {
    [`.${expandedRowCellCls}`]: {
      position: 'sticky',
      left: 0,
      padding: 0,
    },

    [`.${expandedRowContentCls}`]: {
      paddingBlock: unit(token.cellPaddingBlock),
      paddingInline: unit(token.cellPaddingInline),
      boxSizing: 'border-box',
    },
  },

  // [`.${summaryRowCls}:not(:last-of-type) .${cellCls}`]: {
  [`.${summaryRowCls} .${cellCls}`]: {
    backgroundColor: token.colorBgLayout,
    borderTop: `1px solid ${token.colorBorder}`,
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

  [`.${ellipsisCellCls} .${ellipsisCellInnerCls}:not(.${dataSortCellInnerCls})`]:
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

  [`.${selectionControlCls}`]: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: 0,
    padding: 0,
    cursor: 'pointer',
    userSelect: 'none',
  },

  [`.${selectionControlInputCls}`]: {
    position: 'relative',
    flex: '0 0 16px',
    width: 16,
    height: 16,
    border: `1px solid ${token.colorBorder}`,
    backgroundColor: token.colorBgContainer,
    color: token.colorBgContainer,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background-color 0.2s',
  },

  [`.${selectionControlInputCls} > input`]: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    opacity: 0,
    pointerEvents: 'none',
  },

  [`.${selectionControlContentCls}`]: {
    minWidth: 0,
  },

  [`.${selectionCheckboxCls} .${selectionControlInputCls}`]: {
    borderRadius: 2,
  },

  [`.${selectionRadioCls} .${selectionControlInputCls}`]: {
    borderRadius: '50%',
  },

  [`.${selectionCheckboxCls}.${selectionControlCheckedCls} .${selectionControlInputCls}, .${selectionCheckboxCls}.${selectionControlIndeterminateCls} .${selectionControlInputCls}, .${selectionRadioCls}.${selectionControlCheckedCls} .${selectionControlInputCls}`]:
    {
      borderColor: token.colorPrimary,
      backgroundColor: token.colorPrimary,
    },

  [`.${selectionCheckboxCls}.${selectionControlCheckedCls} .${selectionControlInputCls}::after`]:
    {
      content: "' '",
      position: 'absolute',
      left: 4,
      top: 1,
      width: 5,
      height: 9,
      border: `solid ${token.colorTextLightSolid}`,
      borderWidth: '0 2px 2px 0',
      transform: 'rotate(45deg)',
    },

  [`.${selectionCheckboxCls}.${selectionControlIndeterminateCls} .${selectionControlInputCls}::after`]:
    {
      content: "' '",
      position: 'absolute',
      left: 3,
      right: 3,
      top: 6,
      height: 2,
      backgroundColor: token.colorTextLightSolid,
    },

  [`.${selectionRadioCls}.${selectionControlCheckedCls} .${selectionControlInputCls}::after`]:
    {
      content: "' '",
      position: 'absolute',
      inset: 4,
      borderRadius: '50%',
      backgroundColor: token.colorTextLightSolid,
    },

  [`.${selectionControlDisabledCls}`]: {
    cursor: 'not-allowed',
    opacity: 0.65,
  },

  [`.${selectionControlDisabledCls} .${selectionControlInputCls}`]: {
    borderColor: token.colorBorder,
    backgroundColor: token.colorBgLayout,
  },

  [`
    .${selectionControlDisabledCls}.${selectionControlCheckedCls} .${selectionControlInputCls}, 
    .${selectionControlDisabledCls}.${selectionControlIndeterminateCls} .${selectionControlInputCls}`]:
    {
      borderColor: token.colorBorder,
      backgroundColor: token.colorBorder,
    },

  [`.${rowSortControlCls}`]: {
    display: 'flex',
    alignItems: 'center',
  },

  [`.${rowSortHandleCls}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flex: '0 0 16px',
    width: 16,
    height: 16,
    margin: 0,
    padding: 0,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 2,
    backgroundColor: token.colorBgContainer,
    color: token.colorText,
    cursor: 'grab',
    boxSizing: 'border-box',
    // transition: 'border-color 0.2s, color 0.2s, background-color 0.2s',

    '&:hover': {
      color: token.colorText,
      backgroundColor: token.cellColorHoverBg,
    },

    '&:not(:disabled):active': {
      cursor: 'grabbing',
    },

    span: {
      width: 8,
      height: 1,
      backgroundColor: 'currentColor',
    },
  },

  [`.${rowSortHandleDisabledCls}`]: {
    cursor: 'not-allowed',
    opacity: 0.4,

    '&:hover': {
      color: token.colorText,
      backgroundColor: token.colorBgContainer,
    },
  },

  [`.${rowSortHandleDraggingCls}`]: {
    cursor: 'grabbing',
  },

  [`.${expandControlCls}`]: {
    display: 'flex',
    alignItems: 'center',
  },

  [`.${expandTreeCellInnerCls}`]: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  },

  [`.${expandIconCls}`]: {
    position: 'relative',
    flex: '0 0 16px',
    width: 16,
    height: 16,
    margin: 0,
    padding: 0,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 2,
    backgroundColor: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },

  [`.${expandIconCls}::before, .${expandIconCls}::after`]: {
    content: "' '",
    position: 'absolute',
    backgroundColor: 'currentColor',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },

  [`.${expandIconCls}::before`]: {
    width: 8,
    height: 1,
  },

  [`.${expandIconCls}::after`]: {
    width: 1,
    height: 8,
  },

  [`.${expandIconExpandedCls}::after`]: {
    display: 'none',
  },

  [`.${expandIconSpacedCls}`]: {
    marginInlineEnd: 8,
  },

  [`.${expandIconCls}:disabled`]: {
    cursor: 'default',
    visibility: 'hidden',
  },
});

const getFixedStartShadow = (token: TableComponentToken) =>
  `inset 10px 0 8px -8px ${token.fixedColumnShadowColor}`;

const getFixedEndShadow = (token: TableComponentToken) =>
  `inset -10px 0 8px -8px ${token.fixedColumnShadowColor}`;

const genFixedCellStyle = (
  {
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
      zIndex: 5,
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

    // 左侧最后一列固定列显示阴影时不显示使用::before制作的分割线border
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
    headRowCls,
    headLastCellCls,
    headCellResizeHandleCls,
    cellCls,
    noDataCellContentCls,
  }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}.${componentSMCls} .${headRowCls}`]: {
    [`.${cellCls}:not(.${headLastCellCls})::before`]: {
      insetBlock: unit(token.cellPaddingBlockSM),
    },

    [`.${headCellResizeHandleCls}`]: {
      insetBlock: unit(token.cellPaddingBlockSM),
    },
  },
  [`.${componentCls}.${componentMDCls} .${headRowCls}`]: {
    [`.${cellCls}:not(.${headLastCellCls})::before`]: {
      insetBlock: unit(token.cellPaddingBlockMD),
    },

    [`.${headCellResizeHandleCls}`]: {
      insetBlock: unit(token.cellPaddingBlockMD),
    },
  },

  [`.${componentCls}.${componentSMCls} .${cellCls}`]: {
    paddingBlock: unit(token.cellPaddingBlockSM),
    paddingInline: unit(token.cellPaddingInlineSM),

    [`.${noDataCellContentCls}`]: {
      marginInline: unit(-token.cellPaddingInlineSM),
    },
  },
  [`.${componentCls}.${componentMDCls} .${cellCls}`]: {
    paddingBlock: unit(token.cellPaddingBlockMD),
    paddingInline: unit(token.cellPaddingInlineMD),

    [`.${noDataCellContentCls}`]: {
      marginInline: unit(-token.cellPaddingInlineMD),
    },
  },
});

const genStripeClsStyle = (
  { stripeCls, bodyRowCls, cellCls }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${stripeCls} .${bodyRowCls}:nth-of-type(even) .${cellCls}`]: {
    backgroundColor: token.colorBgLayout,
  },
});

const genEmptyClsStyle = (
  { noDataCls, noDataCellContentCls }: ComponentClsType,
  token: TableComponentToken,
): CSSInterpolation => ({
  [`.${noDataCls}`]: {
    [`.${noDataCellContentCls}`]: {
      position: 'sticky',
      left: 0,
      marginInline: unit(-token.cellPaddingInline),
    },
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
  genBorderedStyle(clsObj, mergedToken),
  genFixedShadowStyle(clsObj, mergedToken),
  genSizeClsStyle(clsObj, mergedToken),
  genStripeClsStyle(clsObj, mergedToken),
  genEmptyClsStyle(clsObj, mergedToken),
  // 避免对象属性冲突，分开来构建样式
  { [`.${clsObj.componentCls}`]: genHeadStyle(clsObj, mergedToken, cssVar) },
  { [`.${clsObj.componentCls}`]: genBodyStyle(clsObj, mergedToken, cssVar) },
  { [`.${clsObj.componentCls}`]: genSummaryCls(clsObj, mergedToken, cssVar) },
  { [`.${clsObj.componentCls}`]: genCellStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genFixedCellStyle(clsObj, mergedToken) },
  {
    [`.${clsObj.componentCls}`]: genScrollbarToggleShowStyle(
      scrollbarClsObj.xScrollBarCls,
      scrollbarClsObj.xScrollBarShowCls,
    ),
  },
  {
    [`.${clsObj.componentCls}`]: genScrollbarToggleShowStyle(
      scrollbarClsObj.yScrollBarCls,
      scrollbarClsObj.yScrollBarShowCls,
    ),
  },
  {
    [`.${clsObj.componentCls}`]: genScrollBarStyle(
      scrollbarClsObj,
      mergedToken,
    ),
  },
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

  const mergedToken: any = useMemo(
    () => ({
      ...token,
      ...(cssVar?.key ? cssVarToken : mergedComponentToken),
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
