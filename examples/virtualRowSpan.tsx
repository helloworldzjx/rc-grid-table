import { Button, Flex, Space, Switch, Tag, Typography } from 'antd';
import { Table, TableRef } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useRef, useState } from 'react';
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

const groupSize = 5;

const App: React.FC = () => {
  const tableRef = useRef<TableRef>(null);
  const [expandable, setExpandable] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'Group',
      dataIndex: 'group',
      fixed: 'start',
      width: 140,
      onCell: (_, rowIndex) => {
        if (expandable) {
          return {};
        }

        if (rowIndex % groupSize === 0) {
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

  const [dataSource] = useState(() =>
    Array.from({ length: 10000 }).map<DataType>((_, index) => ({
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
  );

  const { baseProps, state, onChange } = useConfigActions({
    bordered: true,
    stripe: true,
  });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Space style={{ marginBottom: 12 }}>
        <Flex align="center" gap={6}>
          <Switch checked={expandable} onChange={setExpandable} />
          <Typography.Text>expandable</Typography.Text>
        </Flex>
        <Button onClick={() => tableRef.current?.scrollToTop()}>
          Scroll top
        </Button>
        <Button
          onClick={() =>
            tableRef.current?.scrollTo({ rowIndex: 1499, align: 'top' })
          }
        >
          Scroll into group
        </Button>
        <Button
          onClick={() =>
            tableRef.current?.scrollTo({ key: '9999', align: 'bottom' })
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
        rowSelection={
          expandable
            ? undefined
            : {
                columnOverlayTitle: '选择列',
                fixed: 'start',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }
        }
        expandable={
          expandable
            ? {
                columnOverlayTitle: '展开列',
                fixed: 'start',
                expandedRowRender: (record) => record.note,
                rowExpandable: (record) => Number(record.key) % 12 === 0,
              }
            : undefined
        }
      />
    </>
  );
};

export default App;
