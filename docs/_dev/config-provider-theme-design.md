# ConfigProvider 与 Theme 设计约束

## 目的

这份文档记录 `ConfigProvider`、`Theme`、Table 样式 token、内部 antd `Spin` / `Empty` / rowSelection `Checkbox` / `Radio` 桥接的设计约束。

以后修改这些模块时，优先遵守这里的模型。除非明确要做一次破坏性设计升级，否则不要用局部补丁绕开这些规则。

相关文件：

- `src/configProvider/index.tsx`
- `src/configProvider/context.ts`
- `src/theme/index.tsx`
- `src/theme/hooks/useToken.ts`
- `src/theme/interface.ts`
- `src/table/index.tsx`
- `src/table/Table.tsx`
- `src/table/Selection/Checkbox.tsx`
- `src/table/Selection/Radio.tsx`
- `src/table/design/index.ts`
- `src/table/style/index.ts`

## 范围

当前项目只提供 Table UI 组件，不复刻 antd 完整的 `ConfigProvider` 能力。

保留的全局能力只有：

- Table class 前缀。
- Table 默认 `loading`。
- Table 默认 `empty`。
- 主题 seed token、算法、组件 token。
- CSS Variable。
- 内部 antd `Spin`、`Empty`、rowSelection `Checkbox`、`Radio` 的主题桥接。

不要引入 antd 的全局 `locale`、`size`、`disabled`、`renderEmpty`、`wave` 等多组件配置，除非项目未来真的新增对应组件族。

## 运行时分层

运行时有四层状态：

```txt
ConfigContext
  - prefixCls
  - table.loading
  - table.empty

DesignTokenContext
  - token
  - theme
  - isDark
  - hashed
  - cssVar
  - components.Table

AntdConfigProvider bridge
  - 只服务内部 antd Spin / Empty / rowSelection Checkbox / Radio

Table contexts
  - 最终 prefixCls
  - 当前 Table props
  - 表格布局、列状态、选择、展开、拖拽等运行时状态
```

`ConfigProvider` 负责合并前两层，并在需要时包一层 antd `ConfigProvider`。Table 自身仍然负责建立 `PrefixClsContext` 和 `TableContext`，这样表格内部组件可以继续从 Table 上下文读取最终前缀。

## 关键不变量

这些规则不能随意改变：

- `Theme.useToken()` 必须返回 `{ theme, token, hashId, isDark }`。
- `themeMode` 只表示明暗状态，不从 `theme.algorithm` 反推 `isDark`。
- `theme.algorithm` 只决定 token 派生算法。
- `DesignToken.colorTextBase` 和 `DesignToken.colorBgBase` 的默认值必须是空字符串。
- 亮色算法把空 `colorTextBase` / `colorBgBase` 解析为 `#000` / `#fff`。
- 暗色算法把空 `colorTextBase` / `colorBgBase` 解析为 `#fff` / `#000`。
- 传给 antd 的必须是 seed token，不要把本项目 derivative token 当作 antd seed token。
- 不要在 antd bridge 里写“暗色补丁”翻转 `colorTextBase`、`colorBgBase`。
- Table component token 的默认值计算必须允许 `theme.components.Table` 先参与派生，然后再最终覆盖一次。
- 内部 `Spin`、`Empty`、rowSelection `Checkbox`、`Radio` 的 `prefixCls` 必须跟随最终 Table 前缀。
- 不支持外部 `renderEmpty`。Table 的空状态只支持 `children`、`description`、`image`。

## Seed Token 语义

本项目的 `DesignToken` 是 seed token，不是最终样式 token。

| 字段             | 语义                                | 桥接到 antd     |
| ---------------- | ----------------------------------- | --------------- |
| `colorPrimary`   | 主色 seed                           | `colorPrimary`  |
| `colorTextBase`  | 文本基色 seed，空值由算法按明暗解析 | `colorTextBase` |
| `colorBgBase`    | 背景基色 seed，空值由算法按明暗解析 | `colorBgBase`   |
| `borderRadius`   | 基础圆角                            | `borderRadius`  |
| `borderWidth`    | 基础线宽                            | `lineWidth`     |
| `fontSizeBase`   | 基础字号                            | `fontSize`      |
| `lineHeightBase` | 基础行高                            | `lineHeight`    |

这个设计刻意对齐 antd seed token：`colorTextBase` / `colorBgBase` 默认留空，由算法决定亮暗默认值。

不要把默认 seed 改成 `#000` / `#fff`。否则暗色模式下再交给 antd `darkAlgorithm` 时，会出现语义反转和组件颜色异常。

## Algorithm 与 isDark

默认算法选择规则：

| 条件                                           | algorithm              | isDark                          |
| ---------------------------------------------- | ---------------------- | ------------------------------- |
| `theme.algorithm` 已设置                       | 使用 `theme.algorithm` | 仍由 `themeMode` / 继承规则决定 |
| 未设置 algorithm，`themeMode` 解析为 dark      | `darkAlgorithm`        | `true`                          |
| 未设置 algorithm，`themeMode` 解析为 light     | `defaultAlgorithm`     | `false`                         |
| 未设置 algorithm 和 `themeMode`，且允许继承    | 复用外层 theme 对象    | 继承外层 `isDark`               |
| `theme.inherit === false` 且未设置 `themeMode` | `defaultAlgorithm`     | `false`                         |

示例：`themeMode="light"` 加 `theme.algorithm={Theme.darkAlgorithm}` 时，token 会按暗色算法派生，但 `isDark` 仍是 `false`。这是有意设计，避免 algorithm 和 UI 明暗状态互相隐式影响。

## ConfigProvider 合并规则

### prefixCls

优先级：

```txt
Table props.prefixCls
  > 当前 ConfigProvider prefixCls
  > 外层 ConfigProvider prefixCls
  > defaultPrefixCls ('rc-grid-table')
```

Table 会把最终结果写入 `PrefixClsContext.Provider`，表格内部组件继续通过 `usePrefixClsContext()` 读取。

### table.loading / table.empty

优先级：

```txt
Table props.loading / props.empty
  > 当前 ConfigProvider table.loading / table.empty
  > 外层 ConfigProvider table.loading / table.empty
  > Table 默认值
```

`table.loading` 使用 Table 的 `loading` API，也就是 `boolean | Omit<SpinProps, 'prefixCls'>`。

`table.empty` 只允许：

```ts
Pick<EmptyProps, 'children' | 'description' | 'image'>;
```

不要恢复 `renderEmpty`。它会把空状态渲染能力扩大到任意 ReactNode，和 Table 当前只控制内置空状态展示的边界不一致。

### token

允许继承时：

```txt
mergedToken = outer token + current theme.token
```

不允许继承时：

```txt
mergedToken = current theme.token
```

真正参与 `useCacheToken` 的 seed 是：

```txt
defaultDesignToken + mergedToken
```

### components.Table

允许继承时：

```txt
mergedComponents.Table = outer components.Table + current theme.components.Table
```

不允许继承时：

```txt
mergedComponents = current theme.components
```

当前项目只有 Table 组件，所以 `ThemeComponents` 只应包含 `Table`，不要提前设计其他组件字段。

### cssVar

优先级：

```txt
ConfigProvider cssVar
  > theme.cssVar
  > outer cssVar
```

`cssVar={true}` 会规范化为：

```ts
{ prefix: 'rc', key: 'css-var-root' }
```

`theme.inherit === false` 且没有显式设置 cssVar 时，不继承外层 cssVar。

### hashed

优先级：

```txt
theme.hashed
  > outer hashed
  > true
```

`hashed` 可以是 boolean 或 string。string 作为 cssinjs salt，boolean 控制是否返回 `hashId`。

## antd ConfigProvider 桥接

项目内部使用了 antd `Spin`、`Empty`，rowSelection 选择控件使用 antd `Checkbox`、`Radio`，因此需要把本项目主题桥接到 antd。

桥接目标：

- 内部 antd 组件能拿到一致的主色。
- 内部 antd 组件能跟随 `themeMode` 明暗切换。
- 内部 antd 组件能拿到一致的基础圆角、字号、行高、线宽。
- 如果外部已经包了 antd `ConfigProvider`，并且当前 `ConfigProvider` 没有显式设置 `theme`、`themeMode`、`cssVar`，不要覆盖外部 antd 主题。

桥接给 antd 的只应该是 seed token。注意 `lineHeight` 不是直接传入 `lineHeightBase`，而是按 `fontSizeBase` 使用 antd 的行高公式计算：

```ts
{
  colorPrimary,
  colorTextBase,
  colorBgBase,
  borderRadius,
  lineWidth: borderWidth,
  fontSize: fontSizeBase,
  lineHeight: (fontSizeBase + 8) / fontSizeBase,
}
```

这样可以保持与 antd 的字体 / 行高算法一致。

antd algorithm 只按 `isDark` 选择：

```txt
isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
```

不要把本项目的 derivative token 传给 antd。例如 `colorText`、`colorBgContainer`、`colorBorder` 都不是 antd seed token。

也不要为了修复暗色问题在 bridge 里单独改写 `colorTextBase` / `colorBgBase`。正确做法是保持 seed 语义和 antd 一致：默认 seed 留空，由 light/dark algorithm 解析。

## 内部 antd 组件前缀

Table 内部继续使用 antd `Spin` 和 `Empty`，rowSelection 选择控件使用 antd `Checkbox` 和 `Radio`，但前缀必须走 Table 体系：

```tsx
<Spin prefixCls={`${prefixCls}-spin`} />
<Empty prefixCls={`${prefixCls}-empty`} />
<Checkbox prefixCls={`${prefixCls}-checkbox`} />
<Radio prefixCls={`${prefixCls}-radio`} />
```

这样默认 class 是：

```txt
rc-grid-table-spin
rc-grid-table-empty
rc-grid-table-checkbox
rc-grid-table-radio
```

当 `ConfigProvider prefixCls="custom-table"` 或 `Table prefixCls="local-table"` 时，内部 antd 组件也要同步变化。

Table loading API 不允许外部传 `prefixCls`。Table empty API 也不允许外部传 antd `Empty` 的完整 props，只允许 `children`、`description`、`image`。

rowSelection 的 `getCheckboxProps`、`getTitleCheckboxProps`、`getRadioProps` 接收 antd 对应控件 props，但 `onChange` 由 Table 选择逻辑接管。Table 只维护选择单元格容器、禁用态事件边界和最终前缀，控件视觉状态交给 antd 组件与 antd 主题。

## Table Component Token 流程

Table 的组件 token 流程要对齐 antd 的组件 token 模型。

antd 逻辑可以概括为：

```txt
global derivative token
  + component override
  -> prepareComponentToken(...)
  -> default component token
  + component override
  -> final component token
```

本项目对应实现：

```txt
realToken
  + components.Table
  -> prepareTableToken(componentBaseToken, isDark)
  -> defaultTableToken
  + components.Table
  -> mergedComponentToken
```

这么做的原因是：组件 token 覆盖不只是最终样式覆盖，也可能影响默认组件 token 的派生。

例如未来如果 `prepareTableToken` 根据某个组件级基础色计算 hover/active 色，那么 `theme.components.Table` 里的基础色应该先参与计算；同时，用户显式传入的最终 token 仍然要在最后拥有最高优先级。

不要改回简单的：

```txt
prepareTableToken(realToken, isDark) + components.Table
```

那会丢失 antd 风格的“组件 token 参与默认派生”能力。

## Table 亮暗默认 token

`prepareLightTableToken` 和 `prepareDarkTableToken` 是 Table 组件 token 的默认值生成器。

亮色模式：

- 背景、hover、active 可以基于亮色 `colorBgBase` 做 `darken`。
- 主色相关提示态可以基于 `colorPrimary` 做浅化。

暗色模式：

- 背景、hover、active 应基于暗色 `colorBgBase` 做 `lighten`。
- 不要把默认 seed 的白色背景拿去 `darken` 后当暗色背景。

如果发现 antd 暗色组件异常，先检查 seed 语义和 algorithm，不要在 Table token 或 antd bridge 上临时打补丁。

## CSS Variable 流程

开启 cssVar 后，Table 样式应该消费 css variable token。

当前流程：

```txt
useCacheToken(...)
  -> token
  -> realToken

prepareTableToken(...)
  -> mergedComponentToken

useCSSVarRegister(...)
  -> cssVarToken

最终样式 token:
  cssVar 开启: token + cssVarToken
  cssVar 关闭: token + mergedComponentToken
```

注册 CSS Variable 时，组件级 Table token 覆盖必须包含在注册结果里，否则开启 cssVar 后会出现 JS token 和 CSS variable token 不一致。

`useStyleRegister` 的 path 必须包含足够的信息区分：

- prefixCls。
- 明暗状态。
- 组件 token key。

否则嵌套主题或组件 token 变化时可能复用旧样式。

## 外部 antd ConfigProvider

需要区分两种情况。

### 当前 ConfigProvider 显式设置主题

只要当前 `ConfigProvider` 显式设置了 `theme`、`themeMode` 或 `cssVar`，就应该桥接 antd `ConfigProvider`，让内部 antd `Spin` / `Empty` / rowSelection `Checkbox` / `Radio` 跟随本项目主题。

### 当前 ConfigProvider 没有显式设置主题

如果外部已经有 antd `ConfigProvider.theme`，当前 `ConfigProvider` 不应该覆盖它。

这意味着：

- Table 自身仍使用本项目 `DesignTokenContext`。
- 内部 antd `Spin` / `Empty` / rowSelection `Checkbox` / `Radio` 继续继承外部 antd 主题。

这个设计是为了避免用户已有 antd 应用中引入 Table 时，被本项目默认 antd bridge 意外覆盖全局 antd 主题。

## 性能约束

这些地方应保持 memo：

- `ConfigContext.Provider` 的 value。
- `DesignTokenContext.Provider` 的 value。
- antd `theme` 配置对象。
- Table `componentBaseToken`、`defaultTableToken`、`mergedComponentToken`。
- Table className / css variable helper 对象。

不要为了简化代码把这些对象每次 render 都重新创建。主题和样式注册对象变化会扩大重渲染和样式重注册范围。

## 修改检查清单

修改相关代码后至少检查：

- 无 `ConfigProvider` 时 Table class 仍是 `rc-grid-table`。
- `ConfigProvider prefixCls` 可以改变 Table、Spin、Empty、Checkbox、Radio 前缀。
- `Table prefixCls` 优先级高于 `ConfigProvider prefixCls`。
- `themeMode="dark"` 时 `Theme.useToken().isDark === true`。
- `theme.algorithm` 不会自动改变 `isDark`。
- `theme.token.colorPrimary` 同时影响 Table 主色状态和内部 antd 组件。
- `theme.token.borderRadius`、`borderWidth`、`fontSizeBase`、`lineHeightBase` 能桥接给内部 antd 组件。
- rowSelection 的 checkbox/radio 使用 antd `Checkbox` / `Radio`，并能通过 antd `ConfigProvider` 获取主题。
- `theme.components.Table` 覆盖在 cssVar 开关两种情况下都生效。
- `ConfigProvider cssVar` 优先于 `theme.cssVar`。
- `theme.inherit === false` 不继承外层 token、components、cssVar、isDark。
- 外部已有 antd `ConfigProvider.theme` 且当前没有显式主题配置时，不被本项目覆盖。
- `table.empty` 只能配置 `children`、`description`、`image`。
- 没有恢复 `renderEmpty`。

建议验证命令：

```bash
npm run lint:es
npm run build
```
