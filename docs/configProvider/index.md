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
    rootPrefixCls="custom"
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

`ConfigProvider rootPrefixCls` 控制基础 class 前缀，只传 `rc`、`custom` 这一类 root prefix。Table 会在该前缀后自动添加 `-grid-table` 作为自身样式前缀；`Table prefixCls` 则是完整 Table 前缀，可以直接传 `rc-grid-table`、`custom-grid-table` 这一类值。由 Table 自己渲染的 antd `Spin`、`Empty`、rowSelection `Checkbox`、`Radio` 会继续基于最终 Table 前缀生成 class。

| 来源                                | 优先级 |
| ----------------------------------- | ------ |
| `Table prefixCls`                   | 最高   |
| 当前 `ConfigProvider rootPrefixCls` | 中     |
| 外层 `ConfigProvider rootPrefixCls` | 中     |
| 默认值 `rc`                         | 最低   |

默认情况下 Table 自身 class 前缀是 `rc-grid-table`。内部 `Spin`、默认/配置的 `Empty`、rowSelection `Checkbox`、`Radio` 会跟随最终 Table 前缀，例如默认情况下分别使用 `rc-grid-table-spin`、`rc-grid-table-empty`、`rc-grid-table-checkbox`、`rc-grid-table-radio`。当 `ConfigProvider rootPrefixCls="custom"` 或 `Table prefixCls="local-grid-table"` 时，Table class 前缀分别为 `custom-grid-table`、`local-grid-table`。

## Theme

`ConfigProvider` 的 `theme` 参考 antd v5 的轻量模型，支持 seed token、算法、组件 token、hash 和 CSS 变量。

### 三层主题架构

```
┌─────────────────────────────────────────┐
│  Seed Tokens (DesignToken)              │  6 个基础设计值
│  colorPrimary, colorTextBase, ...       │
└─────────────┬───────────────────────────┘
              │ 通过 Algorithm
              ▼
┌─────────────────────────────────────────┐
│  Derivative Tokens (DerivativeToken)    │  40+ 个派生值
│  fontSize, lineHeight, colorText, ...   │  font / color / radius 规范
└─────────────┬───────────────────────────┘
              │ 应用到
              ▼
┌─────────────────────────────────────────┐
│  Component Tokens (TableComponentToken) │  表格特定的间距、尺寸
│  cellPaddingBlock, cellPaddingInline    │
└─────────────────────────────────────────┘
```

### 基础配置

```tsx | pure
<ConfigProvider
  themeMode="light"
  theme={{
    token: {
      colorPrimary: '#722ed1',
      fontSizeBase: 14,
      borderRadius: 6,
    },
    components: {
      Table: {
        cellPaddingBlock: 10,
        cellPaddingInline: 16,
      },
    },
  }}
>
  <Table />
</ConfigProvider>
```

### 主题应用范围

rc-grid-table 主题会同时作用于：

1. **Table 自身样式**：使用完整的派生 token（字号、行高、颜色、圆角）
2. **内部 antd 组件**：`Spin`（加载）、`Empty`（空状态）、rowSelection `Checkbox` / `Radio`（选择控件）通过 antd `ConfigProvider` 桥接
3. **antd 桥接 Token**：主色、暗色状态、基础字号等同步给内部 antd 组件

#### antd 桥接规则

内部 antd 组件使用 antd `ConfigProvider` 接收种子 token：

| rc-grid-table Token | 映射到 antd Token         | 说明                            |
| ------------------- | ------------------------- | ------------------------------- |
| `colorPrimary`      | `colorPrimary`            | 主色保持一致                    |
| `fontSizeBase`      | `fontSize`                | 基础字号                        |
| `themeMode=dark`    | `algorithm=darkAlgorithm` | 暗色状态自动选择 antd dark 算法 |

这样确保内置的 `Spin`、`Empty` 以及 rowSelection 的 `Checkbox` / `Radio` 与 Table 样式风格统一。

## 主题示例

### 常见定制场景

**场景 1：调整基础字号和圆角**

```tsx | pure
<ConfigProvider
  theme={{
    token: {
      fontSizeBase: 16, // 所有字号都会相应调整
      borderRadius: 8, // 圆角规格随之调整
    },
  }}
>
  <Table />
</ConfigProvider>
```

**场景 2：定制表格间距**

```tsx | pure
<ConfigProvider
  theme={{
    components: {
      Table: {
        cellPaddingBlock: 12, // 单元格上下内间距
        cellPaddingInline: 20, // 单元格左右内间距
      },
    },
  }}
>
  <Table />
</ConfigProvider>
```

**场景 3：完整暗色主题**

```tsx | pure
<ConfigProvider
  themeMode="dark"
  theme={{
    algorithm: Theme.darkAlgorithm,
    token: {
      colorPrimary: '#177ddc', // 暗色主题建议用略亮的主色
    },
  }}
>
  <Table />
</ConfigProvider>
```

### 与全局 antd 主题协作

```tsx | pure
import { ConfigProvider as AntdConfigProvider } from 'antd';
import { ConfigProvider, Table } from 'rc-grid-table';

export default () => (
  <AntdConfigProvider
    theme={{
      token: {
        colorPrimary: '#722ed1',
      },
    }}
  >
    {/* rc-grid-table 会自动继承这个主题 */}
    <ConfigProvider>
      <Table />
    </ConfigProvider>
  </AntdConfigProvider>
);
```

如果在 rc-grid-table 的 `ConfigProvider` 显式设置 `theme`，则会创建独立主题，不继承外层 antd 主题。

### 外层 antd ConfigProvider 兼容

如果外部已经有 antd `ConfigProvider`，rc-grid-table 会智能判断是否覆盖：

| 条件                                      | 行为                                  |
| ----------------------------------------- | ------------------------------------- |
| 显式设置 `theme`、`themeMode` 或 `cssVar` | 创建新主题，不覆盖外层 antd 主题      |
| 未设置 `theme`、`themeMode` 或 `cssVar`   | 继承外层 antd `ConfigProvider` 的主题 |

这意味着你可以：

- 在全局 antd `ConfigProvider` 统一设置主题，rc-grid-table 会自动继承
- 在 rc-grid-table 的 `ConfigProvider` 独立配置，不影响其他 antd 组件

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

rowSelection 的 checkbox/radio 控件实际渲染为 antd `Checkbox` / `Radio`。`getCheckboxProps`、`getTitleCheckboxProps`、`getRadioProps` 可以透传对应 antd 控件 props，但 `onChange` 由 Table 选择逻辑接管，控件主题会跟随当前或外层 antd `ConfigProvider`。

<embed src="../api/_configProviderApi.md"></embed>
