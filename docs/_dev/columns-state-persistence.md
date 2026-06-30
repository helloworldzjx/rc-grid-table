# 列配置持久化合并设计

## 背景

表格支持列宽调整、列拖拽排序、列显隐、列固定等外观配置。这些配置会以 `ColumnState` 的形式交给外部存储，并在下次初始化时通过 `columnsConfig.storageColumnsState` 重新参与表格列状态生成。

持久化数据的作用不是替代当前传入的 `columns`，而是在当前业务列定义的基础上恢复用户做过的外观选择。当前 `columns` 始终是列是否存在、列结构和运行时约束的权威来源。

本设计的核心变化是：`sortableColumns`、`visibleColumns`、`fixableColumns`、`resizableColumns` 只作为列状态特性交互开关，统一约束内置 UI、手势入口和对应 ref API，不再作为 `columnsState` 数据字段的恢复、归一化或写回过滤条件。

## 产品语义

列配置能力需要拆成两个互相独立的面：

- 数据面：`columnsState` 保存当前可渲染列的完整外观状态，包括 `order`、`visible`、`fixed`、`width`、`widthManuallyChanged` 等可回放数据。
- 交互面：`sortableColumns`、`visibleColumns`、`fixableColumns`、`resizableColumns` 决定当前页面是否开放对应列状态特性。它们会同时约束组件内置 UI、手势、菜单入口，以及对应的 `TableRef` 命令式 API。

因此：

- 特性开关开启时，对应内置 UI 和 ref API 可以修改 `columnsState`，并在提交时通过 `onColumnsStateChange` 写回完整快照。
- 特性开关关闭时，对应内置 UI 和 ref API 不可用，但已有 `columnsState` 字段仍会从 `storageColumnsState` 恢复、参与当前渲染、保留在内部状态里，并在其它列配置提交时继续写回。
- 特性开关变化本身只表示当前页面启用或停用某项列状态交互能力，不等同于用户主动修改列配置，也不应清洗内部状态或外部输出。
- `setColumnVisible`、`setColumnFixed` 等会直接修改列状态的 ref API 受对应特性开关管控。它们应返回 `boolean`：只有本次调用被允许且确实向 committed state 或 preview draft 写入用户 patch 时返回 `true`；特性未开启、目标列不存在、当前 preview 模式不允许或没有实际变化时返回 `false`。`startColumnsStatePreview` 受 preview 模式要求管控，`full` 模式至少需要一个特性开启，`visibleHotOnly` 模式必须开启 `visibleColumns`；`saveColumnsStatePreview`、`cancelColumnsStatePreview` 只处理已经存在的预览会话。所有 ref API 都不是数据恢复策略入口，也不能触发列状态管线按需初始化。

如果业务希望“禁止恢复某类用户偏好”，不能再复用这些 UI 开关表达。应由业务在传入 `storageColumnsState` 前主动清理数据、变更 `columnsStateKey` 重置状态，或后续引入独立的数据恢复策略 API。

如果业务希望“恢复某类用户偏好，但禁止用户通过组件内置 UI 或 ref API 继续修改”，直接关闭对应特性开关即可。

## 数据边界

当前 `columns` 是列结构和运行时约束的权威来源，并会先被转换为当前可渲染列结构。它负责表达：

- 列是否存在，以及该列是否参与当前渲染。`hidden === true` 的列不会进入当前可渲染列结构，也不会被保存成 `visible: false`。
- 列的父子关系、分组结构、声明顺序和业务属性。
- `resizeDisabled`、`dragSortDisabled`、`resizeMinWidth` 等运行时声明。
- 内置列的结构属性，例如展开列、选择列、行拖拽列。

持久化 `ColumnState` 负责表达可回放的外观状态：

- `order`：同级列顺序。它可能来自用户拖拽，也可能来自当前声明顺序归一化后的默认值。
- `visible`：显隐状态。用户隐藏列通过 `visible: false` 表达；当前列声明 `hidden === true` 属于结构排除，不进入 `ColumnState`。
- `fixed`：固定状态。`fixed: false` 表示用户或状态显式取消固定。
- `width`：用户拖拽、placeholder auto fill 或运行时宽度补齐后的可回放列宽。
- `widthManuallyChanged`：宽度是否被用户手动拖拽调整过；placeholder auto fill 和 runtime width hydration 不应把它置为 `true`。
- `children`：仅用于保存同一棵列状态树中的层级结果。
- `dataIndex`：辅助识别信息，不作为结构权威来源。

`resizeMinWidth` 不属于持久化状态。它只来自当前 `columns`，类型只支持 `number`，用于运行时限制拖拽最小宽度，并在恢复 `width` 时做下限校准。

用于持久化的业务列必须提供稳定 `key`。如果没有稳定 key，组件可能退回到 `dataIndex` 或索引生成 key，但这类 key 在列插入、删除、重排后不具备可靠的跨会话恢复语义，业务不应依赖它们保存长期配置。

## 状态管线启用条件

列状态管线不再由 ref API 调用决定，也不由 callback 是否存在决定。它只由当前特性开关和外部初始化快照决定。

满足以下任一条件时，应初始化列状态管线：

- 任一 UI 特性开关开启，需要支持对应列配置交互。
- 显式传入了 `columnsConfig.storageColumnsState`，需要恢复外部初始化快照。

`storageColumnsState` 是否显式传入，应按字段是否存在且为数组判断，而不是按数组是否非空判断。`storageColumnsState: []` 表示业务明确传入了一份空快照，仍应初始化并按当前 `columns` 生成完整默认状态；未声明 `storageColumnsState` 字段才表示没有外部初始化快照。

如果既没有任一 UI 特性开关开启，也没有显式传入 `columnsConfig.storageColumnsState`，表格可以只按当前 `columns` 生成运行时布局，不需要维护可写回的 committed `columnsState`。此时列状态 ref API 也不应按需初始化管线；会开启、保存或修改列状态的 ref API 应返回 `false`，`cancelColumnsStatePreview` 没有会话时直接结束。

`onColumnsStateReady` 和 `onColumnsStateChange` 本身不是初始化条件。它们只是列状态管线已经初始化或发生主动提交时的通知入口。只传 `columnsConfig: {}`，或只传 callback 但没有 UI 特性开关、没有 `storageColumnsState` 时，不应初始化，也不应触发 ready。

`columnsConfig` 是列状态数据面的外部存储入口；四个特性开关是列状态交互入口。二者不能互相替代，也不应互相隐式清洗数据。

## 合并原则

### 当前列定义优先

合并结果只能包含当前可渲染列结构中仍然存在的列。持久化数据里多出来的旧列会被内部忽略，避免已经删除或被当前业务声明隐藏的列重新出现在表格中。

当前可渲染列结构中的结构信息必须保留，包括 key、父级关系、祖先关系、子列结构、内置列标记，以及运行时禁用配置。这些信息不应被旧持久化数据覆盖。

### 恢复完整外观状态

当当前列和持久化列可以通过 key 对应时，`ColumnState` 中的外观字段应从持久化数据恢复，不受四个 UI 开关影响。旧数据缺少某个字段时，合并结果使用当前列定义、稳定默认值或运行时计算值补齐。

`resizeMinWidth` 是例外。即使旧 storage 中仍然带有该字段，当前逻辑也不再恢复它。恢复宽度时只使用当前列声明的 `resizeMinWidth` 校准：

```ts
width = Math.max(storedWidth, currentResizeMinWidth);
```

如果当前列没有声明 `resizeMinWidth`，则按默认最小宽度参与运行时计算。

### 新列必须进入结果

当前 `columns` 新增的列，即使持久化数据中没有，也必须进入合并结果。新列的初始状态由当前列定义、稳定默认值和运行时布局结果决定。

新列会尽量贴近当前 `columns` 的声明位置插入：如果它前面有已经存在于持久化顺序中的同级列，就插到该列之后；否则放在当前同级层级开头。

### 旧列只在内部忽略

如果某个列只存在于持久化数据中，但当前 `columns` 已经不再声明它，内部合并结果不会包含该列。

组件不会在初始化时自动清理外部 localStorage 或后端存储。这样可以避免临时 columns 子集、业务临时隐藏列、权限加载中间态等场景把用户历史配置永久删掉。外部存储只有在业务主动写回，或者用户发生新的列配置交互后，才会被新的 `ColumnState` 覆盖。

### 分组逐层合并

分组列按层级逐层合并。父列和子列都遵守同一套规则：当前 `columns` 决定结构、父子关系和运行时声明，持久化状态只恢复可以通过 key 对应上的外观状态。

新增、删除或移动分组时，应优先保证当前结构可渲染，再在当前同一父级范围内恢复可对应列的顺序。旧 storage 中的父级关系不应跨层级影响新的分组结构。

如果某个叶子列从旧父级移动到新的父级下，它在新的父级范围内应被视为当前结构中的新增列处理，不从旧父级下的同名 `ColumnState` 恢复 `order`、`visible`、`fixed`、`width` 等外观字段。这样可以避免旧分组语义跨层级污染新的业务结构；业务如果确实希望继承这些偏好，应在传入 `storageColumnsState` 前自行迁移。

## 状态身份与归一化不变量

列状态管线里需要区分外部重置身份、外部初始化快照、内部状态源和派生结果。它们的职责不同，不能互相替代：

- `columnsStateKey` 是外部重置身份。它只回答“是否要重新消费一份初始化快照”，不表达当前 committed state 的版本，也不能用来判断某份布局投影是否来自最新 committed value。拖拽列宽、列显隐、排序、内部归一化、runtime width hydration、UI 开关变化都不会改变 `columnsStateKey`。
- `storageColumnsState` 是外部初始化快照。它只在首次 ready 初始化，或 `columnsStateKey` 变化后的重新初始化中被消费。ready 之后单独改变 `storageColumnsState`，不会把表格内部状态当作受控值覆盖。
- 内部 committed `columnsState` 是 ready 后表格继续运行的列配置状态源。内置 UI 提交、ref API 命令式提交、preview save、内部归一化、runtime width hydration 都可能更新它。它必须始终按当前可渲染列结构归一化，并保留完整外观字段。
- preview draft 是预览会话中的临时草稿。它只在 preview 中覆盖 committed state 形成当前 active state；保存前必须先按当前可渲染列结构 rebase，取消时直接丢弃。
- layout projection 是由 committed state 和 preview draft 派生出的渲染结果，包括 `innerColumnsState`、列宽布局、flatten columns、ready 快照等。它不是状态源，不能反过来替代 committed state。

这些对象的依赖方向固定为：

```text
columnsStateKey 触发重新消费 storageColumnsState
storageColumnsState / 旧 committed state / preview draft 作为待恢复外观状态
当前可渲染 columns 结构决定最终 committed columnsState
committed columnsState + preview draft 派生 layout projection
特性开关决定哪些内置 UI 和 ref API 可以提交 patch
```

内部 committed `columnsState` 必须始终可以视为以下输入的归一化结果：

```text
当前可渲染 columns 结构和运行时声明
+ 可通过 key 对应的历史外观状态
+ 当前渲染和下一次持久化所需的稳定默认值或运行时计算值
```

归一化结果必须满足：

- 只包含当前可渲染列结构中仍然存在的列。
- 父子关系、分组结构、内置列标记和运行时禁用声明来自当前 `columns`。
- 不按 `sortableColumns`、`visibleColumns`、`fixableColumns`、`resizableColumns` 裁剪字段。
- 当前渲染和下一次持久化所需的字段不能处于半初始化状态；旧 storage 或旧内部状态缺字段时，必须按当前 columns、默认值或运行时布局补齐。
- 输出给 `onColumnsStateReady`、`onColumnsStateChange` 或 preview save 的 `columnsState` 必须能在下一次作为 `storageColumnsState` 参与初始化。

外部传入的 `storageColumnsState`、内部已有的 committed state、preview draft 都应被视为“待恢复的外观状态”，不能直接替代表格当前列结构。响应当前 `columns` 变化、`columnsStateKey` 变化、preview save 之前，都需要按同一套边界重新归一化。特性开关变化只会影响后续交互入口，不应触发字段过滤；ref API 调用只表达一次命令式状态修改，也不改变字段恢复策略。

layout projection 只是由 committed state 和 preview draft 派生出来的渲染结果。只要本轮发现 committed state 或 draft 还需要初始化、归一化、rebase 或补齐运行时宽度，就应先更新对应内部状态，并等下一轮再派生布局结果。不要在同一轮继续用旧状态生成 `innerColumnsState`、列宽布局、ready 快照或 runtime width sync，避免旧状态继续参与宽度分配。

## 默认值规则

合并结果必须补齐表格运行和持久化所需的基础状态：

- 可见性缺省为可见；用户显隐偏好通过 `visible: false` 表达。当前列声明 `hidden === true` 时，该列已经在当前可渲染列结构阶段被排除，不会以 `ColumnState.visible = false` 的形式保存。
- 同级 `order` 缺失时，使用当前声明顺序，并在归一化后输出连续、稳定的值。
- 是否有子列由合并后的子列数量决定。
- 子列缺省为空数组。
- 叶子列应拥有可回放的 `width` 和明确的 `widthManuallyChanged`。
- `fixed` 缺省表示使用当前列声明或默认不固定；`fixed: false` 表示显式取消固定。
- 旧数据缺少新增字段时，使用当前列声明、稳定默认值或运行时布局结果，不应导致列消失、排序异常或宽度状态失真。

当列禁止调整宽度时，列宽应以当前 `columns` 经运行时布局后的宽度为准，不使用旧持久化宽度继续影响当前列，同时清除“已被用户手动拖拽调整宽度”的状态。但归一化后的 `columnsState` 仍应保留该列当前可回放的 `width` 和 `widthManuallyChanged: false`。

## 顺序规则

排序状态只在同一兄弟层级内生效。合并时先恢复持久化中已有同级列的相对顺序，再把新增同级列插回当前声明位置附近。

新增列的插入位置需要兼顾两个目标：

- 用户调整过的列在刷新或重新初始化后保持用户顺序。
- 业务新增的列不会全部堆到末尾，也不会破坏已经保存的用户顺序。

最终输出的 `order` 应归一化为当前层级连续、稳定的值，供后续渲染排序和下一次持久化继续使用。

`sortableColumns` 关闭时，用户不能通过内置拖拽继续修改顺序，但已保存和已归一化的 `order` 仍然参与渲染与写回。

## 运行时声明优先级

以下能力和约束必须以当前 `columns` 声明为准：

- 列是否存在、分组结构和父子关系。
- `hidden` 对当前可渲染列结构的排除。
- `resizeDisabled`、`dragSortDisabled` 等列级交互约束。
- `resizeMinWidth`。
- 内置列的结构属性，例如展开列、选择列、行拖拽列。

这些声明通常来自业务逻辑或组件内部约束。如果旧 storage 覆盖它们，可能导致业务已经排除的列重新出现，或者让不存在于当前结构中的列参与渲染和交互。

四个顶层 UI 开关不属于数据恢复约束。它们不能阻止旧 `ColumnState` 影响渲染，也不能触发字段清洗。

## 宽度规则

`width` 是可回放列宽，可以持久化；其中手动拖拽和 placeholder auto fill 属于用户触发的布局偏好，runtime width hydration 属于运行时补齐快照。`resizeMinWidth` 是当前 columns 的运行时约束，不持久化，也不支持百分比。

宽度状态分为三类：

- 用户手动拖拽产生的 `width` 是明确的用户偏好，`widthManuallyChanged` 应为 `true`。
- placeholder auto fill 产生的 `width` 是用户触发的布局偏好，允许写回持久化状态，但 `widthManuallyChanged` 应按 auto fill 语义保留为 `false`。
- 初始化、当前容器宽度分配或旧状态缺少宽度时补齐的 `width` 是当前运行时布局快照，用于保证内部 committed state 和后续写回可回放；它不代表用户手动调整，`widthManuallyChanged` 应为 `false`。

第三类宽度补齐称为 runtime width hydration。它的边界是：

- 它可以更新内部 committed `columnsState`，因为补齐后的宽度需要在后续写回和下次初始化中可回放。
- 它不是用户列配置提交，不触发 `onColumnsStateChange`。
- 如果 hydration 发生在 `onColumnsStateReady` 发出之前，ready 输出的初始化快照应包含补齐后的宽度。
- 如果 hydration 发生在 ready 之后，它不会补发 ready，也不会触发 change；补齐结果只会体现在下一次主动提交的完整 `columnsState` 中。

恢复持久化宽度时：

- 如果当前列 `resizeDisabled` 为 `true`，则使用当前 `columns` 经运行时布局后的宽度，并清除手动拖拽宽度影响。
- 如果当前列可以 resize，则可以恢复旧 `width`。
- 如果旧 `width` 小于当前 `resizeMinWidth`，则将恢复后的 `width` 抬到当前 `resizeMinWidth`。
- `widthManuallyChanged` 只在列可 resize 且旧状态明确为手动拖拽时保留。

只要列状态管线已启用，无论 `resizableColumns` 是否开启，所有可渲染叶子列都应拥有可回放的 `width` 状态。旧状态只包含部分列宽，或之前未开放列宽交互时，也必须在 ready 或下一次写回前补齐完整宽度快照。

拖拽 resize 和 placeholder auto fill 写回 `ColumnState` 时，只会写入 `width` 和 `widthManuallyChanged`，不会写入 `resizeMinWidth`。`onColumnsStateChange` 的第一个参数应是完整、归一化后的 `columnsState`，`info.patches` 才表达本次实际变化的列。

`resizableColumns` 关闭时，用户不能通过内置拖拽或 placeholder auto fill 继续修改宽度，但已保存和已补齐的 `width` 仍然参与渲染与写回。

## UI 控制开关

这里仍沿用“UI 控制开关”的命名，但它们实际控制的是该特性的全部交互入口：组件内置 UI、手势、菜单入口，以及已经存在或后续新增的对应 ref API。它们不控制 `columnsState` 数据字段是否恢复、保留或写回。

四个顶层 props 的职责如下：

- `sortableColumns`：控制列拖拽排序特性是否启用，包括内置拖拽排序入口。
- `visibleColumns`：控制列显隐特性是否启用，包括内置显隐入口和 `setColumnVisible`。
- `fixableColumns`：控制列固定特性是否启用，包括内置固定入口和 `setColumnFixed`。
- `resizableColumns`：控制列宽调整特性是否启用，包括列宽拖拽入口和 placeholder auto fill。

如果某个特性当前没有对应的命令式修改 API，则该开关只约束现有的内置入口；后续一旦新增对应 ref API，也应复用同一开关作为交互授权条件。

它们不再承担以下职责：

- 不决定 `storageColumnsState` 中哪些字段可以恢复。
- 不决定内部 committed `columnsState` 中保留哪些字段。
- 不决定 `onColumnsStateReady` 或 `onColumnsStateChange` 输出哪些字段。
- 不在关闭时从 active state、preview draft 或外部写回快照中移除字段。

UI 开关变化时遵守以下规则：

- 从关闭变为开启时，已有 committed state 直接作为当前完整状态使用；如果状态缺失字段，按当前 columns、默认值或运行时布局补齐。
- 从开启变为关闭时，只关闭对应交互入口，不修改 committed state，不清理 preview draft，不触发 `onColumnsStateChange`。
- 开关变化导致的内部布局补齐默认不触发 `onColumnsStateChange`，因为它不是一次主动提交的列配置变更。
- 开关变化后，下一次仍被允许的内置 UI 交互或 ref API 调用触发 `onColumnsStateChange` 时，应输出完整、可回放的归一化快照，包括当前关闭开关对应的已有字段。

例如先开启 `sortableColumns` 并保存了 `order`，之后关闭 `sortableColumns` 再开启 `resizableColumns`。用户随后只拖拽一列宽度时，`info.patches` 只包含被拖拽列的宽度变化，但输出的 `columnsState` 仍必须包含此前保存的 `order`。

再例如 `visibleColumns` 关闭时，组件不展示内置显隐入口，业务调用 `setColumnVisible(key, false)` 也应返回 `false` 且不提交 patch；但已有 `visible: false` 仍然会参与恢复、渲染和后续其它特性写回。

## Preview Draft

`TableRef.startColumnsStatePreview(options?)` 用于开启列状态预览会话。预览态不是受控状态，而是内部维护的一份 draft。正常态下，已开放的内置 UI 交互或对应 ref API 会立即提交并触发 `onColumnsStateChange`；预览态下，这些状态修改先写入 draft，不立即触发外部回调。

`options.mode` 默认为 `'full'`。

开启 `full` preview 需要当前至少存在一个可用的列状态特性。四个特性开关全部关闭时，`startColumnsStatePreview()` 应返回 `false`，并可在开发环境给出 warning；受限模式还需要满足各自额外的特性要求。

### full 模式

`mode: 'full'` 表示完整 `columnsState` 草稿会话。开启该模式至少需要 `sortableColumns`、`visibleColumns`、`fixableColumns`、`resizableColumns` 中有一个开启。开启后，draft 以当前完整 committed state 为基础；内置 UI 和 ref API 能修改哪些字段，由当前特性开关、列级交互约束、当前 columns 结构和 preview 模式共同决定。

预览会话需要记录期间由内置 UI 或 ref API 主动提交的用户 patch。调用 `saveColumnsStatePreview()` 时，表格会先按当前 columns rebase draft，再把最终 draft 保存为新的 committed state。只有预览期间存在用户 patch 时，才一次性触发 `onColumnsStateChange`，`info.type` 为 `'previewSave'` 并返回 `true`；如果只有 rebase、runtime width hydration、新列补齐等内部归一化变化，则返回 `false` 且不触发 change。`columnsState` 参数是最终完整快照，可以包含内部归一化结果；`info.patches` 只包含预览期间用户主动提交的最终有效字段变化，不包含内部归一化产生的差异。

preview save 的 patch 不是逐步操作日志，也不是最终 draft 与 committed state 的全字段 diff。它表达“这次用户到底改了什么字段”：`setColumnVisible` 只可能产生 `visible` patch，`setColumnFixed` 只可能产生 `fixed` patch；它们引起的宽度重算、runtime width hydration 或新列宽度补齐只体现在完整 `columnsState` 中，不进入 `info.patches`。只有用户在 preview 期间真实拖拽列宽或点击 placeholder auto fill 时，才产生 `width` 和 `widthManuallyChanged` patch。如果用户在 preview 中反复修改同一字段，保存时按最终状态与 preview 开始时的 committed state 比较，只输出最终仍然有效的用户字段变化；如果最终回到原状，则不输出该 patch。

调用 `cancelColumnsStatePreview()` 时，表格会丢弃 draft，不触发 `onColumnsStateChange`，并清理运行时宽度预览，使宽度回到 committed state。

关闭某个特性开关不会从 `full` draft 中删除对应字段。它只会阻止后续内置 UI 和对应 ref API 继续修改这些字段。如果预览期间四个特性开关全部关闭，表格应自动取消 `full` 预览会话。

### visibleHotOnly 模式

`mode: 'visibleHotOnly'` 表示受限的隐藏列预览会话。它用于“查看隐藏列，并只允许恢复或再次隐藏这些隐藏列”的业务场景。

进入该模式时，表格会记录当时已经隐藏的列 key，这些列就是预览热区。预览期间：

- 只有热区列的 `visible` 变化会进入 draft。
- 非热区列的显隐变化会被忽略。
- `fixed`、`order`、`width`、`widthManuallyChanged` 变化会被忽略。
- 列宽拖拽通过 dnd-kit `useDraggable` 的 `disabled` 禁用。
- 列拖拽排序通过 dnd-kit `useSortable` 的 `disabled` 禁用。
- Placeholder 仍会在宽度不足时显示，但会带 disabled class，点击不会触发 auto fill。

`visibleHotOnly` 必须在 `visibleColumns` 开启时才能使用，因为该模式只允许保存热区列的显隐变化。如果 `visibleColumns` 关闭，进入该模式应返回 `false`，并可在开发环境给出 warning；如果预览期间 `visibleColumns` 被关闭，表格应自动取消该预览会话。

保存 `visibleHotOnly` 时，`columnsState` 仍输出完整快照，`info.patches` 只包含预览期间用户主动提交且被该模式允许的热区 visible patch。

业务外部仍然可以维护自己的 `previewing` state，用于控制按钮和菜单项禁用。表格内部会在逻辑层继续保护 draft，避免外部菜单漏禁用时写入非预期状态。

### 隐藏列预览渲染

隐藏列预览是叠加在 preview draft 上的渲染行为：

- 开启 preview 时记录初始隐藏列 key。
- draft 中 `visible === false` 的列会临时渲染，并标记为 `previewHidden`。
- 初始隐藏列被恢复显示后，会标记为 `previewRestored`。
- 恢复后的列再次隐藏，会回到 `previewHidden`。

## 写回边界

列状态管线分为内部状态更新、布局投影和外部写回三个阶段。

内部状态更新只维护表格自己的 committed state 或 preview draft。初始化、当前 `columns` 变化、`columnsStateKey` 变化、preview rebase、runtime width hydration 都属于这一类。它们可以让内部状态变得完整、稳定、可回放，但默认不触发 `onColumnsStateChange`，因为它们不是一次业务提交的列配置变更。

UI 开关变化本身也是内部交互能力变化，不是数据提交；它不应触发 `onColumnsStateChange`，也不应清洗 committed state 或 draft。

如果本轮管线需要执行内部状态更新，本轮必须在提交状态更新后结束。不能在同一轮继续发布基于旧状态的布局投影。下一轮再用更新后的 committed state 或 draft 生成 `innerColumnsState`、列宽布局、flatten columns 和 ready 快照。

布局投影只能由当前 committed state 和当前 preview draft 派生。宽度分配、ready 输出、runtime width sync 不能消费旧 committed state 派生出来的 `innerColumnsState`。

外部写回只发生在列配置被主动提交时，包括内置 UI 触发的 resize、placeholder auto fill、排序、显隐、固定，业务调用已启用特性对应 ref API 触发的命令式修改，以及有效 preview 会话中的 `saveColumnsStatePreview()`。触发写回时，`onColumnsStateChange(columnsState, info)` 的 `columnsState` 是完整、归一化、可回放的快照，表达保存后的最终状态；`info.patches` 只表达本次提交中由用户主动操作产生的最终有效字段变化。对于 preview save，`info.patches` 来自预览期间累计并压缩后的用户 patch，而不是最终 draft 与 committed state 的完整结构差异。

如果内部状态因为当前 `columns` 删除旧列、运行时声明变化或宽度补齐而调整了字段，这些变化不会立即触发 `onColumnsStateChange`。它们会在下一次主动提交列配置时体现在完整快照中。

## 初始化与重置

`columnsConfig.storageColumnsState` 是初始化快照，不是受控状态。只有显式传入该字段时，它才构成 eager 初始化条件；空数组也是一份有效的空快照。表格 ready 后首次消费该快照，随后内部维护自己的 committed `columnsState`。业务如果在 ready 后只替换 `storageColumnsState`，表格不会把它当成新的 value 覆盖内部状态。

`columnsConfig.columnsStateKey` 是外部重置身份。它只在列状态管线已经初始化，或本轮满足初始化条件时生效。它变化时，表格会取消当前 preview，丢弃旧 committed state，并重新按当前 `storageColumnsState` 或当前 `columns` 默认状态初始化列状态。外部清空 localStorage、切换用户、切换一套新的列配置时，如果希望表格内部状态同步重置，应同步改变这个 key。

拖拽列宽、列显隐、排序、允许执行的 ref API 命令式修改、内部归一化、UI 开关变化或 runtime width hydration 都不会改变 `columnsStateKey`。这些变化属于同一轮重置身份下的 committed state 更新或交互能力变化。

`onColumnsStateReady` 输出的是初始化完成后的完整归一化快照。它适合业务初始化外部存储或 UI 状态，例如在 storage 缺少宽度字段时拿到表格补齐后的完整快照。它不是初始化条件，也不是用户提交事件，不应被当作 `onColumnsStateChange` 的替代，也不会因为 ready 之后的 runtime width hydration 再次补发。

即使四个 UI 开关都关闭，只要显式传入了 `columnsConfig.storageColumnsState` 并因此初始化列状态管线，`onColumnsStateReady` 也应在回调存在时输出完整 `columnsState`。如果未显式传入 `storageColumnsState`，ref API 不会触发按需初始化；如果业务需要初始化阶段拿到 ready 快照，应显式传入 `storageColumnsState` 并提供 `columnsConfig.onColumnsStateReady`。

## colSpan 与外部 API

内部 resize 和列排序会把 `colSpan` 覆盖到的叶子列展开成一组 key 后处理。

外部 ref API `setColumnVisible` 和 `setColumnFixed` 也遵循同一覆盖范围规则：

- 普通叶子列只处理自身。
- `colSpan > 1` 的叶子列会处理它覆盖到的叶子列。
- 分组列仍按分组节点递归处理子列。

`setColumnVisible` 受 `visibleColumns` 管控，`setColumnFixed` 受 `fixableColumns` 管控。对应特性开关关闭时，业务显式调用 ref API 也不应提交 patch，并返回 `false`；对应特性开启时，如果处于 preview 中，则写入 preview draft 并返回 `true`；如果不在 preview 中，则写入 committed state、触发 `onColumnsStateChange` 并返回 `true`。目标 key 不存在、当前列结构不允许修改、preview 模式过滤掉该 patch 或本次调用没有实际变化时，也应返回 `false`。

ref API 仍需遵守当前列结构边界：目标 key 不存在、目标列已被当前 `columns.hidden` 排除，或目标列不在当前可渲染结构中时，本次调用不应重新创建旧列，也不应把 storage 中的旧结构带回表格。

这样外部 API 与内部交互在跨列场景中保持一致。

## 新功能接入约束

新增列配置能力时，先判断新增字段属于哪一类：

- 如果字段表达当前业务结构或运行时限制，应由当前 `columns` 决定，并在合并时保护当前声明。
- 如果字段表达可回放外观状态，应允许从 `ColumnState` 恢复，并在缺失时提供明确默认值或运行时补齐逻辑。
- 如果字段只决定当前页面是否开放交互入口，应进入 UI 控制面，不能作为 `columnsState` 字段过滤条件。
- 如果字段会影响同级排序、宽度分配、显隐、固定位置或 colSpan 覆盖范围，需要确认新增列、删除列、分组变化时的兼容行为。

新增字段不能默认假设旧 storage 一定包含它。旧数据缺字段时，合并结果仍应完整、可渲染，并且能被 `onColumnsStateChange` 输出后再次参与下一次初始化。

## 典型场景

### 业务新增列

用户之前保存过列顺序和列宽。业务升级后新增一列。合并结果应保留用户已有配置，并把新增列插入到当前声明位置附近。

### 业务删除列

用户 storage 中仍然有旧列。业务升级后该列已经移除。合并结果应忽略旧列，不再渲染，也不在下一次列配置交互写回时继续输出。

### 关闭排序 UI 但恢复顺序

业务希望当前页面不允许用户拖拽排序，但仍恢复用户过去保存的顺序。关闭 `sortableColumns` 即可。旧 `order` 仍参与渲染，并会在其它列配置写回时继续保留。

### 关闭显隐 UI 但恢复隐藏列

业务希望当前页面不展示显隐入口，但仍尊重用户之前隐藏过的列。关闭 `visibleColumns` 后，`visible: false` 仍参与渲染；用户只是不能通过内置入口继续修改显隐。

### 关闭显隐特性后 ref API 不生效

业务关闭 `visibleColumns` 后，内置显隐入口和 `setColumnVisible` 都不应继续修改显隐状态。已有 `visible` 状态仍会恢复和渲染；如果业务希望外部面板继续修改显隐，需要保持 `visibleColumns` 开启，并在业务 UI 层隐藏或禁用表格内置入口。

### 关闭列宽 UI 但恢复宽度

业务希望当前页面不允许拖拽列宽，但仍使用用户之前保存或 runtime hydration 补齐过的宽度。关闭 `resizableColumns` 后，`width` 仍参与渲染与写回；用户只是不能通过内置入口继续修改宽度。

### 列被改为禁止调整宽度

旧 storage 中可能保存了用户调整过的宽度。当前列声明 `resizeDisabled` 后，合并结果应使用当前 `columns` 经运行时布局后的宽度，并清除用户手动拖拽宽度影响，但仍输出该列当前可回放的宽度状态。

### 当前最小宽度变大

旧 storage 中保存的 `width` 可能小于当前列声明的 `resizeMinWidth`。恢复时应把 `width` 抬到当前 `resizeMinWidth`，但不把 `resizeMinWidth` 写入 `ColumnState`。

### 完整预览后统一保存

业务希望用户先尝试多种列配置，再统一保存。可以在至少一个列状态特性开启时调用 `startColumnsStatePreview()` 使用默认 `full` 模式。预览期间可修改字段由当前特性开关决定；保存时如果存在用户主动 patch，则触发一次 `previewSave`，输出完整 `columnsState`，`info.patches` 只包含这些用户 patch；取消时全部丢弃。

### 只查看隐藏列并恢复

业务希望用户查看隐藏列，但不希望顺手修改列宽、排序或固定状态。可以在 `visibleColumns` 开启时调用 `startColumnsStatePreview({ mode: 'visibleHotOnly' })`。预览期间只有初始隐藏列热区内的显隐变化能保存，其他列状态变化会被内部忽略。保存时仍输出完整 `columnsState`，`info.patches` 只包含用户主动提交且被允许的热区 visible patch。

### 分组结构变化

业务调整了分组层级。合并时应以当前分组结构为准，只在新的同级范围内恢复可匹配列的用户状态，避免旧父级关系影响新结构。跨父级移动的列不会自动继承旧父级下的同名列外观状态；它会按新父级中的新增列补齐默认顺序和运行时宽度。

### 外部清空 storage

业务清空 localStorage 或后端配置后，如果希望表格内部也立刻回到默认列状态，需要同步改变 `columnsConfig.columnsStateKey`。只改变 `storageColumnsState` 不会把 ready 后的内部列状态当作受控状态覆盖。

### 后置开启列宽 UI

业务先保存了完整 `columnsState`，之后才开启 `resizableColumns`。内部应继续使用已有宽度状态；如果旧状态缺少部分叶子列宽度，则在当前 columns 和容器宽度基础上补齐。用户随后拖拽单列宽度时，`info.patches` 只包含被拖拽列，但输出的 `columnsState` 必须包含完整排序、显隐、固定和宽度状态。

### 重复开启和关闭 UI 能力

业务反复开启、关闭某项 UI 能力时，当前页面内部状态不因开关变化丢字段。关闭期间发生的其它列配置提交，也必须保留已存在的其它外观字段；被关闭特性对应的 ref API 不应继续提交 patch。若业务希望清除某类历史偏好，需要显式清理 storage 或触发新的 `columnsStateKey` 初始化，而不是关闭对应 UI 开关。

## 修改前检查清单

调整持久化合并逻辑或新增列配置能力前，需要确认：

- 当前 `columns` 新增的列是否一定进入合并结果。
- 当前 `columns` 删除的列是否一定从内部合并结果移除。
- 分组列父子关系是否以当前结构为准。
- 跨父级移动的列是否没有从旧父级下的同名 storage 恢复外观字段。
- 用户保存过的同级列顺序是否仍能恢复。
- 新增列插入位置是否贴近当前声明顺序。
- `hidden` 是否作为结构排除处理，而不是保存成 `visible: false`。
- `resizeDisabled` 是否阻断旧宽度继续影响当前列，并保留当前可回放宽度状态。
- `resizeMinWidth` 是否只来自当前 columns，且没有进入 `ColumnState`。
- `dragSortDisabled` 是否只作为当前交互约束，不从 storage 恢复。
- 四个 UI 开关关闭时，是否没有清洗 committed state、preview draft 或外部输出。
- 四个 UI 开关关闭时，已有 `order`、`visible`、`fixed`、`width` 是否仍然参与渲染和下一次写回。
- 四个 UI 开关关闭时，对应 ref API 是否会返回 `false`，而不是提交 patch。
- `storageColumnsState: []` 是否会被视为显式空快照并触发 eager 初始化。
- 只传 `columnsConfig: {}` 或只传 callback 时，是否不会误触发初始化和 ready。
- UI 开关变化、columns 变化和内部归一化是否避免误触发 `onColumnsStateChange`。
- 旧 storage 缺少字段时，是否会按当前 columns、默认值或运行时布局补齐。
- runtime width hydration 是否只更新内部状态，不误触发 `onColumnsStateChange`。
- 首次 ref API 调用是否不会触发列状态管线按需初始化。
- preview draft 是否在保存前按当前 columns rebase。
- `full` preview 是否基于完整 `columnsState`，而不是只保存当前开启 UI 对应字段。
- `full` preview 是否至少要求一个特性开关开启。
- preview save 的 `info.patches` 是否只包含预览期间用户主动提交的 patch，而不是 rebase、runtime width hydration 或新列补齐产生的内部归一化差异。
- preview save 是否按最终有效字段变化压缩用户 patch，例如 `setColumnVisible` 只输出 visible、`setColumnFixed` 只输出 fixed，宽度只在用户拖拽或 auto fill 时输出。
- `visibleHotOnly` preview 是否要求 `visibleColumns` 开启，并且只允许热区 visible patch，但保存时仍输出完整快照。
- `visibleHotOnly` 下 resize、auto fill、列排序和固定修改是否在所有可达入口中都被忽略或禁用。
- `onColumnsStateReady` 和 `onColumnsStateChange` 输出的数据是否还能在下一次初始化时参与合并。
- `onColumnsStateChange` 的完整快照与 `info.patches` 的增量语义是否清晰区分。
- 清空外部 storage 后，如需重置内部状态，是否同步更新了 `columnsStateKey`。

## 维护建议

持久化合并是列配置功能的数据入口。列宽、排序、显隐、固定等功能可以各自维护交互逻辑，但读取 storage、写回 `ColumnState`、响应当前 `columns` 变化时，都应遵守同一套合并边界。

后续如果引入持久化版本号、迁移机制、字段级恢复策略或清理旧列能力，也应把迁移结果视为“待合并的外观状态”，而不是直接替代表格当前列定义。自动清理外部 storage 属于单独能力，需要明确触发条件后再设计。
