---
title: 表头分组
order: 8
---

## 使用方式

通过在 column 中配置 `children` 可以生成表头分组。带 `children` 的列会作为分组表头渲染，它本身通常只需要提供 `title` 和唯一的 `key`；真正读取数据、渲染 body 单元格的是最底层叶子列，叶子列通过 `dataIndex` 对应 `dataSource` 中的字段，也可以通过 `render` 自定义内容。

分组可以嵌套多层，表格会根据 `children` 自动计算表头行数、`rowSpan` 和 `colSpan`。列宽主要由叶子列决定；叶子列未设置 `width` 时，会使用 `leafColumnMinWidth` 作为分组表头场景下的初始最小宽度。

## 注意事项

所有列最终得到的列 key 都必须唯一，包括父分组列和所有子列。父分组列没有 `dataIndex` 时应显式设置 `key`；叶子列如果省略 `key`，表格会使用合法的 `dataIndex` 作为 key。重复的 `key` 或重复的 `dataIndex` 兜底可能导致列状态覆盖，出现列拖拽热区异常、排序预览错乱、固定列偏移或布局异常。

开启 `sortableColumns` 后，父分组列会按整组参与排序，子列只会在同一个父分组下排序。分组固定列时，建议父分组和其叶子列设置一致的 `fixed` 值，例如都设置为 `fixed: 'start'`；这样表头、body 和拖拽热区的固定区域会保持一致。

<code src="../../examples/groupHead.tsx"></code>
