---
nav:
  title: 指南
  order: 1
title: 快速开始
description: 安装并使用 rc-grid-table React 表格组件，快速开启固定列、列拖拽、列宽调整、列显隐和虚拟列表等功能。
---

# 快速开始

## 安装

```bash
npm install rc-grid-table
```

or

```bash
yarn add rc-grid-table
```

## 使用

```tsx | pure
import { Table } from 'rc-grid-table';

export default () => (
  <Table
    columns={[]}
    dataSource={[]}
    resizableColumns
    sortableColumns
    visibleColumns
    fixableColumns
  />
);
```

## Table 组件特性

- 流畅的列拖拽排序、拖拽调整列宽、列显隐控制、固定列控制功能(支持表头分组，表头列合并)
- 列配置数据持久化存储(列排序、列宽、列显隐、控制固定列)
- 树结构渲染、嵌套表格、选择列和可编辑单元格
- tbody 的行拖拽排序
- 虚拟列表
- 高级筛选行(支持表头分组，列合并)

## 问题反馈

如果在使用过程中发现任何问题、或者有改善建议，欢迎在 GitHub Issues 进行反馈：https://github.com/helloworldzjx/rc-grid-table/issues
