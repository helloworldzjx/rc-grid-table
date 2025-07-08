import React, { Key, useMemo, useState } from "react";
import { useDebounceFn } from "ahooks";
import { DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { CellType } from "../interface"
import HeadCell from "./HeadCell";
import { useStyles } from "../style";
import { useTableContext } from "../context";

interface HeadRowProps<T = any> {
  headRows: CellType<T>[][]
  row: CellType<T>[]
  headRowIndex: number
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

function HeadRow({
  headRows,
  row: columns,
  headRowIndex,
  onResizeStart,
  onResizeEnd,
}: HeadRowProps) {
  const { sortableColumns, updateSortableScopeKeys, updateOverableScopeKeys } = useTableContext();

  const { headRowCls, headDraggingOverlayCellCls } = useStyles();
  
  const previousRow = headRows[headRowIndex - 1] || []
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const [dragOverlaySize] = useState({width: 100, height: 40})
  const [translate, setTranslate] = useState({x: 0, y: 0})

  const activeColumn = useMemo(() => {
    return columns.find((column) => column.key === activeKey)
  }, [activeKey])

  const handleDragStart = (event: DragStartEvent) => {
    if(event.active.data.current?.type === 'sortableColumns') {
      document.documentElement.style.cursor = 'move'
      const x = (event.activatorEvent as MouseEvent).offsetX - dragOverlaySize.width / 2
      const y = (event.activatorEvent as MouseEvent).offsetY - dragOverlaySize.height / 2
      setTranslate({x, y})
      updateSortableScopeKeys(event.active.data.current?.scopeKeys)
      setActiveKey(event.active.id)
    }

    if(event.active.data.current?.type === 'resizableColumns') {
      onResizeStart?.()
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

    if(event.active.data.current?.type === 'resizableColumns') {
      onResizeEnd?.()
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
                currentRowLastIndex={columns.length - 1}
                rowsLastIndex={headRows.length - 1}
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
                      lineHeight: `${dragOverlaySize.height}px`,
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