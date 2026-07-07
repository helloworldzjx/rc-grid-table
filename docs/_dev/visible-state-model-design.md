# 树结构 visible 状态模型设计

## 目的

这份文档记录树形结构中 `visible` 状态模型的设计语义。

`visible` 不是一个单纯的 DOM 显示开关，也不应该只被理解成 `hidden` 的反向字段。它更适合作为一个状态模型，用来描述节点在当前业务状态、用户配置、权限规则或持久化设置下是否允许进入最终输出树。

## 结论

推荐将 `visible` 定义为可选 boolean 状态：

```ts
type TreeNode = {
  visible?: boolean;
  children?: TreeNode[];
};
```

字段语义：

- `visible: false`：当前节点以及其子树不进入输出树。
- `visible: true`：当前节点自身允许进入输出树。
- `visible` 未设置：当前节点默认允许进入输出树。

一句话概括：

```text
visible: false 向下级联；visible: true 不反向级联。
```

也就是说，`visible: true` 只能表达“当前节点自身允许显示”，不能强制覆盖祖先的 `visible: false`，也不能强制保留一个过滤后没有子节点的空分支。

## 状态模型语义

`visible` 更适合放在状态层，而不是原始结构层。

例如：

```ts
type ColumnState = {
  key: string;
  visible?: boolean;
};
```

状态层负责回答：

```text
这个节点在当前状态下是否被允许显示？
```

渲染层负责回答：

```text
这个节点在经过祖先状态、子节点状态和空分支规则计算后，是否应该进入最终输出树？
```

这两个问题不应该混在一个字段里。`visible: true` 表示状态上允许显示，但最终是否输出仍然需要结合树结构一起计算。

## 输出规则

计算最终输出树时，一个节点进入输出树需要同时满足：

- 所有祖先节点都没有 `visible: false`。
- 当前节点没有 `visible: false`。
- 如果当前节点是分支节点，过滤后仍然存在可输出子节点。

可以用下面的规则表达：

```ts
allowedBySelf = node.visible !== false;
allowedByAncestors = ancestorVisible !== false;
kept =
  allowedBySelf && allowedByAncestors && (isLeafNode || children.length > 0);
```

这里的 `isLeafNode` 需要由具体结构定义。通常可以约定：没有声明 `children` 的节点是叶子节点；声明了 `children` 的节点是分支节点。

分支节点依赖子节点存在。一个分支节点即使 `visible: true`，如果过滤后没有任何可输出子节点，也应该从输出树中移除。

## 标准计算算法

```ts
function filterVisibleTree<T extends { visible?: boolean; children?: T[] }>(
  nodes: T[],
  ancestorVisible = true,
): T[] {
  return nodes.reduce<T[]>((result, node) => {
    const visibleBySelfAndAncestor = ancestorVisible && node.visible !== false;

    if (!visibleBySelfAndAncestor) {
      return result;
    }

    const isBranchNode = Array.isArray(node.children);
    const children = isBranchNode
      ? filterVisibleTree(node.children || [], visibleBySelfAndAncestor)
      : [];

    if (isBranchNode && children.length === 0) {
      return result;
    }

    result.push({
      ...node,
      ...(isBranchNode ? { children } : {}),
    });

    return result;
  }, []);
}
```

这个算法有三个关键点：

- 父节点 `visible: false` 时，子孙节点不再参与输出。
- 子节点 `visible: true` 不能覆盖祖先节点的 `visible: false`。
- 父节点 `visible: true` 不能强制保留一个没有可输出子节点的空分支。

## 状态来源

实际系统中，`visible` 往往不是单一来源，而是多个状态合并后的结果。

常见来源包括：

- 默认配置：节点默认是否可见。
- 用户配置：用户手动显示或隐藏某个节点。
- 权限规则：当前用户是否有权限看到某个节点。
- 业务条件：当前页面、模式、数据状态是否允许显示某个节点。
- 持久化状态：上一次保存的列显示状态、菜单状态或面板状态。

建议先把多来源状态合并成一个标准化状态，再进入树过滤阶段。

```ts
type VisibilityState = Record<string, boolean>;
```

示例：

```ts
const visibilityState: VisibilityState = {
  name: true,
  age: false,
};
```

树节点本身可以不直接携带 `visible`，而是在过滤前根据 `key` 注入或查询状态：

```ts
const visible = visibilityState[node.key] ?? node.visible ?? true;
```

这样可以把结构定义和运行时状态分开，避免状态污染原始树。

## 合并优先级

当 `visible` 来自多个地方时，必须明确优先级。

一种常见顺序是：

```text
权限规则 > 业务强制规则 > 用户配置 > 默认配置
```

例如：

- 权限不允许时，用户配置 `visible: true` 也不能显示。
- 业务强制隐藏时，默认配置 `visible: true` 也不能显示。
- 没有权限和业务限制时，用户配置可以覆盖默认配置。

可以用派生状态表达最终结果：

```ts
finalVisible =
  permissionVisible !== false &&
  businessVisible !== false &&
  (userVisible ?? defaultVisible ?? true);
```

这里的 `finalVisible` 仍然只是当前节点的状态。最终是否进入输出树，还需要继续经过祖先和子节点规则计算。

## 典型场景

### 父节点显式不可见

输入：

```ts
[
  {
    key: 'group',
    visible: false,
    children: [{ key: 'name', visible: true }, { key: 'age' }],
  },
];
```

输出：

```ts
[];
```

原因：父节点 `visible: false` 会移除整棵子树，子节点的 `visible: true` 不能反向覆盖祖先状态。

### 父节点可见但所有子节点不可见

输入：

```ts
[
  {
    key: 'group',
    visible: true,
    children: [
      { key: 'name', visible: false },
      { key: 'age', visible: false },
    ],
  },
];
```

输出：

```ts
[];
```

原因：父节点 `visible: true` 只表示父节点自身允许显示。所有子节点过滤后，父节点没有可输出子节点，因此也被移除。

### 第三层全部不可见

输入：

```ts
[
  {
    key: 'root',
    visible: true,
    children: [
      {
        key: 'group',
        visible: true,
        children: [
          { key: 'name', visible: false },
          { key: 'age', visible: false },
        ],
      },
    ],
  },
];
```

输出：

```ts
[];
```

原因：

- 第三层两个叶子都被移除。
- 第二层节点过滤后没有子节点，因此被移除。
- 第一层节点也因此没有子节点，因此被移除。

### 未设置 visible

输入：

```ts
[
  {
    key: 'group',
    children: [{ key: 'name' }, { key: 'age', visible: false }],
  },
];
```

输出：

```ts
[
  {
    key: 'group',
    children: [{ key: 'name' }],
  },
];
```

原因：未设置 `visible` 等价于默认允许显示；`age` 显式不可见，因此被移除。

## 不推荐的语义

### 不推荐让 visible: true 强制保留

如果把 `visible: true` 设计成强制保留，会产生几个问题：

- 子节点很难表达自己仍然不可见。
- 祖先不可见和子孙强制可见会形成冲突。
- 空分支会因为父节点 `visible: true` 被保留下来，导致输出树出现没有实际内容的容器节点。

boolean 字段表达能力有限，最好保持单向语义：

```text
false 表示显式不可见。
true / undefined 表示允许显示，但不保证最终输出。
```

### 不推荐把结构和状态强绑定

如果节点结构直接长期保存运行时 `visible` 状态，可能会导致：

- 用户状态污染默认配置。
- 权限状态和用户状态混在一起，难以判断来源。
- 持久化时无法区分默认值、用户显式值和系统强制值。

更推荐的模型是：

```ts
type TreeNode = {
  key: string;
  children?: TreeNode[];
};

type VisibilityState = Record<string, boolean>;
```

过滤时再把结构和状态合并。

## 与 hidden 的关系

`visible` 和 `hidden` 可以表达相近的最终效果，但它们适合的位置不同。

`hidden?: boolean` 更像结构配置字段：

```text
这个节点是否声明为隐藏？
```

`visible?: boolean` 更像状态字段：

```text
这个节点在当前状态下是否允许显示？
```

如果只是静态配置少数隐藏项，`hidden` 通常更自然。

如果要表达用户控制、权限结果、持久化状态或运行时状态，`visible` 通常更自然。

不要同时在同一个层级无约束地混用 `hidden` 和 `visible`。如果确实需要同时存在，必须先定义清晰的派生规则：

```ts
finalVisible = hidden === true ? false : visible ?? true;
```

然后后续过滤逻辑只使用 `finalVisible`。

## 修改检查清单

设计或调整 `visible` 状态模型时至少确认：

- `visible: false` 的节点及其子树都会被移除。
- 子节点 `visible: true` 不能覆盖祖先节点 `visible: false`。
- 父节点 `visible: true` 不能强制保留所有子节点都不可见后的空分支。
- 未设置 `visible` 时默认允许显示。
- 多来源状态合并时有明确优先级。
- 结构定义和运行时状态尽量分离。
- 原始树不被修改。
- 输出树只包含经过状态计算后仍然成立的节点。
