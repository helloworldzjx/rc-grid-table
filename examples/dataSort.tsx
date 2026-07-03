import { Button, Space, Tag, theme } from 'antd';
import { Table } from 'rc-grid-table';
import {
  ColumnsType,
  DataSortOrder,
  SortDirection,
} from 'rc-grid-table/es/table/interface';
import React, { Key, useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  role: string;
  revenue: number;
  status: 'Active' | 'Pending' | 'Disabled';
  updatedAt: string;
}

interface SortControlProps {
  active?: boolean;
  order: SortDirection;
  priority?: number;
  onClick: () => void;
}

const getNextSortOrder = (
  current: SortDirection,
  directions: SortDirection[],
): SortDirection => {
  if (!directions.length) return null;

  const currentIndex = directions.indexOf(current);
  return directions[(currentIndex + 1) % directions.length] ?? null;
};

const updateSortStates = (
  current: DataSortOrder[],
  key: Key,
  order: SortDirection,
): DataSortOrder[] => {
  const rest = current.filter((item) => item.columnKey !== key);

  if (!order) {
    return rest;
  }

  return [{ columnKey: key, order }, ...rest];
};

const SortControl: React.FC<SortControlProps> = ({
  active,
  order,
  priority,
  onClick,
}) => {
  const { token } = theme.useToken();

  return (
    <Button
      aria-label="Sort column"
      size="small"
      type="text"
      title={active ? `Sorted ${order}` : 'Sort column'}
      onClick={onClick}
      style={{ position: 'relative', width: 24, paddingInline: 0 }}
    >
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          height: 18,
        }}
      >
        <span
          style={{
            borderInline: '4px solid transparent',
            borderBottom: '5px solid currentColor',
            color:
              active && order === 'ascend'
                ? token.colorPrimaryText
                : token.colorTextTertiary,
          }}
        />
        <span
          style={{
            borderInline: '4px solid transparent',
            borderTop: '5px solid currentColor',
            color:
              active && order === 'descend'
                ? token.colorPrimaryText
                : token.colorTextTertiary,
          }}
        />
      </span>
      {active && priority && (
        <span
          style={{
            position: 'absolute',
            insetBlockStart: -6,
            insetInlineEnd: -6,
            minWidth: 12,
            height: 12,
            paddingInline: 2,
            borderRadius: 6,
            backgroundColor: token.colorPrimary,
            color: token.colorTextLightSolid,
            fontSize: 10,
            lineHeight: '12px',
          }}
        >
          {priority}
        </span>
      )}
    </Button>
  );
};

const App: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<DataSortOrder[]>([
    { columnKey: 'updatedAt', order: 'descend' },
  ]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend', null],
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.age - b.age,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 150,
      ellipsis: true,
      sorter: (a, b) => a.revenue - b.revenue,
      sortDirections: ['descend', null],
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: DataType['status']) => (
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
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      sortDirections: ['descend', 'ascend', null],
    },
  ];

  const dataSource: DataType[] = [
    {
      key: 1,
      name: 'John Brown',
      age: 32,
      role: 'Engineer',
      revenue: 12800,
      status: 'Active',
      updatedAt: '2025-03-18',
    },
    {
      key: 2,
      name: 'Jim Green',
      age: 32,
      role: 'Designer',
      revenue: 8600,
      status: 'Pending',
      updatedAt: '2025-02-11',
    },
    {
      key: 3,
      name: 'Joe Black',
      age: 28,
      role: 'Manager',
      revenue: 16400,
      status: 'Active',
      updatedAt: '2025-04-07',
    },
    {
      key: 4,
      name: 'Jane Smith',
      age: 36,
      role: 'Analyst',
      revenue: 12800,
      status: 'Disabled',
      updatedAt: '2025-01-29',
    },
    {
      key: 5,
      name: 'Tom Wilson',
      age: 25,
      role: 'Engineer',
      revenue: 15100,
      status: 'Active',
      updatedAt: '2025-05-16',
    },
  ];

  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />

      <Table
        {...baseProps}
        columns={columns}
        dataSource={dataSource}
        dataSort={{
          sortOrder,
          sortRender: ({
            active,
            columnKey,
            sortOrder,
            sortPriority,
            sortDirections,
          }) => (
            <SortControl
              active={active}
              order={sortOrder}
              priority={sortPriority}
              onClick={() => {
                const nextOrder = getNextSortOrder(sortOrder, sortDirections);
                setSortOrder((current) =>
                  updateSortStates(current, columnKey, nextOrder),
                );
              }}
            />
          ),
        }}
      />
    </Space>
  );
};

export default App;
