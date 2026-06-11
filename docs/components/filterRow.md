---
title: 筛选行
order: 7
---

筛选行是一个无状态的表头扩展插槽，在 `columns` 配置中使用 `filterRender` 即可渲染筛选控件。表格只负责将筛选单元格渲染到与列布局对齐的位置，并同步固定列、列宽、拖拽排序预览等布局能力；筛选控件、筛选值、搜索、重置、远程请求或本地过滤都由业务侧控制。

当前示例使用 antd Form 组件，`components.header.filterRow` 为整行包裹 `Form`。示例展示了两种筛选模式：

- `on change`：输入控件值变化后，立即使用当前表单值过滤数据。
- `on search`：输入控件值变化只更新筛选条件展示，不立即刷新数据；点击 `Search` 后才提交筛选值并渲染新数据，`Reset` 会清空筛选条件。

<code src="../../examples/filterRow.tsx"></code>
