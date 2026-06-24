import { Badge, Space, Tag, Typography } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

const { Link } = Typography;

interface ExpandedDataType {
  key: React.Key;
  date: string;
  name: string;
  upgradeNum: string;
}

interface DataType {
  key: React.Key;
  name: string;
  platform: string;
  version: string;
  versionLabel: 'release' | 'alpha';
  upgradeNum: number;
  creator: string;
  createdAt: string;
}

const expandDataSource = Array.from({ length: 3 }).map<ExpandedDataType>(
  (_, i) => ({
    key: i.toString(),
    date: '2014-12-24 23:12:00',
    name: 'This is production name',
    upgradeNum: 'Upgraded: 56',
  }),
);

const dataSource = Array.from({ length: 5 }).map<DataType>((_, i) => ({
  key: i.toString(),
  name: 'Screen',
  platform: 'iOS',
  version: '10.3.4.5654',
  versionLabel: (i + 1) % 2 === 0 ? 'alpha' : 'release',
  upgradeNum: 500,
  creator: 'Jack',
  createdAt: '2014-12-24 23:12:00',
}));

const expandColumns: ColumnsType<ExpandedDataType> = [
  { title: 'Date', dataIndex: 'date', key: 'date' },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Status',
    key: 'state',
    render: () => <Badge status="success" text="Finished" />,
  },
  { title: 'Upgrade Status', dataIndex: 'upgradeNum', key: 'upgradeNum' },
  {
    title: 'Action',
    key: 'operation',
    render: () => (
      <Space size="middle">
        <Link>Pause</Link>
        <Link>Stop</Link>
      </Space>
    ),
  },
];

const columns: ColumnsType<DataType> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Platform', dataIndex: 'platform', key: 'platform' },
  {
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
    width: 110,
  },
  {
    title: 'Version Label',
    dataIndex: 'versionLabel',
    width: 130,
    render: (value: DataType['versionLabel']) => (
      <Tag color={value === 'release' ? 'blue' : 'pink'}>{value}</Tag>
    ),
  },
  { title: 'Upgraded', dataIndex: 'upgradeNum', key: 'upgradeNum' },
  { title: 'Creator', dataIndex: 'creator', key: 'creator' },
  { title: 'Date', dataIndex: 'createdAt', key: 'createdAt' },
  {
    title: 'Action',
    key: 'operation',
    render: (_, record) => (
      <Link disabled={record.versionLabel === 'release'}>Publish</Link>
    ),
  },
];

const App: React.FC = () => {
  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  const expandedRowRender = () => (
    <Table<ExpandedDataType>
      {...baseProps}
      columns={expandColumns}
      dataSource={expandDataSource}
    />
  );

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Table
        {...baseProps}
        columns={columns}
        dataSource={dataSource}
        expandable={{
          columnOverlayTitle: '展开列',
          defaultExpandedRowKeys: ['0'],
          fixed: 'start',
          expandedRowRender,
          rowExpandable: (record) => record.versionLabel === 'release',
        }}
      />
    </>
  );
};

export default App;
