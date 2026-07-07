# 树结构 hidden 过滤语义

## 目的

这份文档只记录树形结构中 `hidden?: boolean` 的过滤语义。

`hidden` 只负责回答一个问题：当前节点及其子树是否应从输出树中移除。

## 结论

`hidden` 作为 boolean 字段时，只表达当前节点自己的隐藏声明：

```ts
type TreeNode = {
  hidden?: boolean;
  children?: TreeNode[];
};
```

字段语义：

- `hidden: true`：移除当前节点及其整棵子树。
- `hidden: false`：当前节点不主动移除，但不能覆盖祖先的 `hidden: true`。
- `hidden` 未设置：等价于当前节点不主动移除。

一句话概括：

```text
hidden: true 向下级联；hidden: false 不反向级联。
```

## 过滤规则

过滤应先产生一棵新的输出树，原始树不应被修改。

一个节点进入输出树需要同时满足：

- 所有祖先都没有 `hidden: true`。
- 当前节点没有 `hidden: true`。
- 如果当前节点是分支节点，过滤后仍然有子节点。

可以用下面的规则表达：

```ts
keptBySelf = node.hidden !== true;
keptByAncestors = ancestorHidden !== true;
kept = keptByAncestors && keptBySelf && (isLeafNode || children.length > 0);
```

这里的 `isLeafNode` 需要按数据结构定义。通常可以约定：未声明 `children` 的节点是叶子节点；声明了 `children` 的节点是分支节点。

分支节点依赖子节点存在。过滤后没有子节点的分支节点，也应从输出树中移除。

## 标准过滤算法

```ts
function filterHiddenTree<T extends { hidden?: boolean; children?: T[] }>(
  nodes: T[],
  ancestorHidden = false,
): T[] {
  return nodes.reduce<T[]>((result, node) => {
    const hiddenBySelfOrAncestor = ancestorHidden || node.hidden === true;

    if (hiddenBySelfOrAncestor) {
      return result;
    }

    const isBranchNode = Array.isArray(node.children);
    const children = isBranchNode
      ? filterHiddenTree(node.children || [], hiddenBySelfOrAncestor)
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

- 父节点 `hidden: true` 时，子孙节点不再参与计算。
- 子节点 `hidden: false` 只能说明它自己不主动移除，不能覆盖祖先隐藏。
- 父节点 `hidden: false` 只能说明它自己不主动移除，不能强制保留一个没有子节点的空分支。

## 典型场景

### 顶层节点隐藏

输入：

```ts
[
  {
    key: 'group',
    hidden: true,
    children: [{ key: 'name', hidden: false }, { key: 'age' }],
  },
];
```

输出：

```ts
[];
```

原因：顶层节点 `hidden: true` 会移除整棵子树，子节点的 `hidden: false` 不能把自己重新带回输出树。

### 父节点未隐藏但所有子节点隐藏

输入：

```ts
[
  {
    key: 'group',
    hidden: false,
    children: [
      { key: 'name', hidden: true },
      { key: 'age', hidden: true },
    ],
  },
];
```

输出：

```ts
[];
```

原因：父节点 `hidden: false` 只表示父节点不主动移除。两个子节点都被过滤后，父节点已经没有子节点，因此也被移除。

### 第三层全部隐藏

输入：

```ts
[
  {
    key: 'root',
    children: [
      {
        key: 'group',
        hidden: false,
        children: [
          { key: 'name', hidden: true },
          { key: 'age', hidden: true },
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
- 第一层也因此没有子节点，因此被移除。

### 父节点隐藏，子节点未隐藏

输入：

```ts
[
  {
    key: 'group',
    hidden: true,
    children: [{ key: 'name', hidden: false }],
  },
];
```

输出：

```ts
[];
```

原因：父节点已经隐藏，子节点的 `hidden: false` 不能反向覆盖祖先隐藏。

## 不推荐的语义

### 不推荐让 hidden: false 强制保留

如果把 `hidden: false` 设计成“强制保留”，会产生两个问题：

- 子节点很难表达自己仍然要隐藏。
- 祖先隐藏和子孙强制保留会形成冲突，需要额外优先级规则。

boolean 字段表达能力有限，最好保持单向语义：

```text
true 表示显式隐藏。
false / undefined 表示不主动移除。
```

### 不推荐让空分支默认保留

对于纯容器节点，空分支通常没有语义价值，还会出现空壳节点。

如果确实需要保留空分支，应显式建模：

```ts
type TreeNode = {
  hidden?: boolean;
  keepWhenEmpty?: boolean;
  children?: TreeNode[];
};
```

不要让 `hidden: false` 同时承担“不隐藏自己”和“即使没有子节点也必须保留”两个含义。

## 修改检查清单

调整树过滤逻辑时至少确认：

- `hidden: true` 的节点及其子树都会被移除。
- 子节点 `hidden: false` 不能覆盖祖先 `hidden: true`。
- 父节点 `hidden: false` 不能强制保留所有子节点都被隐藏后的空分支。
- 过滤使用递归后的子节点结果，而不是只检查直接子节点的 `hidden` 字段。
- 原始树不被修改。
- 输出树只包含过滤后仍然成立的节点。
