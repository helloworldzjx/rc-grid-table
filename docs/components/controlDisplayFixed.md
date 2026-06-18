---
title: 控制列显隐/固定
order: 23
---

## 使用说明

本示例演示列显隐、列固定和隐藏列预览的处理方式。`Table` 不内置按钮、右键菜单或列配置面板，业务需要自己实现操作入口，再通过实例 API 修改列状态。

本示例默认开启 `fixableColumns` 和 `visibleColumns`，并通过表头右键菜单操作当前列。右键菜单的上下文直接来自 `onHeaderCell(column)` 提供的 `ColumnInfo`，所以业务列、选择列等内部列都可以使用同一套入口；内部列建议通过 `columnOverlayTitle` 配置菜单标题，例如“选择列”。

如果业务外部需要统计已显示列数量、判断当前列是否可隐藏，应该以表格返回的完整 `columnsState` 为准。`onColumnsStateReady` 适合用来初始化外部 `columnsState`，它包含选择列这类内部列；`onColumnsStateChange` 则用于后续状态更新和持久化。

隐藏列预览通过 `TableRef.startColumnsStatePreview()` 开启。`TableRef.startColumnsStatePreview(options?)` 默认使用 `mode: 'full'`；本示例使用 `mode: 'visibleHotOnly'`，热区是预览开始时处于隐藏状态的列，保存时只会提交这些列的 `visible` 变化。

预览态仍会临时显示隐藏列，并用 `ColumnInfo.previewHidden` / `ColumnInfo.previewRestored` 标记预览背景。业务外部可以自行维护 `previewing` state，用于切换“查看隐藏列 / 保存隐藏列 / 取消预览”等菜单状态。

`columnsStateKey` 变化时，表格内部会自动退出预览；如果业务外部也维护了 `previewing` 状态，需要在触发这些变化时同步清理。

## 相关 API

- `TableRef.setColumnVisible(key, visible)`：设置指定列是否可见。正常态立即提交；预览态写入草稿。
- `TableRef.setColumnFixed(key, fixed)`：设置指定列固定位置。正常态立即提交；预览态写入草稿。
- `TableRef.startColumnsStatePreview()`：进入隐藏列预览，返回是否成功进入。
- `TableRef.saveColumnsStatePreview()`：保存完整预览草稿，触发 `onColumnsStateChange`，类型为 `previewSave`。
- `TableRef.cancelColumnsStatePreview()`：取消隐藏列预览，不触发 `onColumnsStateChange`。
- `columnsConfig.onColumnsStateReady(payload)`：列状态初始化完成时触发，适合初始化业务外部的完整 `columnsState`。
- `columnsConfig.onColumnsStateChange(columnsState, info)`：列状态变化时触发，适合更新外部状态和持久化。

调用实例 API 时请确保列的 `key` 稳定且唯一。分组表头建议父列和子列都显式设置 `key`，这样外部 UI 才能准确控制目标列或目标分组。

使用 `mode: 'visibleHotOnly'` 时，列宽拖拽、占位列自动补齐、列排序拖拽和固定列变更会被表格逻辑阻止；业务 UI 仍建议禁用无关菜单项，让操作意图更清晰。

<code src="../../examples/controlDisplayFixed.tsx"></code>
