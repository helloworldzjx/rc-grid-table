---
nav:
  title: Theme
  order: 5
---

# Theme

`Theme` 是 `rc-grid-table` 暴露的主题工具集合。实际主题配置从 `ConfigProvider` 进入，组件内部通过 `Theme.useToken()` 或内部 token hook 消费。

```tsx | pure
import { ConfigProvider, Theme, Table } from 'rc-grid-table';

const Preview = () => {
  const { token, isDark, hashId } = Theme.useToken();

  return (
    <div className={hashId}>
      {isDark ? 'dark' : 'light'} - {token.colorPrimary}
    </div>
  );
};

export default () => (
  <ConfigProvider themeMode="dark">
    <Preview />
    <Table />
  </ConfigProvider>
);
```

## 导出内容

| API                             | 说明                                                |
| ------------------------------- | --------------------------------------------------- |
| `Theme.useToken()`              | 获取当前主题对象、派生 token、hashId 和 `isDark`    |
| `Theme.defaultAlgorithm`        | light 模式默认算法                                  |
| `Theme.darkAlgorithm`           | dark 模式默认算法                                   |
| `Theme.getDesignToken(config?)` | 在 React 外根据 `ThemeConfig` 计算 derivative token |
| `Theme.DesignTokenContext`      | 底层主题 context，通常不需要直接使用                |

## useToken

`Theme.useToken()` 返回对象：

```ts
{
  theme,
  token,
  hashId,
  isDark,
}
```

`isDark` 是本项目保留的扩展值，表示当前 `ConfigProvider themeMode` 解析后的明暗状态。它不会从 `theme.algorithm` 自动推断。

## DesignToken (Seed Tokens)

**Seed tokens** 是主题的基础配置，代表设计系统的核心语义值。通过修改这些值可以快速改变整体主题。

| Token           | 类型     | 默认值    | 说明                                         |
| --------------- | -------- | --------- | -------------------------------------------- |
| `colorPrimary`  | `string` | `#1890ff` | 主色，用于交互元素、链接等                   |
| `colorTextBase` | `string` | `#000`    | light 模式基础文字色；dark 模式会改为 `#fff` |
| `colorBgBase`   | `string` | `#fff`    | light 模式基础背景色；dark 模式会改为 `#000` |
| `fontSizeBase`  | `number` | `14`      | 基础字号（px）；其他字号、行高由此派生       |
| `borderRadius`  | `number` | `6`       | 基础圆角（px）；其他圆角规格由此派生         |
| `borderWidth`   | `number` | `1`       | 基础边框宽度（px）                           |

### 修改 Seed Token 示例

```tsx | pure
import { ConfigProvider, Table } from 'rc-grid-table';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#722ed1',
      fontSizeBase: 16,
      borderRadius: 8,
    },
  }}
>
  <Table />
</ConfigProvider>;
```

## DerivativeToken (Derived Tokens)

**Derivative tokens** 由 seed tokens 通过算法派生生成，涵盖完整的排版、颜色、间距规范。

### 字号与行高

| Token          | 来源                          | 说明                                  |
| -------------- | ----------------------------- | ------------------------------------- |
| `fontSize`     | `fontSizeBase`                | 标准字号，等于 `fontSizeBase`         |
| `fontSizeSM`   | `fontSizeBase`                | 小字号，约 `fontSizeBase * 0.857`     |
| `fontSizeLG`   | `fontSizeBase`                | 大字号，约 `fontSizeBase * 1.143`     |
| `fontSizeXL`   | `fontSizeBase`                | 特大字号，约 `fontSizeBase * 1.286`   |
| `lineHeight`   | `fontSizeBase`                | 标准行高，约 1.5715（基于 antd 公式） |
| `lineHeightSM` | `fontSizeBase`                | 小行高，约 1.5588                     |
| `lineHeightLG` | `fontSizeBase`                | 大行高，约 1.5945                     |
| `fontHeight`   | `fontSize` × `lineHeight`     | 字体框高（用于垂直对齐计算）          |
| `fontHeightSM` | `fontSizeSM` × `lineHeightSM` | 小号字体框高                          |
| `fontHeightLG` | `fontSizeLG` × `lineHeightLG` | 大号字体框高                          |

> 行高计算遵循 antd 公式，不同字号的行高会微调以保持视觉平衡。

### 颜色

| Token              | 来源            | 说明                                             |
| ------------------ | --------------- | ------------------------------------------------ |
| `colorText`        | `colorTextBase` | 文字色，在 `colorTextBase` 基础上调整透明度      |
| `colorBgContainer` | `colorBgBase`   | 容器背景色，在 light/dark 算法中有不同的亮度调整 |
| `colorBgLayout`    | `colorBgBase`   | 页面布局背景色，比容器背景更浅/深                |
| `colorBorder`      | `colorBgBase`   | 边框色，在 light/dark 算法中对应不同灰度         |

### 圆角

| Token               | 来源           | 说明                            |
| ------------------- | -------------- | ------------------------------- |
| `borderRadiusXS`    | `borderRadius` | 极小圆角，约 50%                |
| `borderRadiusSM`    | `borderRadius` | 小圆角，约 75%                  |
| `borderRadiusLG`    | `borderRadius` | 大圆角，约 125%                 |
| `borderRadiusOuter` | `borderRadius` | 外轮廓圆角（同 `borderRadius`） |

## Algorithm

算法负责把 `DesignToken` 派生为 `DerivativeToken`。两个内置算法提供 light/dark 的完整方案。

```tsx | pure
import { ConfigProvider, Theme } from 'rc-grid-table';

<ConfigProvider
  theme={{
    algorithm: Theme.darkAlgorithm,
  }}
>
  <Table />
</ConfigProvider>;
```

### 内置算法

| 算法                     | 适用场景   | 颜色调整特点                             |
| ------------------------ | ---------- | ---------------------------------------- |
| `Theme.defaultAlgorithm` | Light mode | 以白色背景和黑色文字为基础               |
| `Theme.darkAlgorithm`    | Dark mode  | 以黑色背景和白色文字为基础，颜色反向调整 |

两个算法都会根据 seed token 派生出完整的排版、圆角、颜色规范。

### 算法选择规则

如果没有传 `theme.algorithm`，`ConfigProvider` 会根据 `themeMode` 选择算法：

| 条件                                                       | 使用算法                |
| ---------------------------------------------------------- | ----------------------- |
| `theme.algorithm` 已设置                                   | 使用 `theme.algorithm`  |
| `theme.algorithm` 未设置且 `themeMode` 解析为 dark         | `darkAlgorithm`         |
| `theme.algorithm` 未设置且 `themeMode` 解析为 light        | `defaultAlgorithm`      |
| `theme.algorithm` 未设置、`themeMode` 未设置、继承外层主题 | 直接复用外层 theme 对象 |

注意：`theme.algorithm` 只控制 token 派生算法，不改变 `isDark`。例如 `themeMode="light"` 加 `theme.algorithm={Theme.darkAlgorithm}` 时，token 会按 dark 算法派生，但 `Theme.useToken().isDark` 仍然是 `false`。

## 与 ConfigProvider 的关系

`Theme` 不直接保存全局状态，所有运行时主题状态都来自最近的 `ConfigProvider`。没有 `ConfigProvider` 时，会使用默认 light 主题。

### 继承关系总览

以下规则按当前 `ConfigProvider` 计算，外层指最近的父级 `ConfigProvider`。

| 配置项                    | 默认继承                                                       | `theme.inherit === false`                                    |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `themeMode` / `isDark`    | 未设置 `themeMode` 时继承外层                                  | 未设置 `themeMode` 时重置为 light                            |
| `theme.algorithm`         | 未设置算法且允许继承时复用外层 theme 对象                      | 不复用外层 theme，按当前 `themeMode` 或默认 light 创建 theme |
| `theme.token`             | 外层 token 与当前 token 浅合并                                 | 只使用当前 token 与默认 token                                |
| `theme.components`        | 外层 components 与当前 components 合并，`Table` 单独深一层合并 | 只使用当前 components                                        |
| `theme.cssVar` / `cssVar` | 未设置时继承外层 cssVar                                        | 未设置时不继承                                               |
| `theme.hashed`            | 未设置时继承外层 hashed                                        | 未设置时重置为 `true`                                        |

### 所有情况枚举

#### 1. 没有任何 ConfigProvider

| 项        | 结果                 |
| --------- | -------------------- |
| `isDark`  | `false`              |
| algorithm | `defaultAlgorithm`   |
| token     | `defaultDesignToken` |
| cssVar    | 关闭                 |
| hashId    | 空字符串             |

#### 2. 外层有 ConfigProvider，内层没有 ConfigProvider

所有主题状态直接来自外层。`Theme.useToken()` 读取外层 `DesignTokenContext`。

#### 3. 内层 ConfigProvider 没有设置 `theme`、`themeMode`、`cssVar`

```tsx | pure
<ConfigProvider themeMode="dark" theme={{ token: { colorPrimary: '#f00' } }}>
  <ConfigProvider>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项         | 结果                |
| ---------- | ------------------- |
| `isDark`   | 继承外层            |
| theme 对象 | 复用外层 theme 对象 |
| token      | 继承外层 token      |
| components | 继承外层 components |
| cssVar     | 继承外层 cssVar     |
| hashed     | 继承外层 hashed     |

#### 4. 内层设置 `themeMode`

```tsx | pure
<ConfigProvider themeMode="dark">
  <ConfigProvider themeMode="light">
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项         | 结果                                               |
| ---------- | -------------------------------------------------- |
| `isDark`   | 使用内层 `themeMode`                               |
| algorithm  | 未设置 `theme.algorithm` 时按内层 `themeMode` 选择 |
| token      | 默认仍继承外层 token，再合并内层 token             |
| components | 默认仍继承外层 components，再合并内层 components   |
| cssVar     | 未设置时仍继承外层 cssVar                          |
| hashed     | 未设置时仍继承外层 hashed                          |

#### 5. 内层设置 `theme.algorithm`

```tsx | pure
<ConfigProvider themeMode="dark">
  <ConfigProvider theme={{ algorithm: Theme.defaultAlgorithm }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项         | 结果                                   |
| ---------- | -------------------------------------- |
| `isDark`   | 未设置内层 `themeMode` 时继承外层      |
| algorithm  | 使用内层 `theme.algorithm`             |
| token      | 默认继承外层 token，再合并内层 token   |
| theme 对象 | 使用内层 algorithm 创建新的 theme 对象 |

#### 6. 内层设置 `theme.token`

```tsx | pure
<ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
  <ConfigProvider theme={{ token: { borderRadius: 4 } }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项               | 结果                               |
| ---------------- | ---------------------------------- |
| token            | `{ ...outerToken, ...innerToken }` |
| 未覆盖的 token   | 保留外层值                         |
| derivative token | 由合并后的 seed token 计算         |

#### 7. 内层设置 `theme.components.Table`

```tsx | pure
<ConfigProvider theme={{ components: { Table: { cellPaddingBlock: 16 } } }}>
  <ConfigProvider theme={{ components: { Table: { cellPaddingInline: 8 } } }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项                 | 结果                                         |
| ------------------ | -------------------------------------------- |
| components         | 外层 components 与内层 components 合并       |
| `components.Table` | `{ ...outerTableToken, ...innerTableToken }` |
| 同名字段           | 内层覆盖外层                                 |

#### 8. 内层设置顶层 `cssVar`

```tsx | pure
<ConfigProvider theme={{ cssVar: { prefix: 'outer' } }}>
  <ConfigProvider cssVar={{ prefix: 'inner' }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项     | 结果                                            |
| ------ | ----------------------------------------------- |
| cssVar | 使用内层顶层 `cssVar`                           |
| 优先级 | 顶层 `cssVar` 高于 `theme.cssVar` 和外层 cssVar |

#### 9. 内层设置 `theme.cssVar`

```tsx | pure
<ConfigProvider cssVar={{ prefix: 'outer' }}>
  <ConfigProvider theme={{ cssVar: { prefix: 'inner' } }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项     | 结果                               |
| ------ | ---------------------------------- |
| cssVar | 使用内层 `theme.cssVar`            |
| 优先级 | 低于顶层 `cssVar`，高于外层 cssVar |

#### 10. 内层设置 `theme.hashed`

```tsx | pure
<ConfigProvider theme={{ hashed: false }}>
  <Table />
</ConfigProvider>
```

| 项       | 结果                                     |
| -------- | ---------------------------------------- |
| `false`  | 不输出 hashId                            |
| `true`   | 输出 hashId                              |
| `string` | 输出 hashId，并把字符串作为 cssinjs salt |
| 未设置   | 默认继承外层；没有外层时为 `true`        |

#### 11. 内层设置 `theme.inherit={false}`

```tsx | pure
<ConfigProvider themeMode="dark" theme={{ token: { colorPrimary: '#f00' } }}>
  <ConfigProvider theme={{ inherit: false }}>
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项         | 结果                                                       |
| ---------- | ---------------------------------------------------------- |
| `isDark`   | 未设置内层 `themeMode` 时重置为 `false`                    |
| algorithm  | 不复用外层 theme，按内层 `themeMode` 或 light 默认算法创建 |
| token      | 不合并外层 token，只使用内层 token 和默认 token            |
| components | 不合并外层 components，只使用内层 components               |
| cssVar     | 未设置时关闭，不继承外层                                   |
| hashed     | 未设置时重置为 `true`                                      |

#### 12. `theme.inherit={false}` 同时设置内层字段

```tsx | pure
<ConfigProvider themeMode="dark" theme={{ token: { colorPrimary: '#f00' } }}>
  <ConfigProvider
    themeMode="dark"
    theme={{
      inherit: false,
      token: { colorPrimary: '#1677ff' },
      cssVar: true,
    }}
  >
    <Table />
  </ConfigProvider>
</ConfigProvider>
```

| 项       | 结果                        |
| -------- | --------------------------- |
| `isDark` | 使用内层 `themeMode="dark"` |
| token    | 使用默认 token 加内层 token |
| cssVar   | 使用内层 `theme.cssVar`     |
| hashed   | 未设置时为 `true`           |

## getDesignToken

`Theme.getDesignToken(config)` 可在 React 外计算 token。

```ts
import { Theme } from 'rc-grid-table';

const token = Theme.getDesignToken({
  token: {
    colorPrimary: '#52c41a',
  },
  algorithm: Theme.defaultAlgorithm,
});
```

`getDesignToken` 不读取 `ConfigProvider`，也不会处理嵌套继承。它只使用传入的 `ThemeConfig.token`、`ThemeConfig.algorithm` 和默认 seed token 计算全局 derivative token，不处理 `components`、`cssVar`、`hashed`。
