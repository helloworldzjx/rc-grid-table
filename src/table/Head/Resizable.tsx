import { useDndMonitor, useDraggable } from "@dnd-kit/core";
import React, { FC, Key, useEffect, useMemo, useRef, useState } from "react";
import { useDebounceFn } from "ahooks";

import { useTableContext } from "../context";
import { batchUpdateColumns } from "../utils/handle";
import { useStyles } from "../style"

interface ResizableProps {
  id: string
  keys: Key[]
}

const Resizable: FC<ResizableProps> = ({
  id,
  keys,
}) => {
  const {
    flattenColumns = [],
    flattenColumnsWidths = [],
    middleState,
    updateFlattenColumnsWidths,
    updateMiddleState,
    columnsConfig,
  } = useTableContext();
  
  const { headCellResizableCls, headCellResizeDisabledCls: _ } = useStyles();

  const minWidth = 50
  const [distance, setDistance] = useState(0)
  const [distanceTotal, setDistanceTotal] = useState(0)
  const updated = useRef(false)
  const { run: setFlattenColumnsWidths } = useDebounceFn(updateFlattenColumnsWidths, { wait: 0 })

  const { listeners, setNodeRef } = useDraggable({ 
    id, 
    data: { type: 'resizableColumns' },
  });

  const idxs = useMemo(() => {
    const idxArr = flattenColumns.reduce((indexes: number[], item, index) => {
      if(keys.includes(item.key)) {
        indexes.push(index)
      }
      
      return indexes;
    }, []);
    
    return idxArr
  }, [keys])

  useEffect(() => {
    if(!distance) return
    
    const resizeIdxs = idxs.filter((idx: number) => {
      if(distance >= 0) return true
      return flattenColumnsWidths[idx] as number > minWidth
    })
    if(resizeIdxs.length) {
      const avg = distance / resizeIdxs.length
      const updatedWidths = flattenColumnsWidths.map((width, index) => {
        if(resizeIdxs.includes(index)) {
          let updatedWidth = parseFloat((width + avg).toFixed(2))
          if(width > minWidth && updatedWidth < minWidth) {
            updatedWidth = minWidth
          }
          return updatedWidth
        }

        return width
      })
      setFlattenColumnsWidths(updatedWidths)
      updated.current = true
    }
  }, [distance, distanceTotal])

  const updateState = () => {
    const updates = idxs.map((idx, index) => ({
      targetKey: keys[index],
      prop: ['width', 'updatedWidth'],
      value: [flattenColumnsWidths[idx], true]
    }))
    const updatedMiddleState = batchUpdateColumns(middleState, updates as any[])
    updateMiddleState(updatedMiddleState)
    columnsConfig?.onChange?.(updatedMiddleState)
  }

  useDndMonitor({
    onDragStart(event) {
      if(event.active.id !== id || event.active.data.current?.type !== 'resizableColumns') return
      document.documentElement.style.cursor = 'e-resize'
    },
    onDragMove(event) {
      if(event.active.id !== id || event.active.data.current?.type !== 'resizableColumns') return
      const distance = event.delta.x - distanceTotal
      setDistance(distance)
      setDistanceTotal((prev) => prev + distance)
    },
    onDragEnd(event) {
      if(event.active.id !== id || event.active.data.current?.type !== 'resizableColumns') return
      document.documentElement.style.cursor = ''
      if(updated.current) {
        updateState()
        setDistance(0)
        setDistanceTotal(0)
        updated.current = false
      }
    },
  })
  
  return (
    <div 
      className={headCellResizableCls} 
      ref={setNodeRef} 
      {...listeners} 
    />
  )
}

export default Resizable