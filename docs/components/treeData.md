---
title: 树形数据
order: 13
---

## 使用方式

当 `dataSource` 的记录中包含 `children` 数组时，表格会按树形数据渲染。默认读取字段名为 `children`，可以通过 `expandable.childrenColumnName` 修改。

当没有配置 `expandedRowRender` 时，表格会使用树形模式渲染 `children`；如果配置了 `expandedRowRender`，则会切换为展开行内容模式，此时 `children` 不再作为树节点层级渲染

## 与行选择配合

树形数据可以和 `rowSelection` 一起使用。`checkStrictly` 默认为 `true`，父节点和子节点选择状态彼此独立；设置 `checkStrictly: false` 后，父子节点选择状态会联动。

<code src="../../examples/treeData.tsx"></code>
