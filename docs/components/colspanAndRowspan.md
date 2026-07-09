---
title: 行/列合并
order: 2
---

## 注意事项

body 区域列合并依赖 `colSpan` 改变单元格的实际渲染结构。开启 `sortableColumns` 或 `visibleColumns` 后，列顺序、列显隐可能改变合并范围和 `colSpan: 0` 占位单元格的对应关系，容易造成展示语义不符合预期，因此不推荐在包含 body 列合并的表格中同时使用这两个能力。

总结栏如果使用 `colSpan` 合并单元格，也同样不推荐与 `sortableColumns`、`visibleColumns` 一起使用；如需列状态配置能力，建议避免在总结栏使用 `colSpan`，或由业务侧自行维护合并逻辑与列状态之间的映射。

<code src="../../examples/colspanAndRowspan.tsx"></code>
