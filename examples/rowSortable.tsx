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
  owner: string;
  location: string;
  priority: string;
  budget: string;
  updatedAt: string;
  children?: DataType[];
}

const initialData: DataType[] = [
  {
    key: '1',
    name: 'Operations Center',
    role: 'Department',
    department: 'Operations',
    status: 'Active',
    owner: 'Olivia',
    location: 'New York',
    priority: 'High',
    budget: '$12,000',
    updatedAt: '2026-01-18',
    children: [
      {
        key: '1-1',
        name: 'John Brown',
        role: 'Team Lead',
        department: 'Operations',
        status: 'Active',
        owner: 'John Brown',
        location: 'New York',
        priority: 'High',
        budget: '$4,200',
        updatedAt: '2026-01-20',
        children: [
          {
            key: '1-1-1',
            name: 'Lucy Green',
            role: 'Coordinator',
            department: 'Operations',
            status: 'Pending',
            owner: 'Lucy Green',
            location: 'Boston',
            priority: 'Medium',
            budget: '$1,800',
            updatedAt: '2026-01-22',
          },
        ],
      },
      {
        key: '1-2',
        name: 'Jim Green',
        role: 'Specialist',
        department: 'Operations',
        status: 'Locked',
        owner: 'Jim Green',
        location: 'Chicago',
        priority: 'Low',
        budget: '$2,400',
        updatedAt: '2026-01-16',
      },
    ],
  },
  {
    key: '2',
    name: 'Product Center',
    role: 'Department',
    department: 'Product',
    status: 'Active',
    owner: 'Ethan',
    location: 'London',
    priority: 'Medium',
    budget: '$18,500',
    updatedAt: '2026-02-03',
    children: [
      {
        key: '2-1',
        name: 'Joe Black',
        role: 'Product Manager',
        department: 'Product',
        status: 'Pending',
        owner: 'Joe Black',
        location: 'London',
        priority: 'High',
        budget: '$8,600',
        updatedAt: '2026-02-05',
      },
      {
        key: '2-2',
        name: 'Lily White',
        role: 'Designer',
        department: 'Product',
        status: 'Active',
        owner: 'Lily White',
        location: 'Paris',
        priority: 'Medium',
        budget: '$5,100',
        updatedAt: '2026-02-01',
      },
    ],
  },
  {
    key: '3',
    name: 'Sales Center',
    role: 'Department',
    department: 'Operations',
    status: 'Active',
    owner: 'Mia',
    location: 'San Francisco',
    priority: 'High',
    budget: '$9,300',
    updatedAt: '2026-02-12',
  },
  {
    key: '4',
    name: 'Advertising Department',
    role: 'Department',
    department: 'Advertising',
    status: 'Active',
    owner: 'Noah',
    location: 'Berlin',
    priority: 'Low',
    budget: '$7,700',
    updatedAt: '2026-02-08',
  },
  {
    key: '5',
    name: 'Human Resources Department',
    role: 'Department',
    department: 'Human Resources',
    status: 'Active',
    owner: 'Ava',
    location: 'Singapore',
    priority: 'Medium',
    budget: '$6,200',
    updatedAt: '2026-02-15',
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
      width: 160,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
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
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 140,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 160,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 140,
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'end',
      render: () => <a>Delete</a>,
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
            columnOverlayTitle: '拖拽列',
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
            columnOverlayTitle: '拖拽列',
            fixed: 'start',
            allowCrossLevelSort,
            rowDraggable: (record) => record.status !== 'Locked',
            onChange: setDataSource,
          }}
          expandable={{
            columnOverlayTitle: '选择列',
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
