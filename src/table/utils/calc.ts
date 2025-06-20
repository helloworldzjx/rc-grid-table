import type { ColumnsType, ColumnType } from "../interface";

/**
 * 将总数分配到n个位置，返回第一个位置值和平均值
 * @param total 总数（必须 ≥ 0）
 * @param n 分配数量（必须 ≥ 1）
 * @throws 参数不合法则抛出错误
 */
export const distribute = (
  total: number,
  n: number,
  minWidth: number,
  maxRetry = 10 // 防止无限递归
): { first: number; avg: number } => {
  // 参数校验
  if (total < 0 || n < 1 || !Number.isInteger(n)) {
    throw new Error('Invalid parameters');
  }

  // 计算基础平均值（强制最小minWidth）
  const enforcedAvg = Math.max(minWidth, Math.floor(total / n));
  const adjustedTotal = enforcedAvg * n; // 调整后的总宽度
  
  // 终止条件
  if (n === 1 || maxRetry <= 0) {
    return { first: adjustedTotal, avg: adjustedTotal };
  }

  const base = Math.floor(adjustedTotal / n);
  const remainder = adjustedTotal % n;
  const result = Array(n).fill(base);

  // 余数处理（优先分配给第一个元素）
  if (remainder <= Math.min(10, base * 0.2)) { // 动态阈值
    result[0] += remainder;
  } else {
    // 递归时使用调整后的总量
    return distribute(adjustedTotal, n + 1, minWidth, maxRetry - 1); // 尾递归
  }

  return {
    first: result[0],
    avg: base
  };
};

/**
 * 处理单个列
 */
function processColumn<T>(
  column: ColumnType<T>,
  isTopLevel: boolean,
  topLevelMinWidth: number,
  leafMinWidth: number
): ColumnType<T> {
  // 有子列的情况
  if (column.children && column.children.length > 1) {
    const processedChildren = column.children.map(child => 
      processColumn(child, false, topLevelMinWidth, leafMinWidth)
    );
    return {
      ...column,
      children: processedChildren,
      width: undefined // 忽略父列的width
    };
  }

  // 没有子列的情况
  if (!column.width) {
    const minWidth = isTopLevel ? topLevelMinWidth : leafMinWidth;
    return { ...column, width: minWidth };
  }

  return column;
}

/**
 * 调整表格列宽度
 * @param containerWidth 容器总宽度
 * @param columns 原始列配置
 * @param topLevelMinWidth 顶层列最小宽度
 * @param leafMinWidth 叶子列最小宽度
 * @returns 调整后的列配置
 */
export function adjustColumnsWidths<T>(
  containerWidth: number,
  columns: ColumnsType<T>,
  topLevelMinWidth: number,
  leafMinWidth: number
): ColumnsType<T> {
  // 处理顶层列
  const processedColumns = columns.map(column => {
    return processColumn(column, true, topLevelMinWidth, leafMinWidth);
  });

  // 计算需要分配宽度的列
  const columnsToDistribute = processedColumns.filter(col => !col.width && (!col.children?.length));

  if (columnsToDistribute.length > 0) {
    // 计算剩余宽度
    const usedWidth = processedColumns.reduce((sum, col) => {
      return sum + (col.width as number || 0);
    }, 0);
    const remainingWidth = containerWidth - usedWidth;

    // 分配剩余宽度
    if (remainingWidth > 0) {
      const { first, avg } = distribute(
        remainingWidth,
        columnsToDistribute.length,
        topLevelMinWidth,
        10
      );

      let index = 0;
      return processedColumns.map(col => {
        if (!col.width && (!col.children || col.children.length === 0)) {
          const width = index === 0 ? first : avg;
          index++;
          return { ...col, width };
        }
        return col;
      });
    }
  }

  return processedColumns;
}