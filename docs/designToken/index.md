---
nav:
  title: Design Token
  order: 6
---

# Design Token

`rc-grid-table` 现在只维护 GridTable 自己的组件 token。全局主题 token、算法、CSS 变量、hash 和继承规则都来自 antd。

| 层级              | 配置入口                         | 说明                                               |
| ----------------- | -------------------------------- | -------------------------------------------------- |
| antd global token | `ConfigProvider theme.token`     | antd 原生全局 token                                |
| antd algorithm    | `ConfigProvider theme.algorithm` | `theme.defaultAlgorithm`、`theme.darkAlgorithm` 等 |
| GridTable token   | `ConfigProvider gridTable.token` | 只影响 `rc-grid-table`                             |

## 示例

```tsx | pure
import { ConfigProvider, Table, theme } from 'rc-grid-table';

<ConfigProvider
  theme={{
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 4,
    },
  }}
  gridTable={{
    token: {
      borderRadius: 8,
      cellPaddingBlock: 10,
      cellPaddingInline: 16,
      cellHoverBg: '#f5f5f5',
      cellActiveBg: '#ededed',
    },
  }}
>
  <Table />
</ConfigProvider>;
```

## TableComponentToken

`TableComponentToken` 会先基于当前 antd token 派生默认值，再被 `gridTable.token` 覆盖。

| Token                       | 类型               | 默认值          | 说明                      |
| --------------------------- | ------------------ | --------------- | ------------------------- |
| `placeholderBg`             | `string`           | antd token 派生 | 占位拖拽区背景            |
| `borderColor`               | `string`           | antd token 派生 | 表格边框/分割线颜色       |
| `borderRadius`              | `number`           | `8`             | 圆角                      |
| `cellPaddingBlockSM`        | `number \| string` | `8`             | small 单元格纵向 padding  |
| `cellPaddingInlineSM`       | `number \| string` | `8`             | small 单元格横向 padding  |
| `cellPaddingBlockMD`        | `number \| string` | `12`            | middle 单元格纵向 padding |
| `cellPaddingInlineMD`       | `number \| string` | `8`             | middle 单元格横向 padding |
| `cellPaddingBlock`          | `number \| string` | `16`            | large 单元格纵向 padding  |
| `cellPaddingInline`         | `number \| string` | `16`            | large 单元格横向 padding  |
| `cellStripeBg`              | `string`           | antd token 派生 | 表格 stripe 背景色        |
| `cellStrongBg`              | `string`           | antd token 派生 | 表格 head、summary 背景色 |
| `cellHoverBg`               | `string`           | antd token 派生 | 表格行悬浮背景色          |
| `cellActiveBg`              | `string`           | antd token 派生 | 表格行 active 背景色      |
| `fixedColumnShadowColor`    | `string`           | antd token 派生 | 固定列阴影色              |
| `sortableCellBg`            | `string`           | antd token 派生 | 排序激活列背景            |
| `overableCellBg`            | `string`           | antd token 派生 | 排序可放置列背景          |
| `previewHiddenCellBg`       | `string`           | antd token 派生 | 预览隐藏列背景            |
| `previewRestoredCellBg`     | `string`           | antd token 派生 | 预览恢复列背景            |
| `scrollbarThumbColor`       | `string`           | antd token 派生 | 滚动条滑块背景            |
| `scrollbarThumbHoverColor`  | `string`           | antd token 派生 | 滚动条滑块 hover 背景     |
| `scrollbarThumbActiveColor` | `string`           | antd token 派生 | 滚动条滑块 active 背景    |

默认颜色会优先复用 antd 语义 token。表格背景类颜色会将可能带透明度的颜色叠加到 `colorBgContainer` 上转为实色；滚动条滑块颜色会保留透明度。如果你需要精确控制表格颜色，可以直接在 `gridTable.token` 覆盖对应颜色。
