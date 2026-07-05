import { Button, Segmented, Space, Switch } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnsType, SizeType } from 'rc-grid-table/es/table/interface';
import React, { useEffect, useState } from 'react';

import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  owner: string;
  status: string;
  updatedAt: string;
}

const columns: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Owner',
    dataIndex: 'owner',
    key: 'owner',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: 'Updated At',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
  },
];

const dataSource: DataType[] = [
  {
    key: 1,
    name: 'Customer Profile',
    owner: 'John Brown',
    status: 'Active',
    updatedAt: '2026-07-01',
  },
  {
    key: 2,
    name: 'Billing Workspace',
    owner: 'Jim Green',
    status: 'Pending',
    updatedAt: '2026-07-02',
  },
  {
    key: 3,
    name: 'Analytics Board',
    owner: 'Joe Black',
    status: 'Active',
    updatedAt: '2026-07-03',
  },
  {
    key: 4,
    name: 'Access Console',
    owner: 'Jane Stone',
    status: 'Review',
    updatedAt: '2026-07-04',
  },
];

const App: React.FC = () => {
  const [key, setKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<SizeType>('large');
  const [showFilterRow, setShowFilterRow] = useState(false);

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [key]);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />
      <Space>
        <Button
          type="primary"
          onClick={() => {
            setReady(false);
            setKey((prevKey) => prevKey + 1);
          }}
        >
          Reload
        </Button>

        <Segmented<SizeType>
          options={['small', 'middle', 'large']}
          value={size}
          onChange={setSize}
        />

        <Switch
          checked={showFilterRow}
          checkedChildren="show filterRow"
          unCheckedChildren="hide filterRow"
          onChange={setShowFilterRow}
        />
      </Space>
      <Table
        {...baseProps}
        key={key}
        ready={ready}
        readySkeleton={showFilterRow ? { filterRow: true } : true}
        size={size}
        columns={columns}
        dataSource={dataSource}
      />
    </Space>
  );
};

export default App;
