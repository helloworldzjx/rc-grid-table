---
title: Ready 骨架屏
order: 1
---

使用 `ready` 和 `readySkeleton` Table 会在首次完成真实 Table 布局前展示骨架屏；当 `ready` 变为 `true` 后，骨架屏消失并渲染真实 Table。

`readySkeleton` 支持传入 `boolean`，也支持传入配置对象：

```tsx | pure
<Table ready={ready} readySkeleton />
<Table ready={ready} readySkeleton={{ filterRow: true }} />
```

## 影响骨架屏的 props

- `ready`：控制真实 Table 是否进入初始化流程。骨架屏只在 `ready=false`、`readySkeleton` 开启、且表格尚未初始化时展示。
- `readySkeleton`：开启骨架屏；传入 `{ filterRow: true }` 时会在 head 下方额外渲染一行 filter 骨架行。
- `size`：影响 head 和 body 骨架行高，并同步 Table 的尺寸 class。
- `bordered`：骨架屏会继承边框样式。
- `stripe`：骨架屏 body 会继承斑马纹样式。
- `scrollY`：影响 body 骨架区域高度和 body 骨架行数；未设置时使用默认 body 骨架高度。

骨架屏列数和列宽根据 Table 容器宽度计算生成，不读取 `columns` 配置。

以下 props 不会改变骨架屏结构：`columns`、`dataSource`、`rowSelection`、`expandable`、`rowSortable`、`summary`、`sticky`、`components`、`onHeaderRow`、`onCell` 等真实 Table 渲染配置。

## 支持的骨架屏节点

当前骨架屏只模拟普通表格的这些节点：

- `head`：默认表头骨架行。
- `filterRow`：仅当 `readySkeleton={{ filterRow: true }}` 时渲染；每个 cell 的骨架宽度为 `100%`。
- `body`：表体骨架行。

骨架屏不渲染分组表头、固定列阴影、选择列、展开列、行拖拽列、summary、empty、横向滚动条等节点。

<code src="../../examples/readySkeleton.tsx"></code>
