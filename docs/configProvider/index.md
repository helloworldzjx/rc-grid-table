---
nav:
  title: ConfigProvider
  order: 4
---

# ConfigProvider

`rc-grid-table` 导出的 `ConfigProvider` 是 antd `ConfigProvider` 的轻量增强版：antd 支持的 props 全部透传，GridTable 自己的默认配置放在 `gridTable` 下。

## 基础使用

```tsx | pure
import { ConfigProvider, Table, theme } from 'rc-grid-table';

export default () => (
  <ConfigProvider
    prefixCls="custom"
    theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
      },
    }}
    gridTable={{
      loading: { tip: 'Loading...' },
      empty: { description: 'No data' },
      token: {
        cellPaddingBlock: 12,
        cellPaddingInline: 16,
      },
    }}
  >
    <Table columns={[]} dataSource={[]} />
  </ConfigProvider>
);
```

## Prefix

`ConfigProvider prefixCls` 走 antd 原生语义；显式传入时，也会作为 GridTable 默认前缀来源。

不传 `prefixCls` 时，antd 组件仍使用 antd 自己的默认前缀，GridTable 默认 class 前缀是 `rc-grid-table`。

优先级：

| 来源                            | 优先级 |
| ------------------------------- | ------ |
| `Table prefixCls`               | 最高   |
| 当前 `ConfigProvider prefixCls` | 中     |
| 外层 `ConfigProvider prefixCls` | 中     |
| 默认值 `rc`                     | 最低   |

## Theme

主题能力全部交给 antd：

```tsx | pure
import { ConfigProvider, Table, theme } from 'rc-grid-table';

<ConfigProvider
  theme={{
    algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
    cssVar: true,
    token: {
      colorPrimary: '#722ed1',
    },
  }}
>
  <Table />
</ConfigProvider>;
```

`rc-grid-table` 不维护自己的 `Theme`、`themeMode` 或顶层 `cssVar`。需要暗色模式时，请显式使用 `theme.darkAlgorithm`；需要 CSS 变量时，请使用 antd 的 `theme.cssVar`。

## GridTable

GridTable 专属配置统一放在 `gridTable`，避免和 antd 自己的 `table` 配置重名。

```tsx | pure
<ConfigProvider
  gridTable={{
    className: 'app-grid-table',
    style: { marginBlock: 16 },
    loading: true,
    empty: { description: '暂无数据' },
    token: {
      cellHoverBg: '#f5f5f5',
      scrollbarThumbColor: '#d9d9d9',
    },
  }}
>
  <Table />
</ConfigProvider>
```

`gridTable.token` 只影响 `rc-grid-table`，不会写入 antd `theme.components.Table`，也不会影响 antd 的 Table 组件。

`gridTable.loading`、`gridTable.empty`、`gridTable.className`、`gridTable.style` 和 `gridTable.expandable.expandIcon` 都作为 GridTable 默认值使用；显式传入 `Table` props 时优先级更高。`gridTable.expandable` 只提供全局默认展开图标，不负责开启展开能力。

## antd 全局能力继承

无论外层使用 `rc-grid-table` 导出的 `ConfigProvider`，还是直接使用 antd `ConfigProvider`，GridTable 都会读取 antd 上下文：

- `Table size` 不传时继承 antd `componentSize`，再兜底为 `large`。
- 空状态兜底顺序为 `Table empty` > `gridTable.empty` > antd `renderEmpty('Table')` > 默认 `<Empty />`。
- `rowSelection` 的 Checkbox/Radio 未显式传入 `disabled` 时，会继承 antd `componentDisabled`。
