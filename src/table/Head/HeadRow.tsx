import React, { Key, useMemo, useRef, useState } from "react";
import { useDebounceFn } from "ahooks";
import { DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { CellType } from "../interface"
import HeadCell from "./HeadCell";
import { useStyles } from "../style";
import { useTableContext } from "../context";
import { useScrollContext } from "../scrollContext";

interface HeadRowProps<T = any> {
  headRows: CellType<T>[][]
  row: CellType<T>[]
  headRowIndex: number
}

function HeadRow({
  headRows,
  row: columns,
  headRowIndex,
}: HeadRowProps) {
  const { sortableColumns, updateSortableScopeKeys, updateOverableScopeKeys } = useTableContext();
  const { scrollRef, updateScrollLeft } = useScrollContext()

  const { headRowCls, headDraggingOverlayCellCls } = useStyles();
  
  const previousRow = headRows[headRowIndex - 1] || []
  const requestRef = useRef(0);
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const [dragOverlaySize] = useState({width: 100, height: 40})
  const [translate, setTranslate] = useState({x: 0, y: 0})

  const activeColumn = useMemo(() => {
    return columns.find((column) => column.key === activeKey)
  }, [activeKey])

  const handleDragStart = (event: DragStartEvent) => {
    if(event.active.data.current?.type === 'sortableColumns') {
      const x = (event.activatorEvent as MouseEvent).offsetX - dragOverlaySize.width / 2
      const y = (event.activatorEvent as MouseEvent).offsetY - dragOverlaySize.height / 2
      setTranslate({x, y})
      document.documentElement.style.cursor = 'move'
      updateSortableScopeKeys(event.active.data.current?.scopeKeys)
      setActiveKey(event.active.id)

      const container = scrollRef.current!.nativeScrollElement;
      const { left, right } = container.getBoundingClientRect();
      const edgeThreshold = 20; // 触发滚动的边缘阈值
      const checkScroll = (e: MouseEvent) => {
        // 计算是否需要水平滚动
        if (e.clientX < left + edgeThreshold) {
          updateScrollLeft((prev) => prev - 10);
        } else if (e.clientX > right - edgeThreshold) {
          updateScrollLeft((prev) => prev + 10);
        }

        cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => checkScroll(e));
      }
      const mouseUpHandler = () => {
        cancelAnimationFrame(requestRef.current);
        document.documentElement.removeEventListener('mousemove', checkScroll);
        document.documentElement.removeEventListener('mouseup', mouseUpHandler);
      }
      document.documentElement.addEventListener('mousemove', checkScroll);
      document.documentElement.addEventListener('mouseup', mouseUpHandler);
    }
  }

  const { run: handleDragMove } = useDebounceFn((event: DragMoveEvent) => {
    if(event.active.data.current?.type === 'sortableColumns') {
      // 限制同一行中，只有parentKey相同的列才能交换位置
      if(event.active.data.current?.column?.parentKey === event.over?.data.current?.column?.parentKey) {
        updateOverableScopeKeys(event.over?.data.current?.scopeKeys)
      } else {
        updateOverableScopeKeys([])
      }
    }
  }, { wait: 0 })

  const handleDragEnd = (event: DragEndEvent) => {
    if(event.active.data.current?.type === 'sortableColumns') {
      document.documentElement.style.cursor = ''
      updateSortableScopeKeys([])
      updateOverableScopeKeys([])
      setActiveKey(null);
      setTranslate({x: 0, y: 0})
    }
  }
  
  return (
    <div className={headRowCls}>
      <DndContext 
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columns.map((column) => `${column.key}`)}>
          {
            columns?.map((column, columnIndex) => (
              <HeadCell 
                key={column.key}
                column={column} 
                columnIndex={columnIndex}
                rowIndex={headRowIndex}
                prevRowLastCellKey={previousRow[previousRow.length - 1]?.column?.key}
                headRowLastIndex={columns.length - 1}
              />
            )
          )}
        </SortableContext>
        {
          sortableColumns && (
            <DragOverlay dropAnimation={null}>
              {
                activeColumn && (
                  <div 
                    className={headDraggingOverlayCellCls} 
                    style={{
                      ...dragOverlaySize,
                      transform: `translate(${translate.x}px, ${translate.y}px)`
                    }}
                  >
                    {activeColumn?.children}
                  </div>
                )
              }
            </DragOverlay>
          )
        }
      </DndContext>
    </div>
  )
}

export default HeadRow