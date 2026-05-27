import { Space, Switch, Tag } from 'antd';
import { Table } from 'rc-grid-table';
import type { TableProps } from 'rc-grid-table/es/table/interface';
import React, { useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  role: string;
  department: string;
  status: string;
  children?: DataType[];
}

const App: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([
    '1',
    '1-1',
    '1-1-1',
    '1-2',
  ]);
  const [checkStrictly, setCheckStrictly] = useState(false);

  // 列数组
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'gold'}>{status}</Tag>
      ),
    },
  ];

  // 数据源
  const data: DataType[] = [
    {
      key: '1',
      name: 'Operations Center',
      role: 'Department',
      department: 'Operations',
      status: 'Active',
      children: [
        {
          key: '1-1',
          name: 'John Brown',
          role: 'Team Lead',
          department: 'Operations',
          status: 'Active',
          children: [
            {
              key: '1-1-1',
              name: 'Lucy Green',
              role: 'Coordinator',
              department: 'Operations',
              status: 'Pending',
            },
          ],
        },
        {
          key: '1-2',
          name: 'Jim Green',
          role: 'Specialist',
          department: 'Operations',
          status: 'Active',
        },
      ],
    },
    {
      key: '2',
      name: 'Product Center',
      role: 'Department',
      department: 'Product',
      status: 'Active',
      children: [
        {
          key: '2-1',
          name: 'Joe Black',
          role: 'Product Manager',
          department: 'Product',
          status: 'Pending',
        },
        {
          key: '2-2',
          name: 'Lily White',
          role: 'Designer',
          department: 'Product',
          status: 'Active',
        },
      ],
    },
  ];

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ width: '100%' }}>
          <span>checkStrictly</span>
          <Switch checked={checkStrictly} onChange={setCheckStrictly} />
        </Space>
        <Table
          {...baseProps}
          columns={columns}
          dataSource={data}
          rowSelection={{
            selectedRowKeys,
            checkStrictly,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          expandable={{
            defaultExpandedRowKeys: ['1', '1-1'],
            indentSize: 24,
          }}
        />
      </Space>
    </>
  );
};

export default App;
