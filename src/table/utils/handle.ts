import { isValidElement, type ReactNode } from "react"
import type { CellType, ColumnsType } from "../interface";

export const getEllipsisTitle = (children: ReactNode) => {
  let title = children
  if (typeof children === 'string' || typeof children === 'number') {
    title = children.toString();
  } else if (isValidElement(children) && typeof children.props.children === 'string') {
    title = children?.props?.children;
  }

  return title
}

export const isNum = (input?: any) => typeof input === 'number' && !Number.isNaN(input)

export const filterSpan = (span?: number) => {
  if(isNum(span)) {
    const realSpan = Math.floor(span as number)
    if(realSpan === 0) {
      return false
    }
  }

  return true
}

export const filterCellSpan = (span?: {rowSpan?: number, colSpan?: number}) => {
  const {rowSpan, colSpan} = span || {}
  return filterSpan(rowSpan) && filterSpan(colSpan)
}

export function parseHeaderRows<T>(rootColumns: ColumnsType<T> = []): CellType<T>[][] {
  const rows: CellType<T>[][] = [];

  function fillRowCells(
    columns: ColumnsType<T>,
    colIndex: number,
    rowIndex: number = 0,
  ): number[] {
    // Init rows
    rows[rowIndex] = rows[rowIndex] || [];

    let currentColIndex = colIndex;
    const colSpans: number[] = columns.map(column => {
      const cell: CellType<T> = {
        key: column.key,
        children: column.title,
        column,
        colStart: currentColIndex,
      };

      let colSpan: number = 1;

      const subColumns = column.children;
      if (subColumns && subColumns.length > 0) {
        colSpan = fillRowCells(subColumns, currentColIndex, rowIndex + 1).reduce(
          (total, count) => total + count,
          0,
        );
        cell.hasSubColumns = true;
      }

      if ('colSpan' in column) {
        ({ colSpan = 1 } = column);
      }

      if ('rowSpan' in column) {
        cell.rowSpan = column.rowSpan;
      }

      cell.colSpan = colSpan;
      cell.colEnd = cell.colStart as number + colSpan - 1;
      rows[rowIndex].push(cell);

      currentColIndex += colSpan;

      return colSpan;
    });

    return colSpans;
  }

  // Generate `rows` cell data
  fillRowCells(rootColumns, 0);

  // Handle `rowSpan`
  const rowCount = rows.length;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rows[rowIndex].forEach(cell => {
      if (!('rowSpan' in cell) && !cell.hasSubColumns) {
        cell.rowSpan = rowCount - rowIndex;
      }
    });
  }

  return rows;
}

/**
 * 展平columns数组，只保留没有children的列
 * @param columns 列配置数组
 * @returns 展平后的叶子列数组
 */
export function flattenColumns<T>(columns: ColumnsType<T>): ColumnsType<T> {
  const result: ColumnsType<T> = [];
  
  function traverse(cols: ColumnsType<T>) {
    cols.forEach(col => {
      if (col.children && col.children.length > 0) {
        traverse(col.children);
      } else {
        result.push(col);
      }
    });
  }
  
  traverse(columns);
  return result;
}