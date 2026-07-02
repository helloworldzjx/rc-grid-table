---
title: 列配置持久化存储
order: 22
---

## 设计说明

列配置持久化用于保存用户对表格外观的偏好，例如列宽、列顺序、列显隐和列固定。持久化数据以 `ColumnState[]` 的形式由业务写入 `localStorage` 或后端，下次初始化时再通过 `columnsConfig.storageColumnsState` 传回表格。

持久化数据不会替代当前传入的 `columns`。`columns` 始终是列结构的来源，负责决定列是否存在、分组关系、业务属性以及 `hidden`、`resizeDisabled`、`resizeMinWidth` 等运行时约束；`ColumnState[]` 只用于恢复用户偏好。

`resizableColumns`、`sortableColumns`、`visibleColumns`、`fixableColumns` 只控制当前页面是否允许用户继续修改对应能力，不控制历史字段是否恢复和写回。比如只开启 `resizableColumns` 时，用户拖拽列宽产生的 `info.patches` 只包含宽度变化，但 `onColumnsStateChange` 输出的完整 `columnsState` 仍会保留历史顺序、显隐和固定状态。清空外部存储或切换一套新的持久化数据后，需要同步更新 `columnsConfig.columnsStateKey`，让表格重新初始化内部列状态。

即使没有开启任何列配置 UI 能力，只要显式传入 `columnsConfig.storageColumnsState`，表格也会初始化列状态管线并按当前 `columns` 生成可回写的完整状态。`storageColumnsState: []` 表示业务传入了一份空快照，会按当前列结构生成默认列状态；不传 `storageColumnsState` 且未开启任一列配置能力时，表格不会为了回调或实例 API 额外初始化列状态。

## 相关 API

- `columnsConfig.storageColumnsState`：从 `localStorage` 或后端读取出的列状态初始化快照。显式传入数组会启用列状态管线；它不是受控值，表格 `ready` 后只会首次消费。
- `columnsConfig.onColumnsStateReady`：列状态初始化完成时触发，返回按当前 `columns` 归一化后的完整 `columnsState`，适合初始化外部存储状态。这个快照可以包含 `visible: false` 的隐藏列；如果业务需要当前实际视图，应读取回调中的 `viewState`。
- `columnsConfig.onColumnsStateChange`：列宽、排序、显隐、固定等列配置发生持久化提交时触发。第一个参数是完整 `columnsState` 快照，`info.patches` 只描述本次用户主动提交的字段变化。
- `columnsConfig.columnsStateKey`：当外部清空存储、切换用户或切换一套全新的列配置时，改变这个值，让表格重新按当前 `storageColumnsState` 或当前 `columns` 初始化列状态。
- `info.type === 'previewSave'`：表示预览会话保存了列状态草稿。回调里的 `columnsState` 仍是完整快照，`info.patches` 是预览期间用户实际提交且最终仍有效的字段变化。

当预览以 `mode: 'visibleHotOnly'` 启动时，`previewSave` 的 `info.patches` 只会包含热区内的 `visible` 变化。默认的 `mode: 'full'` 会允许当前已开启能力对应的列配置写入预览草稿。

<code src="../../examples/useStorage.tsx"></code>
