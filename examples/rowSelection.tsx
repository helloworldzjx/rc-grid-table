import React, { useState } from 'react';
import { Space, Tag } from 'antd';
import { Table } from 'rc-grid-table';
import type { TableProps } from 'rc-grid-table/es/table/interface';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'Pending' | 'Disabled';
  children?: DataType[];
}

const App: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(['1']);
  const [radioSelectedRowKeys, setRadioSelectedRowKeys] = useState<React.Key[]>(['2']);

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      fixed: 'start',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 160,
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
        <Tag color={status === 'Active' ? 'green' : status === 'Pending' ? 'gold' : 'default'}>
          {status}
        </Tag>
      ),
    },
  ];

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
        },
        {
          key: '1-2',
          name: 'Jim Green',
          role: 'Specialist',
          department: 'Operations',
          status: 'Disabled',
        },
      ],
    },
    {
      key: '2',
      name: 'Product Center',
      role: 'Department',
      department: 'Product',
      status: 'Pending',
    },
  ];

  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Table
          {...baseProps}
          columns={columns}
          dataSource={data}
          rowSelection={{
            selectedRowKeys,
            checkStrictly: false,
            fixed: 'start',
            getCheckboxProps: (record) => ({
              disabled: record.status === 'Disabled',
              title: record.status === 'Disabled' ? 'Disabled record' : undefined,
            }),
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          expandable={{
            fixed: 'start',
            defaultExpandedRowKeys: ['1'],
            expandedRowRender: (record) => `${record.name} details`,
          }}
        />
        <Table
          {...baseProps}
          columns={columns}
          dataSource={data}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: radioSelectedRowKeys,
            onChange: (keys) => setRadioSelectedRowKeys(keys),
          }}
        />
      </Space>
    </>
  );
};

export default App;
