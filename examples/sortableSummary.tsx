import { Divider, Space, Tag, Typography } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnState, ColumnsType } from 'rc-grid-table/es/table/interface';
import React from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

const { Text } = Typography;

interface DataType {
  key: string;
  name: string;
  region: string;
  orders: number;
  revenue: number;
  status: 'stable' | 'growth';
}

const columns: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 140,
  },
  {
    title: 'Region',
    dataIndex: 'region',
    key: 'region',
    width: 140,
  },
  {
    title: 'Orders',
    dataIndex: 'orders',
    key: 'orders',
    width: 120,
  },
  {
    title: 'Revenue',
    dataIndex: 'revenue',
    key: 'revenue',
    width: 140,
    render: (value: number) => `$${value.toLocaleString()}`,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status: DataType['status']) => (
      <Tag color={status === 'growth' ? 'green' : 'blue'}>{status}</Tag>
    ),
  },
];

const dataSource: DataType[] = [
  {
    key: '1',
    name: 'Northwind',
    region: 'North',
    orders: 24,
    revenue: 12800,
    status: 'growth',
  },
  {
    key: '2',
    name: 'Southridge',
    region: 'South',
    orders: 18,
    revenue: 9400,
    status: 'stable',
  },
  {
    key: '3',
    name: 'Eastmark',
    region: 'East',
    orders: 31,
    revenue: 17600,
    status: 'growth',
  },
];

const getTotals = (pageData: DataType[]) => {
  return {
    orders: pageData.reduce((sum, record) => sum + record.orders, 0),
    revenue: pageData.reduce((sum, record) => sum + record.revenue, 0),
    growthCount: pageData.filter((record) => record.status === 'growth').length,
  };
};

const renderColumnSummary = (
  pageData: DataType[],
  flattenColumns: ColumnState<DataType>[] = [],
) => {
  const totals = getTotals(pageData);

  return [
    flattenColumns.map((column) => {
      if (column.key === 'name') {
        return { key: column.key, children: <Text strong>Total</Text> };
      }
      if (column.key === 'orders') {
        return {
          key: column.key,
          children: <Text type="success">{totals.orders}</Text>,
        };
      }
      if (column.key === 'revenue') {
        return {
          key: column.key,
          children: (
            <Text type="danger">${totals.revenue.toLocaleString()}</Text>
          ),
        };
      }
      if (column.key === 'status') {
        return {
          key: column.key,
          children: <Tag color="green">{totals.growthCount} growth</Tag>,
        };
      }

      return { key: column.key, children: null };
    }),
  ];
};

const renderMergedMetricSummary = (
  pageData: DataType[],
  flattenColumns: ColumnState<DataType>[] = [],
) => {
  const totals = getTotals(pageData);
  const row = [];

  for (let index = 0; index < flattenColumns.length; index++) {
    const column = flattenColumns[index];
    const nextColumn = flattenColumns[index + 1];

    if (column.key === 'name') {
      row.push({ key: column.key, children: <Text strong>Metrics</Text> });
    } else if (column.key === 'orders' && nextColumn?.key === 'revenue') {
      row.push({
        key: 'orders-revenue',
        colSpan: 2,
        children: (
          <Text type="danger">
            {totals.orders} orders / ${totals.revenue.toLocaleString()}
          </Text>
        ),
      });
      index += 1;
    } else if (column.key === 'orders') {
      row.push({
        key: column.key,
        children: <Text type="success">{totals.orders}</Text>,
      });
    } else if (column.key === 'revenue') {
      row.push({
        key: column.key,
        children: <Text type="danger">${totals.revenue.toLocaleString()}</Text>,
      });
    } else {
      row.push({ key: column.key, children: null });
    }
  }

  return [row];
};

const renderFullWidthSummary = (
  pageData: DataType[],
  flattenColumns: ColumnState<DataType>[] = [],
) => {
  return [
    [
      {
        key: 'summary-note',
        colSpan: flattenColumns.length,
        children: (
          <Text type="secondary">
            Showing {pageData.length} records in the current table view.
          </Text>
        ),
      },
    ],
  ];
};

const App: React.FC = () => {
  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({
    bordered: true,
    sortableColumns: true,
  });

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />
      <div>
        <Divider>Column based summary</Divider>
        <Table
          {...baseProps}
          columns={columns}
          dataSource={dataSource}
          summary={(pageData, flattenColumns) =>
            renderColumnSummary(pageData, flattenColumns)
          }
        />
      </div>

      <div>
        <Divider>Custom merged summary</Divider>
        <Table
          {...baseProps}
          columns={columns}
          dataSource={dataSource}
          summary={(pageData, flattenColumns) =>
            renderMergedMetricSummary(pageData, flattenColumns)
          }
        />
      </div>

      <div>
        <Divider>Full width summary</Divider>
        <Table
          {...baseProps}
          columns={columns}
          dataSource={dataSource}
          summary={renderFullWidthSummary}
        />
      </div>
    </Space>
  );
};

export default App;
