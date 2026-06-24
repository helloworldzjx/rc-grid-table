---
nav:
  title: ConfigProvider
  order: 4
---

# ConfigProvider

`ConfigProvider` 是 `rc-grid-table` 的全局配置入口。当前项目只提供 Table 组件，因此它不会复刻 antd 的完整全局配置体系，只保留与表格相关的能力：前缀、主题、CSS 变量、表格默认 loading 和 empty。

## 基础使用

```tsx | pure
import { ConfigProvider, Table } from 'rc-grid-table';

export default () => (
  <ConfigProvider
    prefixCls="custom-table"
    themeMode="dark"
    theme={{
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
      },
      components: {
        Table: {
          cellPaddingBlock: 12,
          cellPaddingInline: 16,
        },
      },
    }}
    table={{
      loading: { tip: 'Loading...' },
      empty: { description: 'No data' },
    }}
  >
    <Table columns={[]} dataSource={[]} />
  </ConfigProvider>
);
```

## Prefix

`prefixCls` 控制 Table 以及由 Table 自己渲染的 antd `Spin`、`Empty` class 前缀。

| 来源                            | 优先级 |
| ------------------------------- | ------ |
| `Table prefixCls`               | 最高   |
| 当前 `ConfigProvider prefixCls` | 中     |
| 外层 `ConfigProvider prefixCls` | 中     |
| 默认值 `rc-grid-table`          | 最低   |

内部 `Spin` 和默认/配置的 `Empty` 会跟随最终 Table 前缀，例如默认情况下分别使用 `rc-grid-table-spin`、`rc-grid-table-empty`。

## Theme

`ConfigProvider` 的 `theme` 参考 antd v5 的轻量模型，支持 seed token、算法、组件 token、hash 和 CSS 变量。

```tsx | pure
<ConfigProvider
  themeMode="light"
  theme={{
    token: {
      colorPrimary: '#722ed1',
    },
    components: {
      Table: {
        cellPaddingBlock: 10,
      },
    },
  }}
>
  <Table />
</ConfigProvider>
```

主题会同时作用于 Table 自身样式和内部 antd `Spin`、`Empty`。内部 antd 组件会通过 antd `ConfigProvider` 桥接主色、暗色和基础 token。

如果外部已经有 antd `ConfigProvider`，并且当前 `ConfigProvider` 没有显式设置 `theme`、`themeMode` 或 `cssVar`，则不会覆盖外部 antd 主题。

## Theme Mode

`themeMode` 只表示明暗状态，不会从自定义 `theme.algorithm` 自动推断。

| 值       | 行为                                                              |
| -------- | ----------------------------------------------------------------- |
| `light`  | `Theme.useToken().isDark` 为 `false`，默认使用 `defaultAlgorithm` |
| `dark`   | `Theme.useToken().isDark` 为 `true`，默认使用 `darkAlgorithm`     |
| `system` | 根据 `prefers-color-scheme: dark` 判断，并监听系统变化            |
| 未设置   | 默认继承外层明暗状态，没有外层时为 `light`                        |

SSR 环境下无法读取 `prefers-color-scheme`，`system` 初始会按 light 处理，浏览器端挂载后再同步系统状态。

## CSS Variables

可以通过顶层 `cssVar` 或 `theme.cssVar` 开启 CSS 变量。

```tsx | pure
<ConfigProvider cssVar>
  <Table />
</ConfigProvider>

<ConfigProvider theme={{ cssVar: { prefix: 'app', key: 'table-theme' } }}>
  <Table />
</ConfigProvider>
```

优先级如下：

| 来源                            | 优先级 |
| ------------------------------- | ------ |
| `ConfigProvider cssVar`         | 最高   |
| `theme.cssVar`                  | 中     |
| 外层 `ConfigProvider` 的 cssVar | 低     |

`cssVar={true}` 会被规范化为：

```ts
{
  prefix: 'rc',
  key: 'css-var-root',
}
```

## Table Defaults

`table` 用来配置当前 `ConfigProvider` 下所有 Table 的默认 `loading` 和 `empty`。

```tsx | pure
import { Empty } from 'antd';

<ConfigProvider
  table={{
    loading: { tip: 'Loading...' },
    empty: {
      image: Empty.PRESENTED_IMAGE_SIMPLE,
      description: 'No records',
    },
  }}
>
  <Table />
</ConfigProvider>;
```

`Table` 自身 props 的优先级最高。

| 配置                                           | 优先级 |
| ---------------------------------------------- | ------ |
| `Table loading` / `Table empty`                | 最高   |
| `ConfigProvider table.loading` / `table.empty` | 中     |
| 组件默认值                                     | 最低   |

`table.empty` 只支持 antd `Empty` 的 `image`、`description`、`children`。没有设置 `empty` 时，Table 会渲染默认空状态。

`table.loading` 保持和 Table 的 `loading` API 一致，支持 `boolean` 或 antd `SpinProps`，但不允许覆盖内部 `prefixCls`。实际渲染仍使用 antd `Spin`，因此外部 antd `ConfigProvider` 的 `spin` 默认配置仍会被继承。

<embed src="../api/_configProviderApi.md"></embed>
