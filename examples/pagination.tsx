import { Pagination, Space, Tag } from 'antd';
import { Table, TableRef } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useMemo, useRef, useState } from 'react';

import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

type Status = 'Backlog' | 'In progress' | 'Review' | 'Done';

interface DataType {
  key: React.Key;
  name: string;
  owner: string;
  status: Status;
  project: string;
  progress: string;
  dueDate: string;
  region: string;
}

const total = 225;

const statusColorMap: Record<Status, string> = {
  Backlog: 'default',
  'In progress': 'processing',
  Review: 'warning',
  Done: 'success',
};

const columns: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 160,
  },
  {
    title: 'Owner',
    dataIndex: 'owner',
    key: 'owner',
    width: 160,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 150,
    render: (status: Status) => (
      <Tag color={statusColorMap[status]}>{status}</Tag>
    ),
  },
  {
    title: 'Project',
    dataIndex: 'project',
    key: 'project',
    width: 220,
  },
  {
    title: 'Progress',
    dataIndex: 'progress',
    key: 'progress',
    width: 140,
  },
  {
    title: 'Due Date',
    dataIndex: 'dueDate',
    key: 'dueDate',
    width: 160,
  },
  {
    title: 'Region',
    dataIndex: 'region',
    key: 'region',
    width: 220,
  },
];

const data: DataType[] = Array.from({ length: total }).map((_, index) => {
  const itemIndex = index + 1;

  return {
    key: itemIndex,
    name: `Task ${itemIndex}`,
    owner: ['Alice', 'Bob', 'Carol', 'Daniel'][index % 4],
    status: ['Backlog', 'In progress', 'Review', 'Done'][index % 4] as Status,
    project: `Workspace ${(index % 12) + 1}`,
    progress: `${(index * 7) % 100}%`,
    dueDate: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String(
      (index % 28) + 1,
    ).padStart(2, '0')}`,
    region: ['New York', 'London', 'Singapore', 'Berlin'][index % 4],
  };
});

const App: React.FC = () => {
  const tableRef = useRef<TableRef>(null);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { baseProps, state, onChange } = useConfigActions({
    bordered: true,
    stripe: true,
  });

  const pageData = useMemo(() => {
    const start = (current - 1) * pageSize;

    return data.slice(start, start + pageSize);
  }, [current, pageSize]);

  const handlePaginationChange = (page: number, nextPageSize: number) => {
    setCurrent(page);
    setPageSize(nextPageSize);
    tableRef.current?.scrollToLeft();
    tableRef.current?.scrollToTop();
  };

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Table
          {...baseProps}
          ref={tableRef}
          columns={columns}
          dataSource={pageData}
          scrollY={400}
          pagination={
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `Total ${total} items`}
              onChange={handlePaginationChange}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                marginTop: 12,
              }}
            />
          }
        />
      </Space>
    </>
  );
};

export default App;
