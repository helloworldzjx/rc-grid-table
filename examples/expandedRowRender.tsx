import { Descriptions, Space, Tag, Typography } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

const { Text } = Typography;

interface DataType {
  key: React.Key;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'Pending' | 'Disabled';
  owner: string;
  description?: string;
}

const App: React.FC = () => {
  // 列数组
  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 160,
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
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a>Invite {record.owner}</a>
          <a>Archive</a>
        </Space>
      ),
    },
  ];

  // 数据源
  const data: DataType[] = [
    {
      key: '1',
      name: 'John Brown',
      role: 'Team Lead',
      department: 'Operations',
      status: 'Active',
      owner: 'Lucy',
      description:
        'Responsible for daily scheduling and cross-team delivery checks.',
    },
    {
      key: '2',
      name: 'Jim Green',
      role: 'Specialist',
      department: 'Support',
      status: 'Pending',
      owner: 'Lily',
      description:
        'Preparing onboarding materials for the new support process.',
    },
    {
      key: '3',
      name: 'Joe Black',
      role: 'Contractor',
      department: 'Finance',
      status: 'Disabled',
      owner: 'Tom',
    },
  ];

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Table
        {...baseProps}
        columns={columns}
        dataSource={data}
        expandable={{
          defaultExpandedRowKeys: ['1'],
          fixed: 'start',
          expandedRowRender: (record) => (
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Owner">
                {record.owner}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {record.department}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                <Text type={record.description ? undefined : 'secondary'}>
                  {record.description || 'No extra information.'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          ),
          rowExpandable: (record) => !!record.description,
        }}
      />
    </>
  );
};

export default App;
