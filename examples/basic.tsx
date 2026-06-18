import { useSize } from 'ahooks';
import { Space, Tag } from 'antd';
import { Table, TableRef } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useEffect, useRef } from 'react';

import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const App: React.FC = () => {
  // 列数组
  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Tags',
      key: 'tags',
      dataIndex: 'tags',
      render: (_, { tags }) => (
        <>
          {tags.map((tag) => {
            let color = tag.length > 5 ? 'geekblue' : 'green';
            if (tag === 'loser') {
              color = 'volcano';
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a>Invite {record.name}</a>
          <a>Delete</a>
        </Space>
      ),
    },
  ];

  // 数据源
  const data: DataType[] = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
      tags: ['nice', 'developer'],
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
      tags: ['loser'],
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sydney No. 1 Lake Park',
      tags: ['cool', 'teacher'],
    },
  ];

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions();

  const tableRef = useRef<TableRef>(null);

  useSize(tableRef.current?.nativeElement);

  useEffect(() => {
    console.log(tableRef);
  }, []);

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Table
        {...baseProps}
        columns={columns}
        dataSource={data}
        ref={tableRef}
      />
    </>
  );
};

export default App;
