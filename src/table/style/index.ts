import {
  unit,
  useCSSVarRegister,
  useStyleRegister,
  type CSSInterpolation,
} from '@ant-design/cssinjs';

import useToken from '../../theme/hooks/useToken';
import { useTableContext } from '../context';
import {
  darkTableToken,
  lightTableToken,
  type ComponentToken,
} from '../design';

type ComponentClsType = {
  wrapperCls: string;
  wrapperInitializedCls: string;
  placeholderCls: string;
  placeholderBorderedCls: string;
  componentCls: string;
  componentSMCls: string;
  componentMDCls: string;
  contentCls: string;
  borderedCls: string;
  stripeCls: string;
  noDataCls: string;
  hasFixColumnsCls: string;
  hasFixStartColumnsCls: string;
  hasFixEndColumnsCls: string;
  fixColumnsGappedCls: string;
  pingStartCls: string;
  pingEndCls: string;
  hasSummaryCls: string;
  hasXScrollbarCls: string;
  hasYScrollbarCls: string;
  hasStickyCls: string;
  headCls: string;
  headStickyCls: string;
  headInnerCls: string;
  headRowCls: string;
  bodyCls: string;
  bodyInnerCls: string;
  bodyRowCls: string;
  bodyGridRowCls: string;
  bodyVirtualFillerCls: string;
  bodyVirtualInnerCls: string;
  bodyVirtualRowSpanCls: string;
  bodyRowExpandableCls: string;
  bodyRowSortDraggingCls: string;
  cellCls: string;
  cellEllipsisCls: string;
  cellEllipsisInnerCls: string;
  expandControlCellCls: string;
  expandControlCls: string;
  rowSortCellCls: string;
  rowSortCellOverCls: string;
  rowSortControlCls: string;
  rowSortHandleCls: string;
  rowSortHandleDisabledCls: string;
  rowSortHandleDraggingCls: string;
  selectionCellCls: string;
  selectionControlCls: string;
  selectionControlInputCls: string;
  selectionControlContentCls: string;
  selectionCheckboxCls: string;
  selectionRadioCls: string;
  selectionControlCheckedCls: string;
  selectionControlIndeterminateCls: string;
  selectionControlDisabledCls: string;
  expandIconCls: string;
  expandIconExpandedCls: string;
  expandIconSpacedCls: string;
  expandTreeCellInnerCls: string;
  expandedRowCls: string;
  expandedRowCellCls: string;
  expandedRowContentCls: string;
  headLastCellCls: string;
  headCellResizeHandleCls: string;
  headResizableCellDisabledCls: string;
  headSortableCellCls: string;
  headSortableCellDisabledCls: string;
  headDraggingOverlayCellCls: string;
  cellFixedStartCls: string;
  cellFixedStartLastCls: string;
  cellFixedEndCls: string;
  cellFixedEndFirstCls: string;
  noDataCellCls: string;
  noDataCellContentCls: string;
  summaryCls: string;
  summaryStickyCls: string;
  summaryInnerCls: string;
  summaryRowCls: string;
};

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
  { placeholderCls, placeholderBorderedCls }: ComponentClsType,
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
    zIndex: 4,

    '&:hover': {
      backgroundColor: token.cellColorHoverBg,
    },

    '&:active': {
      backgroundColor: token.cellColorActiveBg,
    },
  },

  [`.${placeholderBorderedCls}`]: {
    border: `1px solid ${token.colorBorder}`,
    borderTopRightRadius: token.borderRadius,
    borderBottomRightRadius: token.borderRadius,
  },
});

const genComponentStyle = ({
  componentCls,
}: ComponentClsType): CSSInterpolation => ({
  [`.${componentCls}`]: {
    position: 'relative',
    boxSizing: 'border-box',
  },
});

const genBorderedStyle = (
  {
    fixColumnsGappedCls,
    borderedCls,
    hasXScrollbarCls,
    hasSummaryCls,
    headCls,
    headStickyCls,
    headInnerCls,
    bodyCls,
    summaryCls,
    summaryStickyCls,
    summaryInnerCls,
    headRowCls,
    summaryRowCls,
    cellCls,
    pingStartCls,
    pingEndCls,
    cellFixedStartLastCls,
    bodyRowSortDraggingCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${borderedCls}`]: {
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
      [`.${headInnerCls}`]: {
        borderTopLeftRadius: token.borderRadius,
        borderTopRightRadius: token.borderRadius,
      },

      [`&.${headStickyCls}::before`]: {
        border: `1px solid ${token.colorBorder}`,
        borderTopLeftRadius: token.borderRadius,
        borderTopRightRadius: token.borderRadius,
      },
    },

    [`&:not(.${hasSummaryCls}) .${bodyCls}`]: {
      borderBottomLeftRadius: token.borderRadius,
      borderBottomRightRadius: token.borderRadius,
    },

    [`.${summaryCls}`]: {
      [`.${summaryInnerCls}`]: {
        borderBottomLeftRadius: token.borderRadius,
        borderBottomRightRadius: token.borderRadius,
      },

      [`.${summaryRowCls}:last-child .${cellCls}`]: {
        borderBottomColor: 'transparent',
      },

      [`&.${summaryStickyCls} .${summaryInnerCls}`]: {
        outline: `1px solid ${token.colorBorder}`,
        outlineOffset: -1,
      },
    },

    [`.${headRowCls} .${cellCls}::before`]: {
      display: 'none',
    },

    [`.${bodyRowSortDraggingCls} .${cellCls}`]: {
      borderTop: `1px solid ${token.colorBorder}`,

      '&:last-child': {
        borderRight: `1px solid ${token.colorBorder}`,
      },
    },

    [`.${cellCls}`]: {
      borderLeft: `1px solid ${token.colorBorder}`,
    },

    [`&.${fixColumnsGappedCls} .${cellFixedStartLastCls}::after`]: {
      width: 32,
      borderLeft: `1px solid ${token.colorBorder}`,
    },
  },
});

const genStickyStyle = (
  {
    componentCls,
    borderedCls,
    hasSummaryCls,
    hasStickyCls,
    headCls,
    headStickyCls,
    bodyCls,
    summaryCls,
    summaryStickyCls,
    summaryInnerCls,
    headRowCls,
    bodyRowCls,
    cellCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${componentCls}`]: {
    [`&.${hasStickyCls} .${headCls} .${headRowCls}:last-child .${cellCls}`]: {
      borderBottomColor: 'transparent',
    },

    [`&.${hasSummaryCls}.${hasStickyCls}`]: {
      [`.${bodyCls}`]: {
        '&::before': {
          display: 'none',
        },

        [`.${bodyRowCls}:last-child .${cellCls}`]: {
          borderBottomColor: 'transparent',
        },
      },
    },

    [`&.${borderedCls}`]: {
      [`.${headCls}`]: {
        [`&.${headStickyCls}::before`]: {
          border: `1px solid ${token.colorBorder}`,
          borderTopLeftRadius: token.borderRadius,
          borderTopRightRadius: token.borderRadius,
        },
      },

      [`.${summaryCls}`]: {
        [`&.${summaryStickyCls} .${summaryInnerCls}`]: {
          outline: `1px solid ${token.colorBorder}`,
          outlineOffset: -1,
        },
      },
    },
  },
});

const genHeadStyle = (
  {
    componentCls,
    headCls,
    headStickyCls,
    headInnerCls,
    headRowCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${headCls}`]: {
    [`&.${headStickyCls}`]: {
      position: 'sticky',
      zIndex: 3,

      // 粘性表头单元格底部 border 会异常消失，这里做兜底
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

    [`.${headInnerCls}`]: {
      display: 'grid',
      gridTemplateColumns: `var(--${componentCls}-cols-width)`,
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
    componentCls,
    bodyCls,
    bodyInnerCls,
    bodyRowCls,
    bodyGridRowCls,
    bodyVirtualFillerCls,
    bodyVirtualInnerCls,
    bodyVirtualRowSpanCls,
    cellCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${bodyCls}::before`]: {
    content: "' '",
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 0,
    width: `max(100%, var(--${componentCls}-cols-width-total))`,
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

    [`.${bodyGridRowCls}`]: {
      display: 'grid',
      gridTemplateColumns: `var(--${componentCls}-cols-width)`,
      gridColumn: '1 / -1',
    },
  },

  [`.${bodyVirtualFillerCls}`]: {
    position: 'relative',
    gridColumn: '1 / -1',
    width: `max(100%, var(--${componentCls}-cols-width-total))`,
    minHeight: '100%',
  },

  [`.${bodyVirtualInnerCls}`]: {
    position: 'absolute',
    insetInline: 0,
    top: 0,
    display: 'grid',
    gridTemplateColumns: `var(--${componentCls}-cols-width)`,
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
});

const genSummaryCls = (
  {
    componentCls,
    summaryCls,
    summaryStickyCls,
    summaryInnerCls,
    summaryRowCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${summaryCls}`]: {
    [`&.${summaryStickyCls}`]: {
      position: 'sticky',
      zIndex: 3,

      '&::before': {
        content: "' '",
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        borderTop: `1px solid ${token.colorBorder}`,
        pointerEvents: 'none',
        zIndex: 2,
      },
    },

    [`.${summaryInnerCls}`]: {
      display: 'grid',
      gridTemplateColumns: `var(--${componentCls}-cols-width)`,
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
    headRowCls,
    bodyRowCls,
    bodyRowExpandableCls,
    bodyRowSortDraggingCls,
    summaryRowCls,
    cellCls,
    cellEllipsisCls,
    cellEllipsisInnerCls,
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
    headSortableCellCls,
    headDraggingOverlayCellCls,
  }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${headRowCls}`]: {
    [`.${cellCls}`]: {
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

    [`.${headCellResizeHandleCls}`]: {
      position: 'absolute',
      top: 0,
      right: 0,
      insetBlock: unit(token.cellPaddingBlock),
      width: 10,
      backgroundColor: 'transparent',
      cursor: 'e-resize',
    },
    [`.${headSortableCellCls}`]: {
      userSelect: 'none',
    },
    [`.${headDraggingOverlayCellCls}`]: {
      paddingInline: unit(token.cellPaddingInline),
      boxSizing: 'border-box',
      fontSize: token.fontSize,
      color: token.colorText,
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

    [`&:not(.${bodyRowSortDraggingCls}):hover .${cellCls}`]: {
      backgroundColor: token.cellColorHoverBg,
      transition: 'background-color 0.3s',
    },
  },

  [`.${bodyRowExpandableCls}`]: {
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

  [`.${selectionControlInputCls} input`]: {
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

  [`.${cellEllipsisCls}`]: {
    [`.${cellEllipsisInnerCls}`]: {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },
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
  [`.${headRowCls} .${cellFixedStartCls}, .${headRowCls} .${cellFixedEndCls}`]:
    {
      position: 'sticky',
      zIndex: 1,
    },
  [`.${cellFixedStartCls}, .${cellFixedEndCls}`]: {
    position: 'sticky',
    zIndex: 1,
  },

  [`.${bodyRowCls} .${cellFixedStartCls}, .${bodyRowCls} .${cellFixedEndCls}`]:
    {
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
  hasFixStartColumnsCls,
  hasFixEndColumnsCls,
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
      zIndex: 5,
    },
    [`&.${hasFixStartColumnsCls}.${hasFixEndColumnsCls}::after`]: {
      display: 'none',
    },

    [`&.${pingStartCls}::after`]: {
      boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },
    [`&.${pingEndCls}::after`]: {
      boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },
    [`&.${pingStartCls}.${pingEndCls}::after`]: {
      boxShadow:
        'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1), inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
    },

    [`&.${hasFixStartColumnsCls}:not(.${hasFixEndColumnsCls}).${pingStartCls}:not(.${pingEndCls})::after`]:
      {
        boxShadow: 'none',
      },
    [`&.${hasFixStartColumnsCls}:not(.${hasFixEndColumnsCls}).${pingStartCls}.${pingEndCls}::after`]:
      {
        boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
      },
    [`&.${hasFixEndColumnsCls}:not(.${hasFixStartColumnsCls}).${pingEndCls}:not(.${pingStartCls})::after`]:
      {
        boxShadow: 'none',
      },
    [`&.${hasFixEndColumnsCls}:not(.${hasFixStartColumnsCls}).${pingStartCls}.${pingEndCls}::after`]:
      {
        boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
      },

    [`&.${pingStartCls}:not(.${fixColumnsGappedCls}) .${cellFixedStartLastCls}::after`]:
      {
        boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.1)',
      },
    [`&.${pingEndCls}:not(.${fixColumnsGappedCls}) .${cellFixedEndFirstCls}::after`]:
      {
        boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.1)',
      },

    // 左侧最后一列固定列显示阴影时不显示使用::before制作的分割线border
    [`&.${pingStartCls} .${headRowCls} .${cellFixedStartLastCls}::before`]: {
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
  }: ComponentClsType,
  token: ComponentToken,
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
  },
  [`.${componentCls}.${componentMDCls} .${cellCls}`]: {
    paddingBlock: unit(token.cellPaddingBlockMD),
    paddingInline: unit(token.cellPaddingInlineMD),
  },
});

const genStripeClsStyle = (
  { stripeCls, bodyRowCls, cellCls }: ComponentClsType,
  token: ComponentToken,
): CSSInterpolation => ({
  [`.${stripeCls} .${bodyRowCls}:nth-of-type(even) .${cellCls}`]: {
    backgroundColor: token.colorBgLayout,
  },
});

const genEmptyClsStyle = ({
  noDataCls,
  noDataCellCls,
  noDataCellContentCls,
}: ComponentClsType): CSSInterpolation => ({
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
    },
  },
});

const genNestStyles = (
  clsObj: ComponentClsType,
  mergedToken: ComponentToken,
): CSSInterpolation => [
  genInitialStyle(clsObj),
  genPlaceholderStyle(clsObj, mergedToken),
  genComponentStyle(clsObj),
  genBorderedStyle(clsObj, mergedToken),
  genStickyStyle(clsObj, mergedToken),
  genFixedShadowStyle(clsObj),
  genSizeClsStyle(clsObj, mergedToken),
  genStripeClsStyle(clsObj, mergedToken),
  genEmptyClsStyle(clsObj),
  // 避免对象属性冲突，分开来构建样式
  { [`.${clsObj.componentCls}`]: genHeadStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genBodyStyle(clsObj, mergedToken) },
  { [`.${clsObj.componentCls}`]: genSummaryCls(clsObj, mergedToken) },
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
    hasFixStartColumnsCls: `${prefixCls}-has-fix-start-columns`,
    hasFixEndColumnsCls: `${prefixCls}-has-fix-end-columns`,
    fixColumnsGappedCls: `${prefixCls}-fix-columns-gapped`,
    pingStartCls: `${prefixCls}-ping-start`,
    pingEndCls: `${prefixCls}-ping-end`,
    hasSummaryCls: `${prefixCls}-has-summary`,
    hasXScrollbarCls: `${prefixCls}-has-horizontal-scrollbar`,
    hasYScrollbarCls: `${prefixCls}-has-vertical-scrollbar`,
    hasStickyCls: `${prefixCls}-has-sticky`,
    headCls: `${prefixCls}-head`,
    headStickyCls: `${prefixCls}-head-sticky`,
    headInnerCls: `${prefixCls}-head-inner`,
    headRowCls: `${prefixCls}-head-row`,
    bodyCls: `${prefixCls}-body`,
    bodyInnerCls: `${prefixCls}-body-inner`,
    bodyRowCls: `${prefixCls}-body-row`,
    bodyGridRowCls: `${prefixCls}-body-grid-row`,
    bodyVirtualFillerCls: `${prefixCls}-body-virtual-filler`,
    bodyVirtualInnerCls: `${prefixCls}-body-virtual-inner`,
    bodyVirtualRowSpanCls: `${prefixCls}-body-virtual-row-span`,
    bodyRowExpandableCls: `${prefixCls}-body-row-expandable`,
    bodyRowSortDraggingCls: `${prefixCls}-body-row-sort-dragging`,
    cellCls: `${prefixCls}-cell`,
    cellEllipsisCls: `${prefixCls}-cell-ellipsis`,
    cellEllipsisInnerCls: `${prefixCls}-cell-ellipsis-inner`,
    expandControlCellCls: `${prefixCls}-expand-control-cell`,
    expandControlCls: `${prefixCls}-expand-control`,
    rowSortCellCls: `${prefixCls}-row-sort-cell`,
    rowSortCellOverCls: `${prefixCls}-row-sort-cell-over`,
    rowSortControlCls: `${prefixCls}-row-sort-control`,
    rowSortHandleCls: `${prefixCls}-row-sort-handle`,
    rowSortHandleDisabledCls: `${prefixCls}-row-sort-handle-disabled`,
    rowSortHandleDraggingCls: `${prefixCls}-row-sort-handle-dragging`,
    selectionCellCls: `${prefixCls}-selection-cell`,
    selectionControlCls: `${prefixCls}-selection-control`,
    selectionControlInputCls: `${prefixCls}-selection-control-input`,
    selectionControlContentCls: `${prefixCls}-selection-control-content`,
    selectionCheckboxCls: `${prefixCls}-selection-checkbox`,
    selectionRadioCls: `${prefixCls}-selection-radio`,
    selectionControlCheckedCls: `${prefixCls}-selection-control-checked`,
    selectionControlIndeterminateCls: `${prefixCls}-selection-control-indeterminate`,
    selectionControlDisabledCls: `${prefixCls}-selection-control-disabled`,
    expandIconCls: `${prefixCls}-expand-icon`,
    expandIconExpandedCls: `${prefixCls}-expand-icon-expanded`,
    expandIconSpacedCls: `${prefixCls}-expand-icon-spaced`,
    expandTreeCellInnerCls: `${prefixCls}-expand-tree-cell-inner`,
    expandedRowCls: `${prefixCls}-expanded-row`,
    expandedRowCellCls: `${prefixCls}-expanded-row-cell`,
    expandedRowContentCls: `${prefixCls}-expanded-row-content`,
    headLastCellCls: `${prefixCls}-head-last-cell`,
    headCellResizeHandleCls: `${prefixCls}-head-cell-resize-handle`,
    headResizableCellDisabledCls: `${prefixCls}-head-resizable-cell-disabled`,
    headSortableCellCls: `${prefixCls}-head-sortable-cell`,
    headSortableCellDisabledCls: `${prefixCls}-head-sortable-cell-disabled`,
    headDraggingOverlayCellCls: `${prefixCls}-head-dragging-verlay-cell`,
    cellFixedStartCls: `${prefixCls}-cell-fixed-start`,
    cellFixedStartLastCls: `${prefixCls}-cell-fixed-start-last`,
    cellFixedEndCls: `${prefixCls}-cell-fixed-end`,
    cellFixedEndFirstCls: `${prefixCls}-cell-fixed-end-first`,
    noDataCellCls: `${prefixCls}-no-data-cell`,
    noDataCellContentCls: `${prefixCls}-no-data-cell-content`,
    summaryCls: `${prefixCls}-summary`,
    summaryStickyCls: `${prefixCls}-summary-sticky`,
    summaryInnerCls: `${prefixCls}-summary-inner`,
    summaryRowCls: `${prefixCls}-summary-row`,
  };

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
    () => (isDark ? darkTableToken : lightTableToken),
  );

  const mergedToken: any = {
    ...token,
    ...(cssVar?.key ? cssVarToken : isDark ? darkTableToken : lightTableToken),
  };

  useStyleRegister(
    { theme, token, hashId, path: [prefixCls, `${isDark}`] },
    () => genNestStyles(clsObj, mergedToken),
  );

  return {
    hashId,
    cssVarCls: cssVar?.key,
    ...clsObj,
  };
};
