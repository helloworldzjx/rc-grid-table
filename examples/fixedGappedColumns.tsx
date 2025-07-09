import React from 'react';
import { Space, Tag } from 'antd';
import { Table } from 'rc-grid-table';
import type { TableProps } from 'rc-grid-table/es/table/interface';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}

const App: React.FC = () => {
  // 列数组
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Full Name',
      width: 100,
      dataIndex: 'name',
      fixed: 'start',
    },
    {
      title: 'Age',
      width: 100,
      dataIndex: 'age',
    },
    { title: 'Column 1', dataIndex: 'address', key: '1', fixed: 'start' },
    { title: 'Column 2', dataIndex: 'address', key: '2' },
    { title: 'Column 3', dataIndex: 'address', key: '3' },
    { title: 'Column 4', dataIndex: 'address', key: '4' },
    { title: 'Column 5', dataIndex: 'address', key: '5' },
    { title: 'Column 6', dataIndex: 'address', key: '6' },
    { title: 'Column 7', dataIndex: 'address', key: '7' },
    { title: 'Column 8', dataIndex: 'address', key: '8' },
    { title: 'Column 9', dataIndex: 'address', key: '9' },
    { title: 'Column 10', dataIndex: 'address', key: '10' },
    { title: 'Column 11', dataIndex: 'address', key: '11' },
    { title: 'Column 12', dataIndex: 'address', key: '12' },
    { title: 'Column 13', dataIndex: 'address', key: '13' },
    { title: 'Column 14', dataIndex: 'address', key: '14' },
    { title: 'Column 15', dataIndex: 'address', key: '15' },
    { title: 'Column 16', dataIndex: 'address', key: '16' },
    { title: 'Column 17', dataIndex: 'address', key: '17' },
    { title: 'Column 18', dataIndex: 'address', key: '18' },
    { title: 'Column 19', dataIndex: 'address', key: '19' },
    { title: 'Column 20', dataIndex: 'address', key: '20' },
    {
      title: 'Action 1',
      key: 'Action 1',
      fixed: 'end',
      width: 90,
      render: () => <a>action</a>,
    },
    {
      title: 'Action 2',
      key: 'Action 2',
      width: 90,
      render: () => <a>action</a>,
    },
    {
      title: 'Action 3',
      key: 'Action 3',
      fixed: 'end',
      width: 90,
      render: () => <a>action</a>,
    },
  ];

  // 数据源
  const data: DataType[] = [
    { key: '1', name: 'Olivia', age: 32, address: 'New York Park' },
    { key: '2', name: 'Ethan', age: 40, address: 'London Park' },
  ];

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({bordered: true})

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Table {...baseProps} columns={columns} dataSource={data} />
    </>
  )
};

export default App;