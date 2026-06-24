---
nav:
  title: 示例
  order: 2
title: 基本用法
order: 0
---

## 列的 key 和 dataIndex

`dataIndex` 用来从 `dataSource` 的每一条数据中读取当前列的值；没有自定义 `render` 时，表格会按 `record[dataIndex]` 渲染单元格内容。

`key` 是列在表格内部的唯一身份，当列没有设置 `key` 时，表格会尝试使用合法的 `dataIndex` 作为列 key；如果 `key` 和 `dataIndex` 都不存在，会退化使用列索引作为 key。不建议依赖索引兜底。

`key` 和 `dataIndex` 可以相同，例如 `{ dataIndex: 'name', key: 'name' }`。需要注意的是，所有列最终得到的列 key 都必须唯一，包括分组表头中的父列和子列。如果两个列复用了相同的 `key`，或者省略 `key` 后复用了相同的 `dataIndex`，可能导致列状态互相覆盖，表现为列拖拽热区异常、排序预览错乱、固定列偏移或布局异常。

## 行的 rowKey

`rowKey` 用来标识 `dataSource` 中的每一条记录，默认读取 `record.key`。如果数据中的唯一字段不是 `key`，可以通过字符串或函数指定。

<code src="../../examples/basic.tsx"></code>
