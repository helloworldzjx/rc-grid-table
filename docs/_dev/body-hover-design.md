# Table Body Hover 设计约束

## 目的

这份文档记录 Table body hover 的设计目标、状态模型、事件模型、虚拟滚动协作方式、以及后续修改时必须守住的约束。

以后调整 hover 相关代码时，优先遵守这里的模型。除非明确要做一次设计升级，否则不要用局部补丁绕开这些规则。

相关文件：

- `src/table/index.tsx`
- `src/table/Table.tsx`
- `src/table/interface.ts`
- `src/table/Body/hover.ts`
- `src/table/Body/BodyItem.tsx`
- `src/table/Body/BodyRow.tsx`
- `src/table/Body/BodyCell.tsx`
- `src/table/Body/virtual/VirtualBody.tsx`
- `src/table/contexts/BodyHoverContext.tsx`
- `src/table/hooks/useBodyHoverController.ts`
- `src/table/hooks/useBodyHoverPointerPlugin.ts`
- `src/table/hooks/useBodyHoverScrollFollowPlugin.ts`
- `src/table/hooks/viewportMouseTracker.ts`
- `src/table/style/classNames.ts`
- `src/table/style/index.ts`

## 背景

原始的 CSS `:hover` 行高亮只能表达“鼠标正悬停在哪个 DOM 节点上”，但当前表格的 body hover 还需要表达这些语义：

- `rowSpan` 覆盖行 hover 时，源单元格也要一起高亮。
- hover `rowSpan` 源单元格时，整段 span 范围都要高亮。
- 虚拟滚动下的 `rowSpanOverlay` 单元格需要和普通可见行保持统一高亮。
- scroll follow 期间，hover 不能只依赖新的 `mousemove` 事件。

这意味着 hover 已经不是单纯的样式问题，而是一个带有“行区间语义”的运行时行为。

## 设计目标

当前 hover 设计必须同时满足：

- 支持 `rowSpan`、被 `rowSpan` 覆盖的行、以及虚拟列表 `rowSpanOverlay`。
- hover 渲染保持 React 语义，不靠手动批量切 DOM class 驱动整张表。
- 指针移动时，不触发整张表或整块可见区的 React 重渲染。
- scroll follow 是可插拔能力，不和 hover 渲染模型耦死。
- `onRow`、`onCell`、自定义 `components` 的常规用法不被破坏。
- `rowHoverable={false}` 时可以完整关闭 hover 能力。

## 非目标

当前设计明确不覆盖这些能力：

- 不提供键盘 hover 或触屏 hover 模型。
- 不让普通非 `rowSpan` 单元格自己单独订阅 hover 背景。
- 不让被 `rowSpan` 覆盖的普通行 hover 时自动扩成整段 span 组 hover。
- 不自动识别所有外部滚动祖先。非 `window` 的外层滚动容器需要显式传入 `getScrollContainer`。

## 运行时分层

当前 body hover 拆成四层：

```txt
BodyHoverContext
  - 对 row/cell 暴露可订阅的 activeInterval
  - 对 cell 暴露 DOM 注册入口 setCellElement

useBodyHoverController
  - 管理 cell registry、hoveredCell、activeInterval
  - 负责从 DOM target 解析“当前 hover 的 cell”
  - 负责基于 viewport pointer 做同步

useBodyHoverPointerPlugin
  - 处理 body 内正常 mousemove / mouseleave
  - 记录 viewport pointer 坐标

useBodyHoverScrollFollowPlugin
  - 监听滚动并调度“基于 viewport pointer 的 hover 重同步”
  - 只负责 scroll follow，不负责 hover 渲染
```

这里的关键边界是：

- hover 渲染由 React 完成。
- DOM 命中检测只用于“当前指针在视觉上指向哪个 cell”。
- scroll follow 只是 hover 控制器的插件，不是 hover 状态本体。

## 核心数据模型

body hover 的核心状态不是“当前 cell id”，而是一个行区间：

```ts
type BodyHoverInterval = {
  start: number;
  end: number;
};
```

对应规则在 `src/table/Body/hover.ts`：

- 普通 cell 的区间是 `[rowIndex, rowIndex]`。
- `rowSpan > 1` 的源 cell 或 overlay cell 的区间是 `[rowIndex, rowIndex + rowSpan - 1]`。

这个区间是整个设计的核心，不要退回“当前 hover 行 index”这种更弱的模型，否则 `rowSpan` 语义会重新散掉。

## Hover 判定规则

### 1. active interval 的来源

- hover 普通 cell：`activeInterval = [当前行, 当前行]`
- hover `rowSpan` 源 cell：`activeInterval = [spanStart, spanEnd]`
- hover 虚拟 `rowSpanOverlay` cell：`activeInterval = [spanStart, spanEnd]`
- body `mouseleave`：`activeInterval = null`

### 2. row 高亮规则

row 只关心自己是否落在当前区间内：

- `rowIndex >= activeInterval.start`
- `rowIndex <= activeInterval.end`
- 且该 row 本身 `hoverable === true`

这意味着：

- hover 普通行时，只有当前行带 `bodyHoverRowCls`
- hover `rowSpan` 源 cell 时，整段 span 覆盖范围内的行都带 `bodyHoverRowCls`

### 3. cell 高亮规则

cell 高亮只服务 `rowSpan` 源 cell 和虚拟 overlay cell，不服务普通 cell。

cell 命中条件必须同时满足：

- `hoverable === true`
- `spanSource === true`
- `cell.interval` 与 `activeInterval` 相交

这里“相交”是整个实现最重要的统一规则：

- 覆盖行 hover 时，当前 active interval 只有一行，但会和覆盖它的 span-source interval 相交，所以能把共享的 span cell 高亮出来。
- hover span-source cell 时，active interval 会扩成整段范围，所有可见的源 cell 和 overlay cell 只要与这段范围相交，就都会高亮。
- 虚拟列表里普通可见行和 overlay cell 可以用同一条规则一起工作，不需要额外分支。

### 4. 一个故意保留的行为

hover 被 `rowSpan` 覆盖的普通行时，不扩成整段 span 组 hover。

当前行为是：

- 当前行高亮。
- 与该行相交的 span-source cell 或 overlay cell 高亮。
- 不把 span 覆盖范围内所有行都点亮。

这是当前语义，不要在没有明确设计升级的前提下改掉。

## React 渲染模型

当前实现是“React 渲染 + 外部 store 订阅”的混合模型，不是纯 DOM class runtime。

### row 订阅

`BodyRow` 通过 `useBodyHoverRowHovered()` 订阅当前 row 是否命中。

只有命中状态变化的 row 会重新渲染，不应因为 pointer move 让整张表全部 rerender。

### cell 订阅

`BodyCell` 通过：

- `useBodyHoverCellRef()` 注册自己的 DOM 与 hover meta
- `useBodyHoverCellHovered()` 订阅自己是否应带 `bodyHoverCellCls`

普通 cell 不需要订阅 hover 背景。只有 `spanSource === true` 的 cell 才会真正参与 cell 级 hover 订阅。

这样做的原因是：

- 普通 cell 的背景由 row class 提供。
- 只有 span-source cell 需要跨行联动高亮。
- 可以把 rerender 范围缩到真正命中的那几个 row / cell。

## 特殊节点规则

这些节点的 hover 行为是刻意设计出来的，后续不要随意合并：

### 普通数据行

- `rowHoverable` 和 `cellHoverable` 都可以开启
- 是 hover 体系的主要参与者

### `rowSpanOverlay` 行

当前 `BodyItem` 的规则是：

- `rowHoverable = false`
- `cellHoverable = true`

这样做的目的是：

- overlay row 自己不画整行 hover 背景，避免虚拟 overlay 出现重复行底色
- overlay cell 仍可作为 span-source cell 参与高亮，保证视觉连续性

### expanded row

expanded row 不参与 body hover。

原因不是“样式上不想要”，而是它不属于数据行区间模型的一部分。不要把 expanded row 混进 active interval 计算。

### no data row

空状态行不参与 body hover。

`bodyNoDataRowCls` 可以保留给外部使用，但它不是 hover runtime 的目标节点。

### row sort overlay

row sort drag overlay 不参与 hover。

当前规则是：

- overlay row 不参与 row hover
- overlay cell 也不参与 hover 注册

不要让拖拽 overlay 继承 hover，否则会把“悬停态”和“拖拽预览态”混在一起。

## Scroll Follow 设计

scroll follow 是插件，不是 hover 本体。

### 为什么不能只靠 mousemove

滚动过程中，浏览器不会因为内容从指针下经过就稳定地产生新的 body `mousemove`。如果只靠 body 内的指针事件：

- 表格滚到指针下方时，hover 不会自动出现
- 已 hover 的 cell 卸载后，hover 可能挂住
- 虚拟滚动期间 hover 会和视觉位置脱节

### 当前方案

当前 scroll follow 依赖两个事实：

- pointer plugin 在正常鼠标移动时持续记录 viewport 坐标
- scroll follow plugin 在滚动时用 `elementFromPoint(clientX, clientY)` 重新解析当前视觉命中的 cell

流程是：

```txt
mousemove
  -> 记录 viewport mouse position
  -> 正常更新 hover

scroll
  -> notifyScroll()
  -> raf 调度 syncHoverFromViewportPointer()
  -> elementFromPoint()
  -> 重新解析 hover cell
```

### 为什么要 raf 调度

滚动同步使用 `raf` 而不是每次 scroll 事件里立刻命中检测，原因是：

- 避免同一帧内重复 hit test
- 等待滚动后的布局更稳定
- 降低高频 scroll 期间的额外开销

### stale hover 自愈

如果当前 hovered cell 因为虚拟滚动或重排被卸载：

- controller 会在 cell 注销时清理当前引用
- 如果它正是当前 hovered cell，会补一次基于 viewport pointer 的重同步

这样可以避免 hover 挂在已经不存在的 DOM 上。

### 外部滚动容器

`getScrollContainer` 只服务“table 跟随外部容器滚动”的 scroll follow 场景。

当前规则：

- 未传 `getScrollContainer` 时，默认监听 `window`
- table 自己的 body scroll 和虚拟纵向滚动，不通过这个 prop，而是内部直接调用 `notifyScroll()`
- 如果 table 跟随一个非 `window` 的外层滚动容器移动，需要显式传入 `getScrollContainer`

不要把 `getScrollContainer` 理解成“table 的实际 body scroll 容器 getter”，它当前只承担 scroll follow 的外部补充职责。

## 自定义 `components` 约束

当前 hover 运行依赖内部 row / cell 结构继续存在，自定义 `components` 时至少要满足：

- `components.body.row` 能透传 `className`、`style` 和常规 HTML 属性
- `components.body.cell` 能透传 `className`、`style` 和常规 HTML 属性
- `components.body.cell` 必须把 `ref` 落到真实 DOM 元素上

原因是：

- row hover class 是加在 row DOM 上的
- cell hover class 是加在 cell DOM 上的
- hover controller 需要通过 cell DOM ref 建立 registry

如果自定义 cell 组件吞掉了 `ref` 或没有落到真实 DOM，`rowHoverable` 无法保证正常工作。

## 样式约束

当前样式层只负责消费 JS/React 算好的 hover class，不再自己做 hover 语义推断。

样式层必须保持这些事实：

- `bodyHoverRowCls` 负责普通行背景色
- `bodyHoverCellCls` 负责 span-source cell / overlay cell 背景色
- hover 背景 token 继续使用 `cellColorHoverBg`
- hover 样式必须覆盖 stripe 背景
- 不要破坏列排序预览、拖拽预览等更高优先级视觉态

如果以后 hover 样式不生效，先检查 class 语义和 selector 优先级，不要先回退到 CSS `:hover`。

## 性能约束

当前方案的性能目标不是“完全零 rerender”，而是：

- pointer move 不触发整张表 rerender
- hover 变化时，只 rerender 命中的少量 row / cell
- scroll follow 的 DOM hit test 只在滚动同步点发生

不要为了减少几个订阅点，又退回“统一批量改 DOM class”的全量 runtime。那样虽然局部看起来少 rerender，但 hover 语义、可维护性、以及和 React 状态的一致性会更差。

## 典型场景

### 普通行 hover

- 当前行带 `bodyHoverRowCls`
- 不额外点亮其他行
- 不额外点亮普通 cell

### 覆盖行 hover

- 当前行带 `bodyHoverRowCls`
- 覆盖该行的 span-source cell / overlay cell 带 `bodyHoverCellCls`
- 不扩成整段 span 组 row hover

### span-source cell hover

- span 覆盖范围内的行都带 `bodyHoverRowCls`
- 与该区间相交的所有可见 span-source cell / overlay cell 都带 `bodyHoverCellCls`

### 滚动期间 hover 跟随

- 如果 viewport pointer 已知，scroll follow 会在滚动后重同步
- 如果 pointer 还没被记录过，则不会凭空构造 hover

## 修改检查清单

改动 hover 相关逻辑后至少确认：

- `rowHoverable={false}` 时，pointer hover 和 scroll follow 都被关闭。
- hover 普通行时，行为和普通 row hover 一致。
- hover 被 `rowSpan` 覆盖的行时，只高亮当前行和共享 span cell，不扩整组。
- hover `rowSpan` 源 cell 时，整段 span 覆盖行都高亮。
- 虚拟滚动下 `rowSpanOverlay` cell 与普通可见行能联动高亮。
- `rowSpanOverlay` row 本身不会产生重复 row hover 背景。
- expanded row、empty row、row sort overlay 不会意外带 hover。
- stripe 模式下 hover 背景能正确盖住条纹底色。
- fixed start / fixed end 列下 hover 背景仍然正确。
- `onRow` / `onCell` 自定义事件没有被 hover 插件吞掉。
- 自定义 `components.body.cell` 如果不转发 ref，文档或类型约束是否已经明确。
- 外部非 `window` 滚动容器场景下，`getScrollContainer` 仍能补上 scroll follow。
- hovered cell 卸载后不会挂住旧 hover。

## 维护建议

后续如果继续演进 hover，优先保持下面这三层边界稳定：

- 用 `BodyHoverInterval` 表达 hover 语义
- 用 React 订阅表达 row / cell 是否高亮
- 用插件处理 pointer 和 scroll follow

如果某次改动需要突破这三层边界，最好先把设计升级本身写清楚，再改代码。这样后面的实现才不会重新长回“局部能跑，但整体逻辑已经偏离原模型”的状态。
