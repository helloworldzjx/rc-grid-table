---
title: 固定列
order: 4
---

## 逻辑设计

开启 `sortableColumns` 后，固定列拖拽排序会限制 over 范围：固定列只能 over 到同为固定列且 `fixed` 值一致的列上，例如 `fixed: 'start'` 只能 over 到 `fixed: 'start'` 列，`fixed: 'end'` 只能 over 到 `fixed: 'end'` 列；非固定列不限制，可以 over 到任意列。

## 固定列拖拽热区

开启 `sortableColumns` 后，拖拽中的列会显示 active 高亮；当 active 列是固定列时，表格会额外显示可 over 的热区。热区只会出现在同一排序层级、同一固定方向的列上：`fixed: 'start'` 只提示同为 `fixed: 'start'` 的兄弟列，`fixed: 'end'` 只提示同为 `fixed: 'end'` 的兄弟列。

在分组表头中，排序层级由父分组决定。拖拽子列时，只会高亮当前子列和同父分组下可 over 的子列，父分组表头不会被当作热区；拖拽父分组时，热区会覆盖该分组对应的子列区域。热区会同步显示在表头单元格、筛选行单元格和 body 单元格上。

非固定列拖拽时不会额外展开固定列热区，只显示 active 列高亮。

<code src="../../examples/fixedColumns.tsx"></code>
