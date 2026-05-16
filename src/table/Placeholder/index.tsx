import React, { FC } from "react";
import classNames from "classnames";

import { useTableContext } from "../context"
import { useStyles } from "../style"
import { flattenMiddleState, rebuildColumns } from "../utils/handle";
import { distribute, filterResizeEnabledColumns } from "../utils/calc";

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
    const resizeEnabledLeafState = filterResizeEnabledColumns(leafState)
    if(!resizeEnabledLeafState.length) return;

    const remainingWidth = containerWidth - columnsWidthTotal;
    const { first, avg } = distribute(remainingWidth, resizeEnabledLeafState.length);
    let leafIndex = 0;
  
    // 合并
    const mergedMiddleState = flattenedMiddleState.map((state) => {
      if (!state.hasChildren && !state.resizeDisabled) {
        const width = state.width as number
        const newWidth = width + (leafIndex === 0 ? first : avg);
        leafIndex++;
        return { ...state, width: newWidth, updatedWidth: true };
      }
      return state;
    });
    const updatedMiddleState = rebuildColumns(mergedMiddleState);
    updateMiddleState(updatedMiddleState);
    columnsConfig?.onChange?.(updatedMiddleState);
  }

  return (
    // 暂不动态渲染这个占位元素，而是通过display控制
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