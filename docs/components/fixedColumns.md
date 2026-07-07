---
title: 固定列
order: 4
---

## 逻辑设计

开启 `sortableColumns` 后，固定列拖拽排序会限制 over 范围：固定列只能 over 到固定列上，但不要求 `fixed` 值一致，因此 `fixed: 'start'` 和 `fixed: 'end'` 列之间可以互相交换；非固定列不限制，可以 over 到任意列。

## 固定列拖拽热区

开启 `sortableColumns` 后，拖拽中的列会显示 active 高亮；无论 active 列是固定列还是非固定列，表格都会额外显示固定列热区。active 列始终显示 active 背景色，其他固定列显示热区背景色。热区只会出现在同一排序层级的固定列上，包含 `fixed: 'start'` 和 `fixed: 'end'` 两个方向的兄弟列。

在分组表头中，排序层级由父分组决定。拖拽子列时，只会高亮当前子列和同父分组下可 over 的子列，父分组表头不会被当作热区；拖拽父分组时，热区会覆盖该分组对应的子列区域。热区会同步显示在表头单元格、筛选行单元格和 body 单元格上。

非固定列拖拽时也会展示同一排序层级下的固定列热区，但 active 列本身仍只显示 active 高亮，不会被当作热区。

<code src="../../examples/fixedColumns.tsx"></code>
