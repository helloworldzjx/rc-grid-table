---
title: 行拖拽排序
order: 15
---

## 使用方式

配置 `rowSortable` 后，表格会自动插入一列行拖拽控制列。拖拽结束后，表格不会自行修改外部数据，需要在 `rowSortable.onChange` 中接收新的 `dataSource` 并回写到状态中。

## 常用配置

- `fixed`：拖拽控制列是否固定，常用 `fixed: 'start'`。
- `columnTitle`：拖拽控制列表头内容。
- `columnOverlayTitle`：列拖拽浮层中拖拽控制列的标题。
- `rowDraggable(record)`：返回 `false` 可禁用某一行拖拽。
- `overlayColumnKeys`：控制拖拽浮层中展示哪些业务列，通过列的 `key` 或 `dataIndex` 匹配。

`onChange` 的第二个参数会返回本次排序信息，包括 `activeKey`、`overKey`、拖拽前后的父节点、索引和插入位置。

## 树形数据排序

行拖拽支持树形数据。默认情况下，只允许同一个父节点下的兄弟行互相排序；开启 `allowCrossLevelSort` 后，可以跨层级移动行。

<code src="../../examples/rowSortable.tsx"></code>
