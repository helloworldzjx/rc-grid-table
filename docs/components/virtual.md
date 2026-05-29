---
title: 虚拟列表
order: 20
---

虚拟列表默认开启。传入数字 `scrollY` 后，表格只渲染可视区域附近的行，并根据真实行高动态更新滚动条大小和位置。

跨行 `rowSpan` 合并不适合虚拟渲染；这类表格请设置 `virtual={false}`。

<code src="../../examples/virtual.tsx"></code>
