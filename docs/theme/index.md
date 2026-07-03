---
nav:
  title: Theme
  order: 5
---

# Theme

`rc-grid-table` 的 `theme` 是从 antd 原样导出的主题工具集合。

```tsx | pure
import { ConfigProvider, Table, theme } from 'rc-grid-table';

const Preview = () => {
  const { token, hashId } = theme.useToken();

  return <div className={hashId}>{token.colorPrimary}</div>;
};

export default () => (
  <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
    <Preview />
    <Table />
  </ConfigProvider>
);
```

## 导出内容

常用 API 与 antd 一致：

| API                             | 说明                       |
| ------------------------------- | -------------------------- |
| `theme.useToken()`              | 获取当前 antd 主题 token   |
| `theme.defaultAlgorithm`        | 默认算法                   |
| `theme.darkAlgorithm`           | 暗色算法                   |
| `theme.compactAlgorithm`        | 紧凑算法                   |
| `theme.getDesignToken(config?)` | 在 React 外计算 antd token |

GridTable 默认颜色基于 antd 语义 token 派生；表格背景类颜色会把可能带透明度的颜色叠加到 `colorBgContainer` 上转为实色，滚动条滑块颜色保留透明度。如果需要精确控制表格颜色，请使用 `gridTable.token`。

## GridTable Token

antd 全局 token 放在 `theme.token`，GridTable 专属 token 放在 `gridTable.token`：

```tsx | pure
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 4,
    },
  }}
  gridTable={{
    token: {
      cellPaddingBlock: 10,
      cellPaddingInline: 16,
      cellHoverBg: '#f5f5f5',
    },
  }}
>
  <Table />
</ConfigProvider>
```

这样可以避免 `theme.components.Table` 与 antd Table 组件 token 重名。
