# Table fixed 设计

## 目的

这份文档记录 table 列固定功能的设计语义。

这里的 `fixed` 不是传统三段式 column pinning：

```text
[start fixed columns] [normal columns] [end fixed columns]
```

本项目希望支持 gapped fixed columns，也就是列在原始树结构完全拍平后，`start` 固定列不一定全在左侧，非固定列不一定全在中间，`end` 固定列也不一定全在右侧。

因此这里的 `fixed` 采用局部 sticky 语义：

```text
列保持原始顺序，不因为 fixed 被重排；
横向滚动时，列根据 fixed 方向吸附到 start 或 end 边界。
```

## 结论

外部 `columns` 配置只暴露两个固定方向：

```ts
export type ColumnFixed = 'start' | 'end';

export interface Column {
  fixed?: ColumnFixed;
  children?: Column[];
}
```

字段语义：

- `fixed: 'start'`：固定到起始侧。
- `fixed: 'end'`：固定到结束侧。
- `fixed` 未设置：不固定。

外部 `columns` 配置不暴露 `false`。对列声明来说，`fixed` 缺省就是不固定。内部状态和命令式 ref API 可以使用 `false`，用来表达“明确取消固定”。

内部状态需要额外支持 `false` 和 `undefined`，用来区分“明确取消固定”和“没有自己的设置”：

```ts
type OwnFixedState = 'start' | 'end' | false | undefined;
type EffectiveFixedState = 'start' | 'end' | false;
type RenderFixedState = 'start' | 'end' | false;
type GroupFixedState = 'start' | 'end' | false | 'mixed';
```

状态含义：

- `undefined`：当前节点没有自己的设置，可以继承父级默认值。
- `false`：当前节点明确取消固定，不继承父级默认值。
- `'start'`：当前节点明确固定到起始侧。
- `'end'`：当前节点明确固定到结束侧。

一句话概括：

```text
外部 columns 配置中的 fixed 只有 start/end/缺省；
内部状态和命令式 ref API 中的 fixed 有 start/end/false/undefined；
布局事实以可见叶子列的 effectiveFixed 为准。
```

## fixed 的局部 sticky 语义

`fixed` 不改变列的原始顺序。

例如：

```text
A normal
B fixed start
C normal
D fixed start
E normal
```

最终视觉顺序仍然是：

```text
A, B, C, D, E
```

横向滚动时：

```text
B 吸附到 start 边界；
D 到达吸附位置后，吸附在 B 后面。
```

不应该自动重排为：

```text
B, D, A, C, E
```

这意味着本设计中的 `fixed` 更接近“局部 sticky column”，而不是“分区 pinning column”。

这里的“不因为 fixed 被重排”描述的是 `columns` 配置、状态恢复和布局计算中的 `fixed` 字段语义。命令式 API 可以在修改 fixed 的同时显式表达额外排序意图：`TableRef.setColumnFixed(key, fixed)` 只修改 fixed，不修改 order；`TableRef.setColumnFixed(key, fixed, { insertPosition })` 则表示一次“修改 fixed 并移动到目标固定类型集合首/尾”的用户命令，此时 order 变化来自命令参数，不是 fixed 字段自身的自动重排。

当命令式 fixed 操作携带 `insertPosition` 并产生 `order` 重排时，重排仍应维护当前列状态树中同一父节点下的完整顺序。被 `colSpan` 覆盖的列仍是可被外部 ref API 通过 key 指向的真实列；它只是在内部 resize width 和 columns order 这类基于当前渲染命中的交互中没有独立入口。`setColumnFixed` 在目标 key 本身是有效 `colSpan > 1` 的入口列时，默认会把被覆盖列纳入 fixed/order 操作；如果只想操作入口列自身，可以传入 `coveredColSpan: false`。

## start/end 而不是 left/right

固定方向使用 `start` 和 `end`，不使用 `left` 和 `right`。

原因是 `start/end` 可以自然兼容 RTL：

```text
LTR: start = left, end = right
RTL: start = right, end = left
```

布局计算可以先基于 `start/end` 完成，再在渲染层根据 direction 映射到 CSS 的 `left/right`。

## 外部配置到内部状态

外部列配置进入内部后，先转换成自己的 fixed 状态：

```ts
const ownFixed: OwnFixedState = column.fixed;
```

外部 `columns` 配置只能产生：

```ts
'start' | 'end' | undefined;
```

内部交互和命令式 ref API 可以额外产生：

```ts
false;
```

例如列设置面板里的取消固定按钮，或 `TableRef.setColumnFixed(key, false)`：

```ts
ownFixed = false;
```

这里的 `false` 表示“明确取消固定”，不是“没有设置”。

## 父子规则

固定列的树结构规则固定为三句话：

```text
父级 -> 子级：只作为默认值或批量操作。
子级 -> 父级：决定父级实际渲染 fixed。
冲突时：子级 effectiveFixed 赢。
```

### 父级对子级

父级 `ownFixed` 可以作为子级的默认值。

例如：

```text
Parent ownFixed = start
  A ownFixed = undefined
  B ownFixed = false
  C ownFixed = end
```

叶子列的有效状态为：

```text
A effectiveFixed = start
B effectiveFixed = false
C effectiveFixed = end
```

计算公式：

```ts
leaf.effectiveFixed = leaf.ownFixed ?? inheritedFixed ?? false;
```

注意：

```text
undefined 表示可以继承；
false 表示明确取消，不继续继承。
```

### 子级对父级

父级表头的实际渲染 fixed 状态不直接由父级自己的 `ownFixed` 决定，而是由所有可见叶子列的 `effectiveFixed` 聚合得到。

聚合规则：

```text
所有可见叶子都是 start -> parent.renderFixed = start
所有可见叶子都是 end   -> parent.renderFixed = end
所有可见叶子都是 false -> parent.renderFixed = false
其他情况               -> parent.renderFixed = false，展示状态为 mixed
```

原因是父级 header cell 必须和它覆盖的叶子列对齐。真正参与布局的是可见叶子列。

### 冲突处理

如果出现父级和子级方向冲突：

```text
Parent ownFixed = start
children effectiveFixed 全部是 end
```

最终应该是：

```text
Parent renderFixed = end
```

父级自己的 `ownFixed` 只给没有显式 fixed 状态的子孙叶子做默认值。只要子级已经有自己的有效结果，就由子级结果决定父级渲染。

可以在开发环境给出 warning，但不能让父级强行覆盖子级：

```text
Parent fixed is start, but all child columns resolve to end.
Parent render fixed follows child columns.
```

## 不做的自动推导

不要根据第一个子级反向设置父级 fixed。

不应该做：

```text
Parent ownFixed = undefined
  A ownFixed = start
  B ownFixed = undefined
  C ownFixed = undefined

=> 自动把 Parent ownFixed 设置为 start
```

原因是这会导致 `B`、`C` 被隐式继承为 `start`，用户只固定了一个子列，却让整个分组被固定，副作用过强。

父级 `ownFixed` 只应该来自：

- 外部 `column.fixed` 配置。
- 用户点击父级固定按钮。
- 用户点击父级取消固定按钮。

子级状态不会反向修改父级自己的 `ownFixed`。子级只影响父级的派生展示状态和实际渲染状态。

## 同级规则

同级列之间不应该互相修改 fixed 状态。

例如：

```text
A effectiveFixed = start
B effectiveFixed = false
C effectiveFixed = start
```

`A` 不应该改变 `B`，`C` 也不应该改变 `B`。

同级之间只在布局计算时互相影响，例如 sticky offset：

```text
A left = 0
C left = A.width
```

这是布局影响，不是状态影响。

## 按钮行为

### 子级按钮

子级按钮只影响当前列：

```text
点击子级固定到 start -> 当前列 ownFixed = start
点击子级固定到 end   -> 当前列 ownFixed = end
点击子级取消固定     -> 当前列 ownFixed = false
```

### 父级按钮

父级按钮是批量状态操作入口。它影响该父级下的目标叶子列集合；目标集合由当前列结构和具体入口/API 覆盖规则决定，固定列设计不再额外按 `visible: true / false` 推导隐藏子列是否跟随。渲染布局和展示状态仍只以当前可见叶子列的 `effectiveFixed` 聚合结果为准。

```text
点击父级固定到 start -> 目标叶子列 ownFixed = start
点击父级固定到 end   -> 目标叶子列 ownFixed = end
点击父级取消固定     -> 目标叶子列 ownFixed = false
```

父级按钮的展示状态由当前可见叶子列聚合：

```text
所有叶子 start -> 显示 start
所有叶子 end   -> 显示 end
所有叶子 false -> 显示未固定
混合状态       -> 显示 mixed / 半选
```

mixed 状态下，父级不作为整体 sticky 渲染。

## 计算阶段

推荐分成四个阶段：

```text
1. 过滤不可见列，得到 visible column tree。
2. 从根到叶计算 ownFixed/inheritedFixed/effectiveFixed。
3. 基于可见叶子列计算 sticky offset。
4. 从叶子向父级聚合 renderFixed/groupFixedState。
```

### 叶子列 effectiveFixed

只让可见叶子列成为布局事实来源：

```ts
type LeafColumnState = {
  key: string;
  width: number;
  ownFixed: OwnFixedState;
  effectiveFixed: EffectiveFixedState;
};
```

计算时传入父级继承值：

```ts
function resolveEffectiveFixed(
  ownFixed: OwnFixedState,
  inheritedFixed: EffectiveFixedState,
): EffectiveFixedState {
  return ownFixed ?? inheritedFixed;
}
```

根节点的继承值为：

```ts
false;
```

### 父级 renderFixed

父级的 `renderFixed` 根据可见叶子列聚合：

```ts
function aggregateRenderFixed(
  leafFixedList: EffectiveFixedState[],
): RenderFixedState {
  if (leafFixedList.length === 0) {
    return false;
  }

  const first = leafFixedList[0];

  return leafFixedList.every((fixed) => fixed === first) ? first : false;
}
```

父级按钮的展示状态可以保留 mixed：

```ts
function aggregateGroupFixedState(
  leafFixedList: EffectiveFixedState[],
): GroupFixedState {
  if (leafFixedList.length === 0) {
    return false;
  }

  const first = leafFixedList[0];

  return leafFixedList.every((fixed) => fixed === first) ? first : 'mixed';
}
```

## sticky offset 计算

sticky offset 只基于最终可见叶子列计算，且不改变列顺序。

### start offset

`start` 固定列的 offset 等于它之前所有 `effectiveFixed === 'start'` 的可见叶子列宽度之和。

```ts
let startOffset = 0;

for (const leaf of visibleLeafColumns) {
  if (leaf.effectiveFixed !== 'start') {
    continue;
  }

  leaf.stickyStart = startOffset;
  startOffset += leaf.width;
}
```

示例：

```text
A normal 100
B start  120
C normal 200
D start  80
```

结果：

```text
B stickyStart = 0
D stickyStart = 120
```

### end offset

`end` 固定列的 offset 等于它之后所有 `effectiveFixed === 'end'` 的可见叶子列宽度之和。

```ts
let endOffset = 0;

for (let i = visibleLeafColumns.length - 1; i >= 0; i -= 1) {
  const leaf = visibleLeafColumns[i];

  if (leaf.effectiveFixed !== 'end') {
    continue;
  }

  leaf.stickyEnd = endOffset;
  endOffset += leaf.width;
}
```

示例：

```text
A end    100
B normal 120
C end    140
D normal 160
E end    80
```

结果：

```text
E stickyEnd = 0
C stickyEnd = 80
A stickyEnd = 220
```

## 渲染规则

渲染时根据 `renderFixed` 和 direction 映射到 CSS sticky 属性。

LTR：

```text
start -> left
end   -> right
```

RTL：

```text
start -> right
end   -> left
```

示例：

```ts
const style =
  fixed === 'start'
    ? {
        position: 'sticky',
        left: direction === 'ltr' ? stickyStart : undefined,
        right: direction === 'rtl' ? stickyStart : undefined,
      }
    : fixed === 'end'
    ? {
        position: 'sticky',
        right: direction === 'ltr' ? stickyEnd : undefined,
        left: direction === 'rtl' ? stickyEnd : undefined,
      }
    : undefined;
```

实际实现中还需要结合：

- `z-index`
- 固定列阴影
- 横向滚动状态
- header/body 对齐
- 虚拟滚动下的固定列常驻渲染

## 树表头渲染

父级 header cell 的 sticky 渲染必须与其覆盖的叶子列一致。

推荐规则：

```text
所有可见叶子同为 start -> 父级 header sticky start
所有可见叶子同为 end   -> 父级 header sticky end
其他情况               -> 父级 header 不作为整体 sticky
```

当分组为 mixed 时：

```text
父级 header 不整体 sticky；
叶子列仍按各自 effectiveFixed sticky。
```

如果未来需要让 mixed group 内的部分 header 也 sticky，需要将 header tree 按 sticky 区域拆分。当前设计不默认引入这个复杂度。

## 典型场景

### 父级作为默认值

输入：

```text
Parent ownFixed = start
  A ownFixed = undefined
  B ownFixed = undefined
```

结果：

```text
A effectiveFixed = start
B effectiveFixed = start
Parent renderFixed = start
```

### 子级明确取消

输入：

```text
Parent ownFixed = start
  A ownFixed = undefined
  B ownFixed = false
```

结果：

```text
A effectiveFixed = start
B effectiveFixed = false
Parent renderFixed = false
Parent groupFixedState = mixed
```

### 子级覆盖父级方向

输入：

```text
Parent ownFixed = start
  A ownFixed = end
  B ownFixed = end
```

结果：

```text
A effectiveFixed = end
B effectiveFixed = end
Parent renderFixed = end
```

原因：

```text
父级 ownFixed 只是默认值；
子级有显式状态时，子级 effectiveFixed 决定父级实际渲染。
```

### 第一个子级固定不反推父级

输入：

```text
Parent ownFixed = undefined
  A ownFixed = start
  B ownFixed = undefined
  C ownFixed = undefined
```

结果：

```text
A effectiveFixed = start
B effectiveFixed = false
C effectiveFixed = false
Parent renderFixed = false
Parent groupFixedState = mixed
```

不应该自动变成：

```text
Parent ownFixed = start
```

### gapped fixed columns

输入：

```text
A normal 100
B start  120
C normal 200
D start  80
E end    100
F normal 120
G end    140
```

视觉顺序保持：

```text
A, B, C, D, E, F, G
```

sticky offset：

```text
B stickyStart = 0
D stickyStart = 120

G stickyEnd = 0
E stickyEnd = 140
```

## 不推荐的设计

### 不推荐在 columns 配置暴露 false

外部 `columns` 配置中：

```ts
fixed?: 'start' | 'end' | false;
```

表达能力更强，但会让配置层同时承担“缺省不固定”和“明确取消继承”两个语义。

如果外部 `columns` 配置确实需要表达“明确取消继承”，再考虑开放 `false`。默认不在 `columns` 配置开放；内部状态和命令式 ref API 仍可使用 `false` 表示明确取消固定。

### 不推荐让父级 fixed 直接决定父级渲染

不应该：

```text
Parent ownFixed = start
children 全部 effectiveFixed = end
=> Parent renderFixed = start
```

这样 header 和 body 会错位。

父级实际渲染必须跟随子级聚合结果。

### 不推荐子级反向修改父级 ownFixed

不应该因为某个子级固定，就自动给父级写入 fixed。

子级对父级的影响应该是派生展示状态，不是反向写配置。

### 不推荐混合传统 pinning 和局部 sticky

传统 pinning 会重排列：

```text
[start] [normal] [end]
```

局部 sticky 不重排列：

```text
保持原始顺序，只计算 sticky offset
```

两种语义混在同一个 `fixed` 字段里会导致布局预期不清晰。当前设计选择局部 sticky 作为 `fixed` 的唯一语义。

## 修改检查清单

调整 fixed 逻辑时至少确认：

- 外部 `columns` 配置中的 `Column.fixed` 只支持 `'start' | 'end' | undefined`。
- 内部状态区分 `undefined` 和 `false`。
- `undefined` 表示允许继承，`false` 表示明确取消固定。
- 可见叶子列的 `effectiveFixed` 是布局事实来源。
- 父级 `ownFixed` 只作为默认值或批量操作入口。
- 父级 `renderFixed` 由可见叶子列聚合得到。
- 冲突时子级 `effectiveFixed` 优先。
- 不根据第一个子级 fixed 反向设置父级 fixed。
- 同级列不互相修改 fixed 状态。
- gapped fixed columns 不被重排。
- start offset 只累计前面的 start fixed 可见叶子列。
- end offset 只累计后面的 end fixed 可见叶子列。
- mixed group 不作为整体 sticky 渲染。
- header 和 body 的 fixed 结果必须对齐。
