# ConfigProvider 与 Theme 设计边界

这份文档记录当前主题设计的维护边界。

## 结论

`rc-grid-table` 不维护独立主题系统。运行时主题能力全部交给 antd：

- `ConfigProvider` 继承 antd `ConfigProvider` 的 props。
- `theme` 从 `antd` 原样导出。
- 暗色、紧凑、CSS 变量、hash、继承规则都使用 antd 原生 `theme`。
- GridTable 专属配置放在 `gridTable`，避免和 antd 的 `table` / `theme.components.Table` 重名。

## ConfigProvider 职责

当前 `ConfigProvider` 只做三件事：

1. 包一层 antd `ConfigProvider`，透传 antd props。
2. 把显式 `prefixCls` 写入本项目 `ConfigContext`，供 GridTable 派生默认 class 前缀。
3. 合并 `gridTable` 默认配置。

`ConfigProvider` 不再处理：

- `themeMode`
- 顶层 `cssVar`
- 自定义 `DesignTokenContext`
- 自定义 theme algorithm
- `theme.components.Table`

## GridTable Token

GridTable 样式使用 `antd theme.useToken()` 读取全局 token，再基于这些 token 派生 `TableComponentToken`。默认颜色不自行判断亮暗，而是依赖 antd algorithm 生成的语义 token；表格背景类颜色会将可能带透明度的颜色叠加到 `colorBgContainer` 上转为实色，滚动条滑块颜色保留 antd 文本语义色里的透明度。

覆盖入口：

```tsx
<ConfigProvider
  gridTable={{
    token: {
      cellHoverBg: '#f5f5f5',
    },
  }}
>
  <Table />
</ConfigProvider>
```

`gridTable.token` 只影响 `rc-grid-table`，不会影响 antd Table。

## 命名规则

- antd 原生配置继续使用 antd 命名，例如 `theme`、`table`、`checkbox`。
- 本项目表格配置必须使用 `gridTable`。
- 不再新增 `Table` 命名的主题入口，避免与 antd Table 混淆。

## 验证点

- 无 `ConfigProvider` 或未显式设置 `prefixCls` 时，Table class 默认仍是 `rc-grid-table`。
- `ConfigProvider prefixCls="custom"` 时，antd 前缀与 Table 默认 class 前缀分别是 `custom` / `custom-grid-table`。
- `Table prefixCls` 优先于 `ConfigProvider prefixCls`。
- 外层 antd `ConfigProvider theme` 能影响 GridTable 派生 token。
- `Table size` 优先于 antd `componentSize`，未传时可继承 antd 全局尺寸。
- `gridTable.loading` / `gridTable.empty` / `gridTable.className` / `gridTable.style` 可作为 Table 默认值。
- 空状态兜底顺序为 `Table empty` > `gridTable.empty` > antd `renderEmpty('Table')` > 默认 `<Empty />`。
- `rowSelection` 控件未显式设置 `disabled` 时可继承 antd `componentDisabled`。
- `gridTable.expandable.expandIcon` 可作为全局默认展开图标，优先级低于 `Table expandable.expandIcon`。
- `gridTable.token` 覆盖仅影响 GridTable。
