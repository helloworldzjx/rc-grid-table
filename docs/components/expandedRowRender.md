---
title: 表格嵌套
order: 14
---

## 使用方式

配置 `expandable.expandedRowRender` 后，表格会在展开行中渲染自定义内容；如果只需要树形数据层级，不配置 `expandedRowRender` 时会按 `children` 渲染树节点。

## 常用配置

- `defaultExpandedRowKeys` / `expandedRowKeys`：设置默认展开或受控展开的行 key。
- `rowExpandable(record)`：返回 `false` 可不渲染某一行的展开按钮。
- `fixed`：设置展开列固定位置。

<code src="../../examples/expandedRowRender.tsx"></code>
