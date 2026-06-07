---
title: 固定列
order: 4
---

开启 `sortableColumns` 后，固定列拖拽排序会限制 over 范围：固定列只能 over 到同为固定列且 `fixed` 值一致的列上，例如 `fixed: 'start'` 只能 over 到 `fixed: 'start'` 列，`fixed: 'end'` 只能 over 到 `fixed: 'end'` 列；非固定列不限制，可以 over 到任意列。

<code src="../../examples/fixedColumns.tsx"></code>
