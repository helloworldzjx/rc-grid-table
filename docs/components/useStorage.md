---
title: 列配置持久化存储
order: 22
---

## 设计说明

列配置持久化用于保存用户对表格外观的偏好，例如列宽、列顺序、列显隐和列固定。持久化数据以 `ColumnState[]` 的形式由业务写入 `localStorage` 或后端，下次初始化时再通过 `columnsConfig.storageColumnsState` 传回表格。

持久化数据不会替代当前传入的 `columns`。`columns` 始终是列结构的来源，负责决定列是否存在、分组关系、业务属性以及 `hidden`、`resizeDisabled`、`resizeMinWidth` 等运行时约束；`ColumnState[]` 只用于恢复用户偏好。

表格会按已开启的能力保存对应字段：开启 `resizableColumns` 时保存列宽，开启 `sortableColumns` 时保存列顺序，开启 `visibleColumns` 时保存显隐状态，开启 `fixableColumns` 时保存固定状态。清空外部存储或切换一套新的持久化数据后，需要同步更新 `columnsConfig.columnsStateKey`，让表格重新初始化内部列状态。

## 相关 API

- `columnsConfig.storageColumnsState`：从 `localStorage` 或后端读取出的列状态初始化快照。它不是受控值，表格 `ready` 后只会首次消费。
- `columnsConfig.onColumnsStateChange`：列宽、排序、显隐、固定等列配置发生持久化提交时触发。需要持久化时，在这里把新的 `ColumnState[]` 写回外部存储。
- `columnsConfig.columnsStateKey`：当外部清空存储、切换用户或切换一套全新的列配置时，改变这个值，让表格重新按当前 `storageColumnsState` 或当前 `columns` 初始化列状态。
- `info.type === 'previewSave'`：表示隐藏列预览会话保存了完整 `columnsState` 草稿，可能包含列宽、排序、显隐或固定列变化。

当预览以 `mode: 'visibleHotOnly'` 启动时，`previewSave` 只会保存热区内的 `visible` 变化。默认的 `mode: 'full'` 会保存完整的状态草稿。

<code src="../../examples/useStorage.tsx"></code>
