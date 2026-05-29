---
title: 虚拟列表
order: 20
---

虚拟列表默认开启。传入数字 `scrollY` 后，表格只渲染可视区域附近的行，并根据真实行高动态更新滚动条大小和位置。

虚拟模式支持常见 `rowSpan` 合并：源单元格设置 `rowSpan > 1`，被覆盖单元格设置 `rowSpan = 0`。复杂交叉合并建议设置 `virtual={false}`。

<code src="../../examples/virtual.tsx"></code>
