---
title: 数据排序
order: 11
---

数据排序采用受控方式：Table 不维护排序状态，也不内置排序 UI，只根据外部传入的排序配置渲染表头排序区域，并在提供本地比较函数时对数据进行稳定排序。

- 在列配置中设置 `sorter` 后，该列才会被视为可排序列。
- `sorter` 为函数时，Table 会使用该函数进行本地排序。
- `sorter` 为 `true` 时，只表示该列可排序并可渲染排序区域，适合服务端排序场景；Table 不会对该列做本地排序。
- `dataSort.sortOrder` 用于传入当前排序值，支持单列排序或数组形式的多列排序；数组顺序即多列排序优先级。
- `dataSort.sortRender` 用于统一渲染表头右侧的排序区域，列上的 `sortRender` 会覆盖全局 `sortRender`。
- `sortRender` 接收的 `columnKey` 优先使用列的 `key`，未配置 `key` 时使用 `dataIndex`。
- `sortDirections` 只作为当前列支持的排序方向元信息传给 `sortRender`，排序循环和状态更新由外部自行控制。

<code src="../../examples/dataSort.tsx"></code>
