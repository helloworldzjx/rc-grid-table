import { Button, Space, Tag } from 'antd';
import { Table, TableRef } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useMemo, useRef } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: string;
  group: string;
  name: string;
  age: number;
  status: 'Active' | 'Pending' | 'Disabled';
  address: string;
  note: string;
}

const groupSize = 6;

const App: React.FC = () => {
  const tableRef = useRef<TableRef>(null);
  const columns: ColumnsType<DataType> = [
    {
      title: 'Group',
      dataIndex: 'group',
      fixed: 'start',
      width: 140,
      onCell: (_, index = 0) => {
        if (index % groupSize === 0) {
          return { rowSpan: groupSize };
        }
        return { rowSpan: 0 };
      },
    },
    {
      title: 'Name',
      dataIndex: 'name',
      width: 160,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      width: 100,
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
      title: 'Dynamic note',
      dataIndex: 'note',
      width: 420,
    },
    {
      title: 'Action',
      fixed: 'end',
      key: 'action',
      width: 120,
      render: (_, record) => <a>Open {record.name}</a>,
    },
  ];

  const data = useMemo<DataType[]>(
    () =>
      Array.from({ length: 3000 }).map((_, index) => ({
        key: `${index}`,
        group: `Group ${Math.floor(index / groupSize)}`,
        name: `User ${index}`,
        age: 20 + (index % 30),
        status: ['Active', 'Pending', 'Disabled'][
          index % 3
        ] as DataType['status'],
        address: `No. ${index} Lake Park, Dublin`,
        note:
          index % 8 === 0
            ? 'This row intentionally has a longer paragraph so row height measurement changes while rowSpan cells keep their visual height across the grouped rows.'
            : 'Compact row.',
      })),
    [],
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
            tableRef.current?.scrollTo({ index: 1499, align: 'top' })
          }
        >
          Scroll into group
        </Button>
        <Button
          onClick={() =>
            tableRef.current?.scrollTo({ key: '2999', align: 'bottom' })
          }
        >
          Scroll bottom
        </Button>
      </Space>
      <Table
        {...baseProps}
        ref={tableRef}
        columns={columns}
        dataSource={data}
        scrollY={420}
        sticky={{ offsetHeader: 76 }}
        expandable={{
          fixed: 'start',
          expandedRowRender: (record) => record.note,
          rowExpandable: (record) => Number(record.key) % 12 === 0,
        }}
        summary={(pageData) => [
          [
            { children: null },
            { children: 'Total rows' },
            { children: pageData.length },
            {
              colSpan: columns.length - 2,
              children: 'Virtual rowSpan is rendered with an overlay layer.',
            },
          ],
        ]}
      />
    </>
  );
};

export default App;
