import React from 'react';
import { Divider, Space, Tag } from 'antd';
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
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
    },
  ];

  // 数据源
  const data: DataType[] = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sydney No. 1 Lake Park',
    },
  ];

  // 动态控制 middle table 的 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps: mdBaseProps, state: mdState, onChange: mdOnChange } = useConfigActions()

  // 动态控制 small table 的 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps: smBaseProps, state: smState, onChange: smOnChange } = useConfigActions()


  return (
    <>
      <Divider>Middle size table</Divider>
      <ConfigActions value={mdState} onChange={mdOnChange} />
      <Table 
        {...mdBaseProps} 
        columns={columns} 
        dataSource={data} 
        size="middle" 
      />
      
      <Divider>Small size table</Divider>
      <ConfigActions value={smState} onChange={smOnChange} />
      <Table 
        {...smBaseProps} 
        columns={columns} 
        dataSource={data} 
        size="small" 
      />
    </>
  )
};

export default App;