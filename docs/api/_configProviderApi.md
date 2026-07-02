## API

| 参数            | 类型                                           | 默认值                 | 说明                                           |
| --------------- | ---------------------------------------------- | ---------------------- | ---------------------------------------------- |
| `rootPrefixCls` | `string`                                       | `rc`                   | class 基础前缀；Table 会派生为 `rc-grid-table` |
| `themeMode`     | `'light' \| 'dark' \| 'system'`                | 继承外层，否则 `light` | 明暗状态                                       |
| `theme`         | `ThemeConfig`                                  | -                      | 主题配置                                       |
| `cssVar`        | `boolean \| { prefix?: string; key?: string }` | 继承外层               | 顶层 CSS 变量配置，优先级高于 `theme.cssVar`   |
| `table`         | `TableConfig`                                  | -                      | Table 默认配置                                 |

## TableConfig

| 参数      | 类型                                                       | 说明              |
| --------- | ---------------------------------------------------------- | ----------------- |
| `loading` | `boolean \| Omit<SpinProps, 'prefixCls'>`                  | 默认 loading 配置 |
| `empty`   | `Pick<EmptyProps, 'children' \| 'description' \| 'image'>` | 默认 empty 配置   |

## ThemeConfig

| 参数               | 类型                                           | 说明                                        |
| ------------------ | ---------------------------------------------- | ------------------------------------------- |
| `token`            | `Partial<DesignToken>`                         | 覆盖 seed token                             |
| `components.Table` | `Partial<TableComponentToken>`                 | 覆盖 Table 组件 token                       |
| `algorithm`        | `ThemeAlgorithm \| ThemeAlgorithm[]`           | seed token 到 derivative token 的算法       |
| `inherit`          | `boolean`                                      | 是否继承外层主题配置                        |
| `hashed`           | `string \| boolean`                            | 是否生成 hash class，字符串会作为 hash salt |
| `cssVar`           | `boolean \| { prefix?: string; key?: string }` | 主题内 CSS 变量配置                         |
