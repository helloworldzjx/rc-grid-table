---
title: 虚拟列表
order: 20
---

虚拟列表默认开启。传入数字 `scrollY` 后，表格只渲染可视区域附近的行，并根据真实行高动态更新滚动条大小和位置。

虚拟模式支持常见 `rowSpan` 合并：源单元格设置 `rowSpan > 1`，被覆盖单元格设置 `rowSpan = 0`。复杂交叉合并建议设置 `virtual={false}`。

## 复杂交叉合并示例

下面示例使用 Markdown 表格描述合并形态。`rowSpan: 0` 或 `colSpan: 0` 表示该单元格被前面的合并源覆盖，不再单独渲染。

### 示例一：左侧跨行 + 行内跨列

| 行  | A 列         | B 列         | C 列         | D 列         |
| --- | ------------ | ------------ | ------------ | ------------ |
| 0   | `rowSpan: 3` | 普通         | 普通         | 普通         |
| 1   | `rowSpan: 0` | `colSpan: 3` | `colSpan: 0` | `colSpan: 0` |
| 2   | `rowSpan: 0` | 普通         | `colSpan: 2` | `colSpan: 0` |

### 示例二：二维块合并 + 相邻跨列

| 行  | A 列                     | B 列                     | C 列         | D 列         | E 列         |
| --- | ------------------------ | ------------------------ | ------------ | ------------ | ------------ |
| 0   | `rowSpan: 2, colSpan: 2` | `colSpan: 0`             | 普通         | `colSpan: 2` | `colSpan: 0` |
| 1   | `rowSpan: 0`             | `rowSpan: 0, colSpan: 0` | `rowSpan: 2` | 普通         | 普通         |
| 2   | 普通                     | 普通                     | `rowSpan: 0` | `colSpan: 2` | `colSpan: 0` |

### 示例三：多列交错跨行

| 行  | A 列         | B 列         | C 列         | D 列         | E 列         |
| --- | ------------ | ------------ | ------------ | ------------ | ------------ |
| 0   | `rowSpan: 2` | 普通         | 普通         | 普通         | 普通         |
| 1   | `rowSpan: 0` | `rowSpan: 3` | 普通         | `colSpan: 2` | `colSpan: 0` |
| 2   | 普通         | `rowSpan: 0` | `rowSpan: 2` | 普通         | 普通         |
| 3   | 普通         | `rowSpan: 0` | `rowSpan: 0` | `colSpan: 2` | `colSpan: 0` |

<code src="../../examples/virtual.tsx"></code>
