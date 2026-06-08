---
title: 选择列
order: 16
---

## 使用方式

配置 `rowSelection` 后，表格会自动插入一列选择列。默认类型是多选 `checkbox`，设置 `type: 'radio'` 后切换为单选。

每一行都需要稳定且唯一的行 key，默认读取 `record.key`，也可以通过 `rowKey` 指定。选择状态通过行 key 记录，重复或缺失的行 key 会导致选中状态无法正确对应。

## 常用配置

- `selectedRowKeys`：受控选中的行 key。
- `getCheckboxProps(record)`：设置某一行多选框的 props，例如 `disabled`。
- `getRadioProps(record)`：设置某一行单选框的 props，例如 `disabled`。
- `checkStrictly`：树形数据下父子节点选择是否独立，默认为 `true`。
- `onChange(selectedRowKeys, selectedRows, info)`：选中状态变化回调。
- `onSelect(record, selected, selectedRows, nativeEvent)`：单行选择变化回调。

## 手动调整选择列位置

默认情况下，开启 `rowSelection` 后选择列会自动插入到最前面。如果需要手动修改选择列位置，可以在 `columns` 中放入 `Table.SELECTION_COLUMN` 作为占位。开启 `rowSelection` 后，表格会在该位置渲染真实选择列。

<code src="../../examples/rowSelection.tsx"></code>
