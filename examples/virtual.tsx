import { Button, Space, Tag } from 'antd';
import { Table, TableRef } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useRef, useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: string;
  name: string;
  age: number;
  department: string;
  status: 'Active' | 'Pending' | 'Disabled';
  address: string;
  note: string;
}

const App: React.FC = () => {
  const tableRef = useRef<TableRef>(null);
  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      fixed: 'start',
      width: 160,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      width: 100,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      width: 160,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
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
      title: 'Address',
      dataIndex: 'address',
      width: 260,
    },
    {
      title: 'Dynamic height note',
      dataIndex: 'note',
      width: 360,
    },
    {
      title: 'Action',
      fixed: 'end',
      key: 'action',
      width: 120,
      render: (_, record) => <a>Invite {record.name}</a>,
    },
  ];

  const [dataSource, setDataSource] = useState(() =>
    Array.from({ length: 5000 }).map<DataType>((_, index) => ({
      key: `${index}`,
      name: `User ${index}`,
      age: 20 + (index % 30),
      department: ['Operations', 'Support', 'Finance', 'Product'][index % 4],
      status: ['Active', 'Pending', 'Disabled'][
        index % 3
      ] as DataType['status'],
      address: `No. ${index} Lake Park, Dublin`,
      note:
        index % 7 === 0
          ? 'This row has a longer paragraph so the virtual list can collect real height and keep the scrollbar size accurate while scrolling quickly.'
          : 'Compact row.',
    })),
  );

  const { baseProps, state, onChange } = useConfigActions({
    bordered: true,
    stripe: true,
  });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => tableRef.current?.scrollToTop()}>
          Scroll top
        </Button>
        <Button
          onClick={() =>
            tableRef.current?.scrollTo({ index: 2500, align: 'top' })
          }
        >
          Scroll to 2500
        </Button>
        <Button
          onClick={() =>
            tableRef.current?.scrollTo({ key: '4999', align: 'bottom' })
          }
        >
          Scroll bottom
        </Button>
      </Space>
      <Table
        {...baseProps}
        ref={tableRef}
        columns={columns}
        dataSource={dataSource}
        scrollY={420}
        sticky={{ offsetHeader: 76 }}
        rowSortable={{
          fixed: 'start',
          onChange: setDataSource,
        }}
        expandable={{
          fixed: 'start',
          expandedRowRender: (record) => record.note,
          rowExpandable: (record) => Number(record.key) % 11 === 0,
        }}
        summary={(pageData) => [
          [
            { children: null },
            { children: 'Total rows' },
            { children: pageData.length },
            {
              colSpan: columns.length - 2,
              children: 'Virtual list is enabled by default.',
            },
          ],
        ]}
      />
    </>
  );
};

export default App;
