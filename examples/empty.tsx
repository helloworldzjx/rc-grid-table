import { Button, Divider, Empty } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React from 'react';

import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  owner: string;
  status: string;
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
];

const App: React.FC = () => {
  const { baseProps, state, onChange } = useConfigActions({
    bordered: true,
  });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />

      <Divider>Default empty state</Divider>
      <Table {...baseProps} columns={columns} dataSource={[]} />

      <Divider>Custom empty state</Divider>
      <Table
        {...baseProps}
        columns={columns}
        dataSource={[]}
        empty={{
          image: Empty.PRESENTED_IMAGE_DEFAULT,
          description: 'No projects yet',
          children: <Button type="primary">Create project</Button>,
        }}
      />
    </>
  );
};

export default App;
