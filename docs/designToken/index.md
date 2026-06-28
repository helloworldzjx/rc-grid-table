---
nav:
  title: Design Token
  order: 6
---

# Design Token

`rc-grid-table` 的主题分为三层 token：

| 层级             | 类型                  | 说明                                   |
| ---------------- | --------------------- | -------------------------------------- |
| Seed Token       | `DesignToken`         | 用户可配置的基础变量                   |
| Derivative Token | `DerivativeToken`     | 由算法从 seed token 派生出的运行时变量 |
| Component Token  | `TableComponentToken` | Table 组件自己的样式变量               |

通常你只需要通过 `ConfigProvider theme.token` 和 `theme.components.Table` 配置 token。

```tsx | pure
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 4,
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

## DesignToken

`DesignToken` 是主题的 seed token。

| Token           | 类型     | 默认值    | 说明                                                   |
| --------------- | -------- | --------- | ------------------------------------------------------ |
| `colorPrimary`  | `string` | `#1890ff` | 主色                                                   |
| `colorTextBase` | `string` | `''`      | 基础文本色，空值时由算法决定                           |
| `colorBgBase`   | `string` | `''`      | 基础背景色，空值时由算法决定                           |
| `borderRadius`  | `number` | `6`       | 基础圆角                                               |
| `borderWidth`   | `number` | `1`       | 基础边框宽度                                           |
| `fontSizeBase`  | `number` | `14`      | 基础字号。运行时行高由 `fontSizeBase` 按 antd 公式计算 |

## DerivativeToken

`DerivativeToken` 由 `DesignToken` 经过 `ThemeAlgorithm` 计算得到。Table 样式实际消费的大部分全局变量来自这一层。

`colorTextBase` 和 `colorBgBase` 的默认 seed 是空字符串，和 antd 的 seed 语义保持一致：`defaultAlgorithm` 会把空值解析为 `#000` / `#fff`，`darkAlgorithm` 会把空值解析为 `#fff` / `#000`。

| Token               | 说明                                       |
| ------------------- | ------------------------------------------ |
| `fontSizeSM`        | small 运行时字号                           |
| `fontSize`          | 默认运行时字号                             |
| `fontSizeLG`        | large 运行时字号                           |
| `fontSizeXL`        | extra large 运行时字号                     |
| `lineHeightSM`      | small 运行时行高                           |
| `lineHeight`        | 默认运行时行高                             |
| `lineHeightLG`      | large 运行时行高                           |
| `fontHeightSM`      | small 运行时行高像素值                     |
| `fontHeight`        | 默认运行时行高像素值                       |
| `fontHeightLG`      | large 运行时行高像素值                     |
| `colorText`         | 正文文本色                                 |
| `colorBgContainer`  | 容器背景                                   |
| `colorBgLayout`     | 布局背景                                   |
| `colorBorder`       | 边框色                                     |
| `borderRadiusXS`    | 极小圆角                                   |
| `borderRadiusSM`    | 小圆角                                     |
| `borderRadiusLG`    | 大圆角，Ant Design 用于表头等较大圆角场景  |
| `borderRadiusOuter` | 外层圆角，Ant Design 用于卡片 / 弹层等场景 |

`DerivativeToken` 同时包含所有 `DesignToken` 字段。

## TableComponentToken

`TableComponentToken` 控制 Table 自身样式。默认值会基于当前 `DerivativeToken` 和明暗状态动态派生，再被 `theme.components.Table` 覆盖。

| Token                        | 类型               | 说明                          |
| ---------------------------- | ------------------ | ----------------------------- |
| `placeholderColorBg`         | `string`           | 占位拖拽区背景                |
| `cellBorderRadius`           | `number`           | 单元格圆角                    |
| `cellPaddingBlockSM`         | `number \| string` | small 尺寸单元格纵向 padding  |
| `cellPaddingInlineSM`        | `number \| string` | small 尺寸单元格横向 padding  |
| `cellPaddingBlockMD`         | `number \| string` | middle 尺寸单元格纵向 padding |
| `cellPaddingInlineMD`        | `number \| string` | middle 尺寸单元格横向 padding |
| `cellPaddingBlock`           | `number \| string` | 默认尺寸单元格纵向 padding    |
| `cellPaddingInline`          | `number \| string` | 默认尺寸单元格横向 padding    |
| `cellColorHoverBg`           | `string`           | body 行 hover 背景            |
| `cellColorActiveBg`          | `string`           | body 行 active 背景           |
| `fixedColumnShadowColor`     | `string`           | 固定列阴影颜色                |
| `sortableCellColorBg`        | `string`           | 列排序激活背景                |
| `overableCellColorBg`        | `string`           | 列拖拽可放置背景              |
| `previewHiddenCellColorBg`   | `string`           | 列状态预览隐藏背景            |
| `previewRestoredCellColorBg` | `string`           | 列状态预览恢复背景            |
| `scrollbarThumbColor`        | `string`           | 滚动条 thumb 默认颜色         |
| `scrollbarThumbHoverColor`   | `string`           | 滚动条 thumb hover 颜色       |
| `scrollbarThumbActiveColor`  | `string`           | 滚动条 thumb active 颜色      |

`TableComponentToken` 也允许覆盖部分 `DerivativeToken` 字段，因为它继承自 `Partial<DerivativeToken>`。例如你可以只让 Table 使用不同的 `colorBorder`。

```tsx | pure
<ConfigProvider
  theme={{
    components: {
      Table: {
        colorBorder: '#d9d9d9',
        cellPaddingBlock: 8,
        fixedColumnShadowColor: 'rgba(0, 0, 0, 0.16)',
        scrollbarThumbColor: 'rgba(0, 0, 0, 0.28)',
        scrollbarThumbHoverColor: 'rgba(0, 0, 0, 0.45)',
        scrollbarThumbActiveColor: 'rgba(0, 0, 0, 0.55)',
      },
    },
  }}
>
  <Table />
</ConfigProvider>
```

## 合并顺序

Table 样式最终使用的 token 按以下顺序合并，后者覆盖前者：

| 顺序 | 来源                                       |
| ---- | ------------------------------------------ |
| 1    | 全局 `DerivativeToken`                     |
| 2    | 当前明暗模式下的默认 `TableComponentToken` |
| 3    | `theme.components.Table`                   |

开启 CSS 变量时，组件级 Table token 也会参与 CSS 变量注册。

## 与 ConfigProvider 的继承关系

Design Token 的运行时值全部来自最近的 `ConfigProvider`。没有 `ConfigProvider` 时，使用默认 seed token 和默认 light 算法。

### 总优先级

| 配置项                        | 优先级                                |
| ----------------------------- | ------------------------------------- |
| 当前 `theme.token`            | 高于外层 token                        |
| 当前 `theme.components.Table` | 高于外层 Table component token        |
| 当前顶层 `cssVar`             | 高于当前 `theme.cssVar` 和外层 cssVar |
| 当前 `theme.cssVar`           | 高于外层 cssVar                       |
| 当前 `theme.hashed`           | 高于外层 hashed                       |
| 当前 `theme.algorithm`        | 高于按 `themeMode` 自动选择的算法     |

### 所有情况枚举

#### 1. 没有 ConfigProvider

| 项                    | 结果                                   |
| --------------------- | -------------------------------------- |
| seed token            | `defaultDesignToken`                   |
| derivative token      | `defaultAlgorithm(defaultDesignToken)` |
| Table component token | light 默认 Table token                 |
| cssVar                | 关闭                                   |
| hashId                | 空字符串                               |

#### 2. 只有外层 ConfigProvider

```tsx | pure
<ConfigProvider theme={{ token: { colorPrimary: '#f00' } }}>
  <Table />
</ConfigProvider>
```

| 项                    | 结果                                           |
| --------------------- | ---------------------------------------------- |
| seed token            | `defaultDesignToken + outer theme.token`       |
| derivative token      | 按外层 algorithm 或外层 themeMode 自动算法派生 |
| Table component token | 默认 Table token + 外层 `components.Table`     |

#### 3. 内层未配置 theme

```tsx | pure
<ConfigProvider theme={{ token: { colorPrimary: '#f00' } }}>
  <ConfigProvider>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项                    | 结果                                 |
| --------------------- | ------------------------------------ |
| seed token            | 继承外层                             |
| derivative token      | 继承外层 theme 对象和 token 计算结果 |
| Table component token | 继承外层                             |
| cssVar                | 继承外层                             |
| hashed                | 继承外层                             |

#### 4. 内层只配置 `theme.token`

```tsx | pure
<ConfigProvider theme={{ token: { colorPrimary: '#f00' } }}>
  <ConfigProvider theme={{ token: { borderRadius: 4 } }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项               | 结果                                             |
| ---------------- | ------------------------------------------------ |
| seed token       | `defaultDesignToken + outer token + inner token` |
| 同名字段         | inner 覆盖 outer                                 |
| derivative token | 基于合并后的 seed token 派生                     |

#### 5. 内层只配置 `theme.components.Table`

```tsx | pure
<ConfigProvider theme={{ components: { Table: { cellPaddingBlock: 16 } } }}>
  <ConfigProvider theme={{ components: { Table: { cellPaddingInline: 8 } } }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项                    | 结果                                                     |
| --------------------- | -------------------------------------------------------- |
| Table component token | 默认 Table token + outer Table token + inner Table token |
| 同名字段              | inner 覆盖 outer                                         |
| 全局 derivative token | 仍继承外层，除非 inner 也配置 token 或 algorithm         |

#### 6. 内层配置 `theme.algorithm`

```tsx | pure
<ConfigProvider themeMode="dark">
  <ConfigProvider theme={{ algorithm: Theme.defaultAlgorithm }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项               | 结果                                   |
| ---------------- | -------------------------------------- |
| seed token       | 默认继承外层 token，再合并 inner token |
| derivative token | 使用 inner algorithm 重新派生          |
| `isDark`         | 未设置 inner themeMode 时仍继承外层    |

#### 7. 内层配置 `themeMode`

```tsx | pure
<ConfigProvider themeMode="dark">
  <ConfigProvider themeMode="light">
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项                    | 结果                                                        |
| --------------------- | ----------------------------------------------------------- |
| `isDark`              | 使用 inner themeMode                                        |
| 默认算法              | 按 inner themeMode 选择                                     |
| seed token            | 默认继承外层 token                                          |
| Table component token | 默认按 inner 明暗状态重新派生，再合并继承的 component token |

#### 8. 内层配置顶层 `cssVar`

```tsx | pure
<ConfigProvider cssVar={{ prefix: 'outer' }}>
  <ConfigProvider cssVar={{ prefix: 'inner' }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项         | 结果                                        |
| ---------- | ------------------------------------------- |
| cssVar     | 使用 inner 顶层 `cssVar`                    |
| 优先级     | 顶层 `cssVar` 高于 `theme.cssVar`           |
| token 计算 | token 内容不变，只改变输出为 CSS 变量的方式 |

#### 9. 内层配置 `theme.cssVar`

```tsx | pure
<ConfigProvider cssVar={{ prefix: 'outer' }}>
  <ConfigProvider theme={{ cssVar: { prefix: 'inner' } }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项     | 结果                                 |
| ------ | ------------------------------------ |
| cssVar | 使用 inner `theme.cssVar`            |
| 优先级 | 低于顶层 `cssVar`，高于 outer cssVar |

#### 10. 内层配置 `theme.hashed`

```tsx | pure
<ConfigProvider theme={{ hashed: false }}>
  <Table />
</ConfigProvider>
```

| 项       | 结果                                   |
| -------- | -------------------------------------- |
| `false`  | Table 不输出 hash class                |
| `true`   | Table 输出 hash class                  |
| `string` | Table 输出 hash class，字符串作为 salt |
| 未设置   | 继承外层；没有外层时为 `true`          |

#### 11. 内层配置 `theme.inherit={false}`

```tsx | pure
<ConfigProvider themeMode="dark" theme={{ token: { colorPrimary: '#f00' } }}>
  <ConfigProvider theme={{ inherit: false }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项                    | 结果                                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| seed token            | `defaultDesignToken + inner token`，不合并 outer token                    |
| derivative token      | 不复用 outer theme                                                        |
| Table component token | 默认 Table token + inner `components.Table`，不合并 outer component token |
| `isDark`              | 未设置 inner themeMode 时为 `false`                                       |
| cssVar                | 未设置时关闭                                                              |
| hashed                | 未设置时为 `true`                                                         |

#### 12. `theme.inherit={false}` 同时配置 token 和 components

```tsx | pure
<ConfigProvider theme={{ token: { colorPrimary: '#f00' } }}>
  <ConfigProvider
    theme={{
      inherit: false,
      token: { colorPrimary: '#1677ff' },
      components: {
        Table: { cellPaddingBlock: 8 },
      },
    }}
  >
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项                     | 结果                                 |
| ---------------------- | ------------------------------------ |
| seed token             | `defaultDesignToken + inner token`   |
| Table component token  | 默认 Table token + inner Table token |
| outer token/components | 完全不参与                           |

## CSS 变量中的 token

开启 CSS 变量后，全局 token 和 Table component token 都会注册为 CSS 变量。Table component token 变化时会进入样式缓存路径，运行时切换 `theme.components.Table` 会触发样式更新。

```tsx | pure
<ConfigProvider
  cssVar
  theme={{
    components: {
      Table: {
        cellPaddingBlock: 6,
      },
    },
  }}
>
  <Table />
</ConfigProvider>
```

内部 antd `Spin`、`Empty` 的主题也会桥接到 antd `ConfigProvider`。如果当前没有显式设置 `theme`、`themeMode`、`cssVar`，并且外部已经存在 antd `ConfigProvider`，则不会覆盖外部 antd 主题。
