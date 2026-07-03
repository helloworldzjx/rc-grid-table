## API

`ConfigProvider` 继承 antd `ConfigProvider` 的全部 props，并额外提供 `gridTable`。

| 参数        | 类型               | 默认值      | 说明                                                   |
| ----------- | ------------------ | ----------- | ------------------------------------------------------ |
| `prefixCls` | `string`           | antd 默认值 | antd 基础前缀；显式设置时也作为 GridTable 默认前缀来源 |
| `theme`     | `antd ThemeConfig` | -           | 直接透传给 antd `ConfigProvider`                       |
| `gridTable` | `GridTableConfig`  | -           | GridTable 默认配置和组件 token                         |

## GridTableConfig

| 参数         | 类型                                                       | 说明                                                             |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `className`  | `string`                                                   | GridTable 默认 className，优先级低于 `Table className`           |
| `style`      | `CSSProperties`                                            | GridTable 默认 style，优先级低于 `Table style`                   |
| `loading`    | `boolean \| Omit<SpinProps, 'prefixCls'>`                  | 默认 loading 配置                                                |
| `empty`      | `Pick<EmptyProps, 'children' \| 'description' \| 'image'>` | 默认 empty 配置                                                  |
| `expandable` | `{ expandIcon?: ExpandableConfig['expandIcon'] }`          | GridTable 默认展开图标，优先级低于 `Table expandable.expandIcon` |
| `token`      | `Partial<TableComponentToken>`                             | 覆盖 GridTable 组件 token                                        |

## antd ConfigProvider inheritance

- `Table size` 优先；不传时继承 antd `ConfigProvider componentSize`，再兜底为 `large`。
- 空状态兜底顺序：`Table empty` > `gridTable.empty` > antd `renderEmpty('Table')` > 默认 `<Empty />`。
- `rowSelection` 的 Checkbox/Radio 在未显式设置 `disabled` 时，继承 antd `componentDisabled`。

## Theme

`theme` 从 `antd` 原样导出：

```ts
import { ConfigProvider, theme } from 'rc-grid-table';
```

暗色、紧凑、CSS 变量、hash、继承等行为都使用 antd v5 原生 `theme` 配置。
