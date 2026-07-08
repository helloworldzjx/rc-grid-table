# Table 列拖拽排序设计约束

## 目的

这份文档记录 Table 列拖拽排序的状态模型、预览布局、动画边界、DragOverlay 坑位以及后续修改前必须确认的约束。

列拖拽排序现在不是一个单独的 header 交互，它会同时影响 header、body、summary、fixed column、虚拟滚动、列宽、hover 热区和列状态提交。后续如果调整这块逻辑，优先遵守这里的模型。除非明确做一次设计升级，否则不要把局部修补绕过这些边界。

相关文件：

- `src/table/Head/HeadRow.tsx`
- `src/table/Head/HeadCell.tsx`
- `src/table/Head/HeadFilterCell.tsx`
- `src/table/Head/useSortablePreview.ts`
- `src/table/providers/ColumnSortableProvider.tsx`
- `src/table/contexts/ColumnSortableContext.tsx`
- `src/table/contexts/ColumnSortMotionContext.tsx`
- `src/table/contexts/ColumnSortPreviewLayoutContext.tsx`
- `src/table/hooks/useRenderedColumnLayout.ts`
- `src/table/CellContainer/index.tsx`
- `src/table/utils/columnMotion.ts`
- `test/table/columnMotion.test.ts`

## 总体模型

列拖拽排序分成三条链路：

```txt
交互链路:
HeadRow / dnd-kit
  -> validate active / over
  -> schedule sortable preview
  -> drag end / cancel cleanup

布局链路:
真实 TableLayoutContext
  + ColumnSortPreviewLayoutContext
  -> useRenderedColumnLayout
  -> Head / Body / Summary 渲染预览布局

动画链路:
useSortablePreview 计算 active-over 区间 motion keys
  -> ColumnSortMotionContext
  -> CellContainer 根据逻辑 x 坐标做 translateX 动画
```

这三条链路不要合并。交互状态负责拖拽事件，预览布局负责临时列顺序，动画状态负责哪些 cell 需要动。把它们混成一个全局状态会让 Table、虚拟滚动和所有 cell 在 pointer move 时被迫重算。

## 状态归属

| 状态或 context                    | 归属                     | 主要消费者                                        | 约束                                                                                                         |
| --------------------------------- | ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ColumnSortableContext`           | `ColumnSortableProvider` | `HeadRow`、`Head` 等需要命令式更新的入口          | 这是兼容旧聚合入口和更新 API 的 context。新增渲染订阅优先使用拆分 context。                                  |
| `ColumnSortableConfigContext`     | `ColumnSortableProvider` | `HeadCell`                                        | 只放 `sortableColumns` 这类低频配置。                                                                        |
| `ColumnSortableActiveContext`     | `ColumnSortableProvider` | `Table`、`HeadCell`、`HeadFilterCell`、`BodyCell` | 放 `activeStatus` 和 `hotKeys`。只表达当前拖拽列和热区，不放 preview layout。                                |
| `ColumnSortablePreviewingContext` | `ColumnSortableProvider` | `Placeholder`                                     | 只表达是否处在排序预览相关状态。                                                                             |
| `ColumnSortingContext`            | `ColumnSortableProvider` | `Table`                                           | 只放 `sortingColumns`，避免 `Table` 订阅 `sortableMotionKeys` 和 `sortableMotionVersion`。                   |
| `ColumnSortMotionContext`         | `ColumnSortableProvider` | `CellContainer`                                   | 放 `sortingColumns`、`sortableMotionKeys`、`sortableMotionVersion`。只给真正执行动画的容器使用。             |
| `ColumnSortPreviewLayoutContext`  | `ColumnSortableProvider` | `useRenderedColumnLayout`、局部布局消费者         | 放临时 `columns`、`flattenColumns`、宽度、fixed offset、`columnMotionPositions`。不要塞进根 `TableContext`。 |
| `TableLayoutContext`              | `src/table/index.tsx`    | 表格真实布局消费者                                | 始终代表真实 committed 布局，不承载列排序 preview draft。                                                    |

新增订阅点时先问一句：它需要的是配置、active/hot、previewing、sorting 标记、motion keys，还是预览布局？不要为了省一次 import 直接订阅聚合 `ColumnSortableContext`。

## 预览布局

真实布局和预览布局必须分开：

- 真实布局来自 `TableLayoutContext`，代表当前 committed 列结构。
- 排序预览布局由 `ColumnSortableProvider` 根据 `sortablePreviewState` 生成，单独通过 `ColumnSortPreviewLayoutContext` 下发。
- `useRenderedColumnLayout` 负责在有 preview layout 时使用 preview，没有时回退真实 layout。
- 预览布局使用真实列宽作为基准，只重新映射列顺序。列宽分配、虚拟滚动高度、最终列状态提交仍以真实布局和 committed state 为准。

不要把 `sortablePreviewState` 或预览列结构放回根 `TableContext`。这样会让排序中的 pointer move 放大全表重算，尤其会影响虚拟滚动、placeholder、body item 和 summary。

## 拖拽生命周期

### drag start

`HeadRow` 在 `handleDragStart` 中负责建立一次排序会话：

- 如果 `isSortableStartLocked()` 命中，忽略本次排序并清空 active/hot 状态。
- 调用 `onSortableStart()`。
- 清空 fixed 热区缓存。
- 设置 `document.documentElement.style.cursor = 'move'`。
- `sortablePreview.start()` 初始化 preview state、motion cache 和 motion keys。
- 启动横向滚动监听，用于 fixed column over 保护。
- 冻结 DragOverlay 的显示内容，避免 preview layout 改变后 overlay 跟着重新取 `activeColumn`。
- 根据 active cell 计算 visual keys，写入 `activeStatus`。
- 根据 fixed 规则更新 `hotKeys`。
- 设置 `activeKey`，开启 DragOverlay modifier。

不要在 drag start 里提前计算 overlay 的 pointer 坐标或 active rect。dnd-kit 在 start 事件里的 rect 数据和后续 overlay modifier 的坐标体系容易不一致，这个坑会导致 overlay 在重排时瞬移。

### drag over

`handleDragOver` 只在满足下面条件时调度预览：

- active 和 over 都是 sortable column。
- active 和 over 不是同一个 id。
- active/over column 存在，且都有 sort keys。
- active 和 over 在同一个 parent 下。
- active column 没有 `dragSortDisabled`。
- fixed 规则允许本次 over。
- active/over 都有 dnd-kit sortable data。

不满足条件时可以更新 fixed 热区，但不能调度 preview。

横向滚动期间，如果 over column 是 fixed column，要先阻止它参与交换。fixed column 处在 sticky 层，滚动后 droppable rect 可能短暂滞后。等滚动空闲后再允许正常排序。

### drag end

drag end 先 `flush()` 最后一帧 preview，再读取最终 preview state：

- 如果 preview 有变化，调用 `finishSortableAfterMotion(false, commit)`，等 motion 结束后提交 `updateSortableColumnsState(finalPreviewState)`。
- 如果没有变化，直接 `cleanupSortable(true)`，并调用 `onSortableEnd()`。

这里不能在 drag end 立刻清掉 `motionKeys`。最后一帧 preview layout 仍需要一个动画周期，否则 cell 会直接跳到最终位置。

### drag cancel

cancel 先 `sortablePreview.rollback()`：

- 如果 preview 已改变，先让 preview layout 回到真实列结构，但暂时保留 motion keys。
- 再通过 `finishSortableAfterMotion(true)` 延迟清理。

cancel 是回滚预览，不提交 columns state。

### cleanup

任何退出路径都必须清理这些资源：

- `sortableFinishTimerRef`
- 横向滚动 listener 和 scroll idle timer
- `fixedSortableHotKeysCacheRef`
- overlay active rect 缓存
- overlay content/snapshot
- document cursor
- `activeKey`
- `activeStatus`
- `hotKeys`
- preview state 和 motion keys

如果新增状态，只要它只属于一次拖拽会话，就必须接入 `cleanupSortable`、`finishSortableAfterMotion` 和 unmount cleanup。

## fixed column 规则

fixed 列排序规则当前是：

- 普通 active column 可以 over 任意列。
- fixed active column 只能 over fixed column。
- active 和 over 必须在同一个 parent 下。
- 横向滚动期间 over fixed column 会被暂时阻止。
- fixed active column 会额外计算 hot keys，用来提示可交换的 fixed 区域。

`fixedSortableHotKeysCacheRef` 是一次拖拽会话内的缓存。它只缓存 active key 对应的 hot keys，减少 `getCellFixedInfo`、header visual keys 和 leaf keys 的重复计算。drag start 和所有 cleanup 路径都要清空它。

## motion 规则

列排序动画不再依赖全量 motion layout 测量，而是使用逻辑 x 坐标手动做 transform：

- `columnMotionPositions` 由 `getColumnMotionStartPositions(widths)` 预先计算。
- cell 根据 `getColumnMotionPositionFromStartPositions(positions, colStart, fixedInfo)` 得到逻辑 x 坐标。
- `CellContainer` 保存上一帧逻辑 x 坐标，当命中 motion keys 且位置变化时，用 `animateMini` 从旧 offset 动画到新位置。
- `motionLayoutDependency={false}` 表示该 cell 不参与这套动画。

`getColumnMotionPosition` 及其 start-position 版本只计算“列排序动画用的逻辑 x 坐标”，不等同于真实 DOM rect。它不应该读取 DOM，也不应该表达 fixed end 的视觉 right offset。

`sortableMotionKeys` 只覆盖 active 和 over 之间的连续叶子列区间。分组 header 或跨列 cell 只要覆盖到这个区间，也会被命中。不要把整张表所有 cell 都纳入 motion，否则 pointer move 会造成大量测量和动画成本。

motion keys 有保留机制：当 active-over 区间快速缩小时，刚离开的 key 会保留一个 `COLUMNS_SORT_MOTION_DURATION` 周期，避免动画中途被切回普通组件或直接停止。

## DragOverlay 规则

DragOverlay 有两个独立职责：

- 快照内容和尺寸，避免排序预览改变 header 结构时 overlay 重新取错内容或尺寸。
- 通过 modifier 修正 overlay 相对 pointer 的偏移。

不要把这两个职责混在一起。内容快照只服务渲染稳定性，不能拿它推导 pointer 坐标。

当前 overlay modifier 的约束：

- modifier 内部使用 `activatorEvent` 取得 pointer coordinates。
- modifier 内部使用 `activeNodeRect`，并在第一次拿到时写入 `activeRectRef`。
- `activeRectRef` 只保存本次拖拽开始时的 active rect，用来抵抗 preview layout 重排。
- offset x 使用 `COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X`。
- offset y 使用 overlay 高度的一半。

已知坑位：

- 不要在 `handleDragStart` 里使用 `event.active.rect.current.initial` 计算 overlay rect。
- 不要在 `handleDragStart` 里使用 `getEventCoordinates(event.activatorEvent)` 保存 pointer 坐标。
- 不要让 DragOverlay 直接依赖实时 `activeColumn` 取 children。preview layout 会改变 header 结构，overlay 可能在重排时变内容或瞬移。

如果后续把 `dragOverlayContent` 扩展回 `dragOverlaySnapshot`，也要保持同一个语义：snapshot 只冻结渲染内容和尺寸，坐标仍由 modifier 在 overlay 生命周期中计算。

## 性能约束

后续修改必须守住这些边界：

- 不要让 `Table` 订阅 `sortableMotionKeys` 或 `sortableMotionVersion`。
- 不要把 preview layout 塞进 `TableLayoutContext` 或根 `TableContext`。
- 不要在每个 cell 渲染时重新从列宽数组做前缀求和，使用 `columnMotionPositions`。
- 不要让所有 cell 都参与 motion，只让 active-over 区间相关 cell 动。
- 不要用 pointer move 频率直接 commit preview state，`useSortablePreview` 使用 RAF 合并更新。
- 不要把 fixed hot keys 每次 over 都全量重算，保留会话级缓存。

这里的目标不是零 rerender，而是把重渲染限制在真正需要响应 preview layout、active/hot 状态或 motion keys 的消费者上。

## 测试建议

修改列拖拽排序后，至少覆盖这些方向：

- `src/table/utils/columnMotion.ts` 的逻辑坐标：普通列、跨列、fixed start、fixed end、precomputed positions。
- 普通列拖普通列，preview 顺序和最终提交一致。
- fixed active column 不能拖到普通列，普通 active column 的现有行为不被破坏。
- 横向滚动期间 over fixed column 不触发错误 preview。
- 分组 header 和 colSpan 覆盖范围能命中正确 motion keys。
- drag cancel 能回滚 preview，并保留最后一段动画。
- DragOverlay 在 preview 重排时不变内容、不跳到错误位置。

单测优先放在确定性 helper 上，例如 `test/table/columnMotion.test.ts`。涉及 dnd-kit 和真实 DOM rect 的行为更适合补集成测试或手工回归场景。

## 修改检查清单

改动列拖拽排序前后至少确认：

- 新增状态是否明确归属到某个 context，而不是顺手塞进聚合 context。
- 新增订阅者是否订阅了最小 context。
- `Table` 是否仍然只订阅 `activeStatus` 和 `sortingColumns` 这类必要状态。
- preview layout 是否仍然只通过 `ColumnSortPreviewLayoutContext` 下发。
- `TableLayoutContext` 是否仍然代表真实 committed layout。
- `useRenderedColumnLayout` 是否仍然是 preview layout 的唯一合并入口。
- drag start 是否没有从事件里保存 overlay pointer 坐标或 active rect。
- DragOverlay 是否仍然冻结内容，且坐标由 modifier 计算。
- fixed active column 是否仍然不能 over 普通列。
- 横向滚动期间 fixed over 保护是否仍然存在。
- hot keys 缓存是否在 drag start、cleanup 和 unmount 时清空。
- drag end 和 cancel 是否等待 motion 结束后再清 motion keys。
- cancel 是否只回滚 preview，不提交 columns state。
- `COLUMNS_SORT_MOTION_DURATION` 是否同时约束动画、motion key 释放和 drag end 收尾等待。
- motion helper 是否仍然只表达逻辑 x 坐标，不表达真实 DOM rect。
- 分组 header、跨列 cell、body、summary、filter row 是否仍然能拿到一致的 `columnMotionPositions`。

## 维护建议

列拖拽排序的复杂度主要来自“临时预览”和“真实列状态”同时存在。后续演进时，优先保持这几个边界稳定：

- `HeadRow` 管拖拽事件和会话清理。
- `useSortablePreview` 管 preview draft、RAF 合并和 motion keys。
- `ColumnSortableProvider` 管 context 拆分和 preview layout 下发。
- `useRenderedColumnLayout` 管真实布局和预览布局的合并。
- `CellContainer` 管实际 transform 动画。

如果一次改动需要突破这些边界，先更新这份文档，再改代码。这样后续维护者能知道复杂度是设计升级带来的，而不是无意间把状态模型绕散了。
