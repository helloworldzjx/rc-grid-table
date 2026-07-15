import { Button, Space, Switch, Tag, theme, Typography } from 'antd';
import { Table } from 'rc-grid-table';
import {
  ColumnInfo,
  ColumnsType,
  DataSortOrder,
  SortDirection,
} from 'rc-grid-table/es/table/interface';
import React, { Key, useCallback, useMemo, useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  group: string;
  customer: string;
  owner: string;
  status: 'Open' | 'Review' | 'Closed';
  orders: number;
  amount: number;
  profit: number;
  groupRow?: boolean;
  children?: DataType[];
}

interface SortControlProps {
  active?: boolean;
  order: SortDirection;
  onClick: () => void;
}

const sourceData: DataType[] = [
  {
    key: '1',
    group: 'North',
    customer: 'Acme Store',
    owner: 'Lily',
    status: 'Open',
    orders: 18,
    amount: 84000,
    profit: 18600,
  },
  {
    key: '2',
    group: 'South',
    customer: 'Blue Ocean',
    owner: 'Jim',
    status: 'Review',
    orders: 12,
    amount: 62000,
    profit: 15400,
  },
  {
    key: '3',
    group: 'North',
    customer: 'Green Field',
    owner: 'Kate',
    status: 'Closed',
    orders: 9,
    amount: 39000,
    profit: 7200,
  },
  {
    key: '4',
    group: 'East',
    customer: 'River Supply',
    owner: 'Tom',
    status: 'Open',
    orders: 22,
    amount: 91000,
    profit: 21600,
  },
  {
    key: '5',
    group: 'South',
    customer: 'Metro Works',
    owner: 'Lucy',
    status: 'Closed',
    orders: 15,
    amount: 73000,
    profit: 20100,
  },
  {
    key: '6',
    group: 'West',
    customer: 'Sunrise Co',
    owner: 'John',
    status: 'Review',
    orders: 7,
    amount: 28000,
    profit: 6400,
  },
  {
    key: '7',
    group: 'East',
    customer: 'Lake House',
    owner: 'Jane',
    status: 'Open',
    orders: 16,
    amount: 68500,
    profit: 14900,
  },
  {
    key: '8',
    group: 'West',
    customer: 'Star Retail',
    owner: 'Alex',
    status: 'Closed',
    orders: 11,
    amount: 47000,
    profit: 11300,
  },
  {
    key: '9',
    group: 'Central',
    customer: 'Bright Mall',
    owner: 'Mia',
    status: 'Open',
    orders: 20,
    amount: 88000,
    profit: 22500,
  },
  {
    key: '10',
    group: 'East',
    customer: 'Cedar Market',
    owner: 'Nora',
    status: 'Review',
    orders: 13,
    amount: 54000,
    profit: 12800,
  },
  {
    key: '11',
    group: 'South',
    customer: 'Silver Port',
    owner: 'Oscar',
    status: 'Open',
    orders: 19,
    amount: 82000,
    profit: 17300,
  },
  {
    key: '12',
    group: 'Central',
    customer: 'Cloud Nine',
    owner: 'Ivy',
    status: 'Closed',
    orders: 8,
    amount: 33500,
    profit: 7800,
  },
  {
    key: '13',
    group: 'North',
    customer: 'Pine Wholesale',
    owner: 'Evan',
    status: 'Review',
    orders: 14,
    amount: 59000,
    profit: 13200,
  },
  {
    key: '14',
    group: 'West',
    customer: 'Hill Foods',
    owner: 'Grace',
    status: 'Open',
    orders: 17,
    amount: 76000,
    profit: 18100,
  },
  {
    key: '15',
    group: 'East',
    customer: 'Harbor Tools',
    owner: 'Ryan',
    status: 'Closed',
    orders: 10,
    amount: 42000,
    profit: 9700,
  },
  {
    key: '16',
    group: 'North',
    customer: 'Oak Partners',
    owner: 'Sofia',
    status: 'Open',
    orders: 21,
    amount: 96000,
    profit: 24400,
  },
  {
    key: '17',
    group: 'South',
    customer: 'Urban Line',
    owner: 'Henry',
    status: 'Review',
    orders: 6,
    amount: 24500,
    profit: 5200,
  },
  {
    key: '18',
    group: 'Central',
    customer: 'Stone Yard',
    owner: 'Ava',
    status: 'Open',
    orders: 12,
    amount: 51000,
    profit: 11600,
  },
  {
    key: '19',
    group: 'West',
    customer: 'Evergreen Lab',
    owner: 'Noah',
    status: 'Closed',
    orders: 9,
    amount: 36500,
    profit: 8400,
  },
  {
    key: '20',
    group: 'East',
    customer: 'Red Bridge',
    owner: 'Emma',
    status: 'Open',
    orders: 18,
    amount: 79500,
    profit: 19200,
  },
];

const getNextSortOrder = (
  current: SortDirection,
  directions: SortDirection[],
): SortDirection => {
  if (!directions.length) return null;

  const currentIndex = directions.indexOf(current);
  return directions[(currentIndex + 1) % directions.length] ?? null;
};

const renderMoney = (value: number) => `$${value.toLocaleString()}`;

const renderStatus = (status: DataType['status']) => (
  <Tag
    color={
      status === 'Open' ? 'green' : status === 'Review' ? 'gold' : 'default'
    }
  >
    {status}
  </Tag>
);

const groupBy = <T,>(
  data: T[],
  getKey: (record: T) => string,
): Record<string, T[]> =>
  data.reduce<Record<string, T[]>>((groups, record) => {
    const key = getKey(record);
    const group = groups[key] ?? [];

    group.push(record);
    groups[key] = group;

    return groups;
  }, {});

const buildGroupedData = (data: DataType[]): DataType[] => {
  const groups = groupBy(data, (record) => record.group);

  return Object.entries(groups).map(([group, children]) => ({
    key: `group-${group}`,
    group,
    customer: '',
    owner: '',
    status: 'Open',
    orders: children.reduce((total, record) => total + record.orders, 0),
    amount: children.reduce((total, record) => total + record.amount, 0),
    profit: children.reduce((total, record) => total + record.profit, 0),
    groupRow: true,
    children,
  }));
};

const groupedDataSource = buildGroupedData(sourceData);

const isGroupRow = (record: DataType) => !!record.groupRow;

const SortControl: React.FC<SortControlProps> = ({
  active,
  order,
  onClick,
}) => {
  const { token } = theme.useToken();

  return (
    <Button
      aria-label="Sort group"
      size="small"
      type="text"
      title={active ? `Sorted ${order}` : 'Sort group'}
      onClick={onClick}
      style={{ width: 24, paddingInline: 0 }}
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
    </Button>
  );
};

const App: React.FC = () => {
  const { token } = theme.useToken();
  const [grouped, setGrouped] = useState(false);
  const [sortOrder, setSortOrder] = useState<DataSortOrder>({
    columnKey: 'group',
    order: 'ascend',
  });
  const dataSource = grouped ? groupedDataSource : sourceData;
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const expandedRowKeySet = useMemo(
    () => new Set<React.Key>(expandedRowKeys),
    [expandedRowKeys],
  );

  const updateGroupSort = (
    columnKey: Key,
    current: SortDirection,
    directions: SortDirection[],
  ) => {
    const nextOrder = getNextSortOrder(current, directions);
    if (nextOrder) {
      setSortOrder({ columnKey, order: nextOrder });
    }
  };

  const totalTitle = (title: string) => (grouped ? `${title}（total）` : title);
  const getExpandedGroupRowCellStyle = useCallback(
    (column: ColumnInfo): React.CSSProperties => ({
      position: 'sticky',
      top: -1,
      zIndex: column.key === 'group' ? 2 : 1,
      boxShadow: `0px 0.5px 0 ${token.colorBorder}`,
    }),
    [token.colorBorder],
  );

  const columns: ColumnsType<DataType> = [
    {
      title: totalTitle('Group'),
      dataIndex: 'group',
      key: 'group',
      width: 200,
      fixed: 'start',
      sorter: (a, b) => {
        if (!grouped) {
          return a.group.localeCompare(b.group);
        }

        const countDiff = (a.children?.length ?? 0) - (b.children?.length ?? 0);
        return countDiff || a.group.localeCompare(b.group);
      },
      sortDirections: ['ascend', 'descend'],
      sortRender: ({
        active,
        columnKey,
        sortOrder: currentOrder,
        sortDirections,
      }) => (
        <SortControl
          active={active}
          order={currentOrder}
          onClick={() =>
            updateGroupSort(columnKey, currentOrder, sortDirections)
          }
        />
      ),
      render: (value: string, record) =>
        isGroupRow(record) ? (
          <Space size={8}>
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary">
              {record.children?.length} customers
            </Typography.Text>
          </Space>
        ) : (
          value
        ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
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
      render: (status: DataType['status'], record) =>
        isGroupRow(record) ? null : renderStatus(status),
    },
    {
      title: totalTitle('Orders'),
      dataIndex: 'orders',
      key: 'orders',
      width: 150,
      align: 'right',
      render: (value: number, record) =>
        isGroupRow(record) ? (
          <Typography.Text strong>{value}</Typography.Text>
        ) : (
          value
        ),
    },
    {
      title: totalTitle('Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (value: number, record) =>
        isGroupRow(record) ? (
          <Typography.Text strong>{renderMoney(value)}</Typography.Text>
        ) : (
          renderMoney(value)
        ),
    },
    {
      title: totalTitle('Profit'),
      dataIndex: 'profit',
      key: 'profit',
      width: 150,
      align: 'right',
      render: (value: number, record) =>
        isGroupRow(record) ? (
          <Typography.Text strong type="success">
            {renderMoney(value)}
          </Typography.Text>
        ) : (
          renderMoney(value)
        ),
    },
  ];

  const { baseProps, state, onChange } = useConfigActions();

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />
      <Space align="center">
        <Switch checked={grouped} onChange={setGrouped} />
        <Typography.Text>Data group</Typography.Text>
      </Space>
      <Table
        {...baseProps}
        columns={columns}
        dataSource={dataSource}
        scrollY={400}
        virtual={false}
        dataSort={{
          sortOrder,
        }}
        onCell={(record, _rowIndex, column) =>
          grouped && isGroupRow(record) && expandedRowKeySet.has(record.key)
            ? {
                style: getExpandedGroupRowCellStyle(column),
              }
            : {}
        }
        expandable={
          grouped
            ? {
                expandedRowKeys,
                onExpandedRowsChange: setExpandedRowKeys,
                indentSize: 20,
              }
            : undefined
        }
      />
    </Space>
  );
};

export default App;
