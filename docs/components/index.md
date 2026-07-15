---
nav:
  title: 示例
  order: 2
title: 基本用法
description: rc-grid-table 基本用法示例，展示 React Grid Table 的 columns、dataSource、rowKey 以及列 key 配置方式。
order: 0
---

## 列的 key 和 dataIndex

`dataIndex` 用来从 `dataSource` 的每一条数据中读取当前列的值；没有自定义 `render` 时，表格会按 `record[dataIndex]` 渲染单元格内容。

`key` 是列在表格内部的唯一身份，当列没有设置 `key` 时，表格会尝试使用合法的 `dataIndex` 作为列 key；如果 `key` 和 `dataIndex` 都不存在，会退化使用列索引作为 key。不建议依赖索引兜底。

`key` 和 `dataIndex` 可以相同，例如 `{ dataIndex: 'name', key: 'name' }`。需要注意的是，所有列最终得到的列 key 都必须唯一，包括分组表头中的父列和子列。如果两个列复用了相同的 `key`，或者省略 `key` 后复用了相同的 `dataIndex`，可能导致列状态互相覆盖，表现为列拖拽热区异常、排序预览错乱、固定列偏移或布局异常。

## 行的 rowKey

`rowKey` 用来标识 `dataSource` 中的每一条记录，默认读取 `record.key`。如果数据中的唯一字段不是 `key`，可以通过字符串或函数指定。

## 列的显示与交互控制

以下配置都写在单个 column 上，用来描述当前列在表格中的结构状态和交互能力：

- `hidden`：静态隐藏当前列。设置为 `true` 后，当前列及其子列不会进入表格的可渲染列结构，也无法通过 `visible=true` 显示，通常用于权限控制或业务上固定不展示的列。
- `resizeDisabled`：禁止当前列参与列宽拖拽调整。开启 `resizableColumns` 时，该列禁止 resize 操作。
- `resizeMinWidth`：设置当前列拖拽调整宽度时的最小宽度，未设置时会按表格 `size` 使用默认下限宽度。
- `dragSortDisabled`：禁止当前列参与列拖拽排序。开启 `sortableColumns` 时，该列不能作为拖拽列移动。

这些字段描述的是当前 `columns` 的运行时约束，不等同于用户通过列状态配置产生的显隐、排序或宽度偏好。

<code src="../../examples/basic.tsx"></code>
