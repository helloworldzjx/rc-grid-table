# rc-grid-table

[![npm version](https://img.shields.io/npm/v/rc-grid-table.svg)](https://www.npmjs.com/package/rc-grid-table)
[![npm downloads](https://img.shields.io/npm/dm/rc-grid-table.svg)](https://www.npmjs.com/package/rc-grid-table)
[![license](https://img.shields.io/npm/l/rc-grid-table.svg)](./LICENSE)

一个基于 CSS Grid 的 React Table / React Data Grid 组件，支持固定列、虚拟列表、列拖拽排序、拖拽调整列宽、树形数据、可编辑单元格与 TypeScript 类型提示。适合构建后台管理、数据表格、复杂业务表格和高性能数据列表。

rc-grid-table is a high-performance React grid table component for data table scenarios, including fixed columns, virtual scrolling, drag sorting, resizable columns, tree data and editable cells.

## 文档

- 使用指南: [https://helloworldzjx.github.io/rc-grid-table/guide](https://helloworldzjx.github.io/rc-grid-table/guide)
- 组件示例: [https://helloworldzjx.github.io/rc-grid-table/components](https://helloworldzjx.github.io/rc-grid-table/components)
- API 文档: [https://helloworldzjx.github.io/rc-grid-table/api](https://helloworldzjx.github.io/rc-grid-table/api)

## 关键词

React Table、React Data Grid、Grid Table、data table、fixed columns、virtual table、resizable columns、drag sort table、editable table、tree table。

## 安装

```bash
npm install rc-grid-table
```

or

```bash
yarn add rc-grid-table
```

## 特性

- 流畅的列拖拽排序、拖拽调整列宽、列显隐控制、固定列控制功能(支持表头分组，表头列合并)
- 列配置数据持久化存储(列排序、列宽、列显隐、控制固定列)
- 树结构渲染
- 嵌套表格
- 选择列
- 可编辑单元格
- tbody 的行拖拽排序
- 虚拟列表
- 高级筛选行(支持表头分组，列合并)

## 基础用法

```tsx
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

## 即将到来的特性

- 列内容 text-align 控制(支持表头分组，表头列合并)
