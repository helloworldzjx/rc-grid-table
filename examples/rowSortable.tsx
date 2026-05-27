import { Space, Switch, Tag } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'Pending' | 'Locked';
  children?: DataType[];
}

const initialData: DataType[] = [
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
        status: 'Locked',
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
  {
    key: '3',
    name: 'Sales Center',
    role: 'Department',
    department: 'Operations',
    status: 'Active',
  },
];

const App: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>(initialData);
  const [allowCrossLevelSort, setAllowCrossLevelSort] = useState(false);

  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
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
        <Tag
          color={
            status === 'Active'
              ? 'green'
              : status === 'Pending'
              ? 'gold'
              : 'default'
          }
        >
          {status}
        </Tag>
      ),
    },
  ];

  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ width: '100%' }}>
          <span>allowCrossLevelSort</span>
          <Switch
            checked={allowCrossLevelSort}
            onChange={setAllowCrossLevelSort}
          />
        </Space>
        <Table
          {...baseProps}
          columns={columns}
          dataSource={dataSource}
          rowSortable={{
            fixed: 'start',
            allowCrossLevelSort,
            rowDraggable: (record) => record.status !== 'Locked',
            onChange: setDataSource,
          }}
          expandable={{
            defaultExpandedRowKeys: ['1', '1-1', '2'],
            indentSize: 24,
          }}
        />

        <Table
          {...baseProps}
          columns={columns}
          dataSource={dataSource}
          rowSortable={{
            fixed: 'start',
            allowCrossLevelSort,
            rowDraggable: (record) => record.status !== 'Locked',
            onChange: setDataSource,
          }}
          expandable={{
            indentSize: 24,
            expandedRowRender(_, index) {
              return index;
            },
          }}
        />
      </Space>
    </>
  );
};

export default App;
