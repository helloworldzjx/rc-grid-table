# 列配置持久化合并设计

## 背景

表格支持列宽调整、列拖拽排序、列显隐、列固定等外观配置。这些用户配置会以 `ColumnState` 的形式交给外部存储，并在下次初始化时通过 `columnsConfig.storageColumnsState` 重新参与表格列状态生成。

持久化数据的作用不是替代当前传入的 `columns`，而是在当前业务列定义的基础上恢复用户做过的外观选择。当前 `columns` 始终是结构和运行时约束的权威来源。

## 数据边界

当前 `columns` 负责表达：

- 列是否存在。
- 列的父子关系、分组结构、声明顺序和业务属性。
- `hidden`、`resizeDisabled`、`dragSortDisabled`、`resizeMinWidth` 等运行时声明。
- 内置列的结构属性，例如展开列、选择列、行拖拽列。

持久化 `ColumnState` 只负责表达用户外观偏好：

- `order`：用户调整后的同级列顺序。
- `visible`：用户修改后的显隐状态。
- `fixed`：用户修改后的固定状态。
- `width`：用户调整或自动补齐后的列宽。
- `widthManuallyChanged`：宽度是否被用户手动调整过。
- `children`：仅用于保存同一棵列状态树中的层级结果。
- `dataIndex`：辅助识别信息，不作为结构权威来源。

`resizeMinWidth` 不属于持久化状态。它只来自当前 `columns`，类型只支持 `number`，用于运行时限制拖拽最小宽度，并在恢复 `width` 时做下限校准。

## 合并原则

### 当前列定义优先

合并结果只能包含当前 `columns` 中仍然存在的列。持久化数据里多出来的旧列会被内部忽略，避免已经删除的业务列重新出现在表格中。

当前列定义中的结构信息必须保留，包括 key、父级关系、祖先关系、子列结构、内置列标记，以及运行时禁用配置。这些信息不应被旧持久化数据覆盖。

### 恢复用户偏好

当当前列和持久化列可以通过 key 对应时，用户偏好字段可以从持久化数据恢复。旧数据缺少某个字段时，合并结果使用当前列定义或稳定默认值。

`resizeMinWidth` 是例外。即使旧 storage 中仍然带有该字段，当前逻辑也不再恢复它。恢复宽度时只使用当前列声明的 `resizeMinWidth` 校准：

```ts
width = Math.max(storedWidth, currentResizeMinWidth);
```

如果当前列没有声明 `resizeMinWidth`，则按默认最小宽度参与运行时计算。

### 新列必须进入结果

当前 `columns` 新增的列，即使持久化数据中没有，也必须进入合并结果。新列的初始状态由当前列定义和默认值决定。

开启列排序时，新列会尽量贴近当前 `columns` 的声明位置插入：如果它前面有已经存在于持久化顺序中的同级列，就插到该列之后；否则放在当前同级层级开头。

### 旧列只在内部忽略

如果某个列只存在于持久化数据中，但当前 `columns` 已经不再声明它，内部合并结果不会包含该列。

组件不会在初始化时自动清理外部 localStorage 或后端存储。这样可以避免临时 columns 子集、业务临时隐藏列、权限加载中间态等场景把用户历史配置永久删掉。外部存储只有在业务主动写回，或者用户发生新的列配置交互后，才会被新的 `ColumnState` 覆盖。

### 分组逐层合并

分组列按层级逐层合并。父列和子列都遵守同一套规则：当前 `columns` 决定结构、父子关系和运行时声明，持久化状态只恢复可以通过 key 对应上的用户偏好。

新增、删除或移动分组时，应优先保证当前结构可渲染，再在当前同一父级范围内恢复可对应列的顺序。旧 storage 中的父级关系不应跨层级影响新的分组结构。

## 顺序规则

排序状态只在同一兄弟层级内生效。合并时先恢复持久化中已有同级列的相对顺序，再把新增同级列插回当前声明位置附近。

新增列的插入位置需要兼顾两个目标：

- 用户调整过的列在刷新或重新初始化后保持用户顺序。
- 业务新增的列不会全部堆到末尾，也不会破坏已经保存的用户顺序。

最终输出的 `order` 应归一化为当前层级连续、稳定的值，供后续渲染排序和下一次持久化继续使用。

## 默认值规则

合并结果必须补齐表格运行所需的基础状态：

- 可见性缺省为可见，除非当前列声明 `hidden` 或已恢复用户显隐偏好。
- 是否有子列由合并后的子列数量决定。
- 子列缺省为空数组。
- `fixed`、`width`、`widthManuallyChanged` 等字段只在对应能力开启且列状态有效时恢复。
- 旧数据缺少新增字段时，使用当前列声明或稳定默认值，不应导致列消失、排序异常或宽度状态失真。

当列禁止调整宽度时，列宽应以当前列定义为准，不使用旧持久化宽度继续影响当前列，同时清除“已被用户手动调整宽度”的状态。

## 运行时声明优先级

以下能力和约束必须以当前 `columns` 声明为准：

- 列是否存在、分组结构和父子关系。
- `hidden`、`resizeDisabled`、`dragSortDisabled`。
- `resizeMinWidth`。
- 内置列的结构属性，例如展开列、选择列、行拖拽列。

这些声明通常来自业务逻辑或组件内部约束。如果旧 storage 覆盖它们，可能导致业务已经禁用的能力重新生效，或者让不存在于当前结构中的列参与渲染和交互。

## 宽度规则

`width` 是用户偏好，可以持久化。`resizeMinWidth` 是当前 columns 的运行时约束，不持久化，也不支持百分比。

恢复持久化宽度时：

- 如果当前列 `resizeDisabled` 为 `true`，则使用当前列声明的宽度，并清除手动宽度影响。
- 如果当前列可以 resize，则可以恢复旧 `width`。
- 如果旧 `width` 小于当前 `resizeMinWidth`，则将恢复后的 `width` 抬到当前 `resizeMinWidth`。
- `widthManuallyChanged` 只在列可 resize 时保留。

拖拽 resize 和 placeholder auto fill 写回 `ColumnState` 时，只会写入 `width` 和 `widthManuallyChanged`，不会写入 `resizeMinWidth`。

## Preview Draft

`TableRef.startColumnsStatePreview(options?)` 用于开启列状态预览会话。预览态不是受控状态，而是内部维护的一份 draft。正常态下，resize、auto fill、排序、显隐、固定会立即提交并触发 `onColumnsStateChange`；预览态下，这些交互先写入 draft，不立即触发外部回调。

`options.mode` 默认为 `'full'`。

### full 模式

`mode: 'full'` 表示完整 `columnsState` 草稿会话。开启后，已启用的列状态能力都会写入 draft：

- resize。
- placeholder auto fill。
- 列拖拽排序。
- 列显隐。
- 列固定。

调用 `saveColumnsStatePreview()` 时，表格会将当前 committed state 和已经按当前 columns 重新 rebase 的 draft 做差异比较。如果存在变化，则一次性触发 `onColumnsStateChange`，`info.type` 为 `'previewSave'`，`patches` 可能同时包含 `visible`、`fixed`、`order`、`width`、`widthManuallyChanged`。

调用 `cancelColumnsStatePreview()` 时，表格会丢弃 draft，不触发 `onColumnsStateChange`，并清理运行时宽度预览，使宽度回到 committed state。

### visibleHotOnly 模式

`mode: 'visibleHotOnly'` 表示受限的隐藏列预览会话。它用于“查看隐藏列，并只允许恢复或再次隐藏这些隐藏列”的业务场景。

进入该模式时，表格会记录当时已经隐藏的列 key，这些列就是预览热区。预览期间：

- 只有热区列的 `visible` 变化会进入 draft。
- 非热区列的显隐变化会被忽略。
- `fixed`、`order`、`width`、`widthManuallyChanged` 变化会被忽略。
- 列宽拖拽通过 dnd-kit `useDraggable` 的 `disabled` 禁用。
- 列拖拽排序通过 dnd-kit `useSortable` 的 `disabled` 禁用。
- Placeholder 仍会在宽度不足时显示，但会带 disabled class，点击不会触发 auto fill。

`visibleHotOnly` 需要 `visibleColumns` 开启。如果 `visibleColumns` 关闭，进入该模式会 no-op 并在开发环境 warning；如果预览期间 `visibleColumns` 被关闭，表格会自动取消预览。

业务外部仍然可以维护自己的 `previewing` state，用于控制按钮和菜单项禁用。表格内部会在逻辑层继续保护 draft，避免外部菜单漏禁用时写入非预期状态。

### 隐藏列预览渲染

隐藏列预览是叠加在 preview draft 上的渲染行为：

- 开启 preview 时记录初始隐藏列 key。
- draft 中 `visible === false` 的列会临时渲染，并标记为 `previewHidden`。
- 初始隐藏列被恢复显示后，会标记为 `previewRestored`。
- 恢复后的列再次隐藏，会回到 `previewHidden`。

如果所有列状态能力都关闭，preview 会自动取消。仅关闭 `visibleColumns` 不一定取消 `full` 预览，只表示 visible 字段不再参与 draft；但会取消 `visibleHotOnly` 预览。

## 功能开关

持久化字段会按功能开关过滤：

- `sortableColumns` 开启时保留 `order`。
- `visibleColumns` 开启时保留 `visible`。
- `fixableColumns` 开启时保留 `fixed`。
- `resizableColumns` 开启时保留 `width` 和 `widthManuallyChanged`。

功能未开启时，对应字段不会从 storage 恢复，也不会写回给外部。

## 初始化与重置

`columnsConfig.storageColumnsState` 是初始化快照，不是受控状态。表格 ready 后首次消费该快照，随后内部维护自己的列状态。

如果外部清空 localStorage 或切换一套全新的列状态，希望表格内部也重新初始化，需要改变 `columnsConfig.columnsStateKey`。`columnsStateKey` 变化时，表格会重新按当前 `storageColumnsState` 或当前 `columns` 默认状态初始化列状态，并取消当前 preview。

仅改变 `storageColumnsState` 不会在 ready 后重新初始化内部列状态。

## colSpan 与外部 API

内部 resize 和列排序会把 `colSpan` 覆盖到的叶子列展开成一组 key 后处理。

外部 ref API `setColumnVisible` 和 `setColumnFixed` 也遵循同一规则：

- 普通叶子列只处理自身。
- `colSpan > 1` 的叶子列会处理它覆盖到的叶子列。
- 分组列仍按分组节点递归处理子列。

这样外部 API 与内部交互在跨列场景中保持一致。

## 新功能接入约束

新增列配置能力时，先判断新增字段属于哪一类：

- 如果字段表达当前业务结构或运行时限制，应由当前 `columns` 决定，并在合并时保护当前声明。
- 如果字段表达用户外观偏好，应允许从 `ColumnState` 恢复，并在缺失时提供明确默认值。
- 如果字段会影响同级排序、宽度分配、显隐、固定位置或 colSpan 覆盖范围，需要确认新增列、删除列、分组变化时的兼容行为。

新增字段不能默认假设旧 storage 一定包含它。旧数据缺字段时，合并结果仍应完整、可渲染，并且能被 `onColumnsStateChange` 输出后再次参与下一次初始化。

## 典型场景

### 业务新增列

用户之前保存过列顺序和列宽。业务升级后新增一列。合并结果应保留用户已有配置，并把新增列插入到当前声明位置附近。

### 业务删除列

用户 storage 中仍然有旧列。业务升级后该列已经移除。合并结果应忽略旧列，不再渲染，也不在下一次列配置交互写回时继续输出。

### 列被改为禁止调整宽度

旧 storage 中可能保存了用户调整过的宽度。当前列声明 `resizeDisabled` 后，合并结果应使用当前声明宽度，并清除用户手动宽度影响。

### 当前最小宽度变大

旧 storage 中保存的 `width` 可能小于当前列声明的 `resizeMinWidth`。恢复时应把 `width` 抬到当前 `resizeMinWidth`，但不把 `resizeMinWidth` 写入 `ColumnState`。

### 完整预览后统一保存

业务希望用户先尝试多种列配置，再统一保存。可以调用 `startColumnsStatePreview()` 使用默认 `full` 模式。预览期间 resize、auto fill、排序、显隐、固定都只写入 draft；保存时触发一次 `previewSave`，取消时全部丢弃。

### 只查看隐藏列并恢复

业务希望用户查看隐藏列，但不希望顺手修改列宽、排序或固定状态。可以调用 `startColumnsStatePreview({ mode: 'visibleHotOnly' })`。预览期间只有初始隐藏列热区内的显隐变化能保存，其他列状态变化会被内部忽略。

### 分组结构变化

业务调整了分组层级。合并时应以当前分组结构为准，只在新的同级范围内恢复可匹配列的用户状态，避免旧父级关系影响新结构。

### 外部清空 storage

业务清空 localStorage 或后端配置后，如果希望表格内部也立刻回到默认列状态，需要同步改变 `columnsConfig.columnsStateKey`。只改变 `storageColumnsState` 不会把 ready 后的内部列状态当作受控状态覆盖。

## 修改前检查清单

调整持久化合并逻辑或新增列配置能力前，需要确认：

- 当前 `columns` 新增的列是否一定进入合并结果。
- 当前 `columns` 删除的列是否一定从内部合并结果移除。
- 分组列父子关系是否以当前结构为准。
- 用户保存过的同级列顺序是否仍能恢复。
- 新增列插入位置是否贴近当前声明顺序。
- `resizeDisabled` 是否阻断旧宽度继续影响当前列。
- `resizeMinWidth` 是否只来自当前 columns，且没有进入 `ColumnState`。
- `dragSortDisabled` 是否只作为当前交互约束，不从 storage 恢复。
- preview draft 是否在保存前按当前 columns rebase。
- `full` preview 是否保存完整已启用 `columnsState`，而不是只保存 visible 字段。
- `visibleHotOnly` preview 是否只保存热区 visible 字段。
- `visibleHotOnly` 下 resize、auto fill、列排序是否在交互入口禁用。
- `onColumnsStateChange` 输出的数据是否还能在下一次初始化时参与合并。
- 清空外部 storage 后，如需重置内部状态，是否同步更新了 `columnsStateKey`。

## 维护建议

持久化合并是列配置功能的入口。列宽、排序、显隐、固定等功能可以各自维护交互逻辑，但读取 storage、写回 `ColumnState`、响应当前 `columns` 变化时，都应遵守同一套合并边界。

后续如果引入持久化版本号、迁移机制或清理旧列能力，也应把迁移结果视为“待合并的用户配置”，而不是直接替代表格当前列定义。自动清理外部 storage 属于单独能力，需要明确触发条件后再设计。
