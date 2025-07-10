import React, { FC } from "react";
import classNames from "classnames";

import { useTableContext } from "../context"
import { useStyles } from "../style"
import { flattenMiddleState, rebuildColumns } from "../utils/handle";
import { distribute } from "../utils/calc";

const Placeholder: FC = () => {
  const { 
    containerWidth = 0,
    bordered,
    columnsWidthTotal,
    middleState,
    updateMiddleState,
    columnsConfig,
  } = useTableContext();

  const { 
    hashId, 
    placeholderCls, 
    placeholderBorderedCls, 
  } = useStyles();

  const autoFill = () => {
    const flattenedMiddleState = flattenMiddleState(middleState)
    const leafState = flattenedMiddleState.filter(state => !state.hasChildren)
    const remainingWidth = containerWidth - columnsWidthTotal;
    const { first, avg } = distribute(remainingWidth, leafState.length);
  
    // 合并
    const mergedMiddleState = flattenedMiddleState.map((state, index) => {
      if (!state.hasChildren) {
        const width = state.width as number
        const newWidth = width + (index === 0 ? first : avg);
        return { ...state, width: newWidth, updatedWidth: true };
      }
      return state;
    });
    const updatedMiddleState = rebuildColumns(mergedMiddleState);
    updateMiddleState(updatedMiddleState);
    columnsConfig?.onChange?.(updatedMiddleState);
  }

  return (
    // 暂时不使用表达式 containerWidth - columnsWidthTotal >= 0.5 动态渲染这个占位元素
    <div 
      onClick={autoFill}
      className={classNames(placeholderCls, hashId, {[placeholderBorderedCls]: bordered})}
      style={{
        left: columnsWidthTotal, 
        display: containerWidth - columnsWidthTotal >= 0.5 ? 'block' : 'none'
      }}
    />
  )
}

export default Placeholder