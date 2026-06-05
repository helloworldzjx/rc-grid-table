import { Button, Form, Input, Space, Switch, Tag } from 'antd';
import { Table, TableRef } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

type Status = 'Active' | 'Pending' | 'Disabled';

interface DataType {
  key: string;
  name: string;
  age: number;
  department: string;
  status: Status;
  address: string;
  note: string;
  [key: `metric_${number}`]: number;
}

interface FilterValues {
  name?: string;
  department?: string;
  metric_0?: string;
  metric_29?: string;
}

const metricCount = 30;
const metricIndexes = Array.from({ length: metricCount }, (_, index) => index);

const includesText = (source: string | number, target?: string) => {
  const text = target?.trim().toLowerCase();
  return !text || `${source}`.toLowerCase().includes(text);
};

const App: React.FC = () => {
  const tableRef = useRef<TableRef>(null);
  const [form] = Form.useForm<FilterValues>();
  const filters = Form.useWatch([], form) || {};
  const [rowHeightEnabled, setRowHeightEnabled] = useState(true);

  const FilterRow = useCallback(
    ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>
        <Form form={form} component={false}>
          {children}
        </Form>
      </div>
    ),
    [form],
  );

  const components = useMemo(
    () => ({
      header: {
        filterRow: FilterRow,
      },
    }),
    [FilterRow],
  );

  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      fixed: 'start',
      width: 160,
      ellipsis: rowHeightEnabled,
      filterRender: () => (
        <Form.Item name="name" noStyle>
          <Input allowClear placeholder="Search name" />
        </Form.Item>
      ),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      width: 100,
      ellipsis: rowHeightEnabled,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      width: 160,
      ellipsis: rowHeightEnabled,
      filterRender: () => (
        <Form.Item name="department" noStyle>
          <Input allowClear placeholder="Department" />
        </Form.Item>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      ellipsis: rowHeightEnabled,
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
      ellipsis: rowHeightEnabled,
    },
    {
      title: 'Dynamic height note',
      dataIndex: 'note',
      width: 360,
      ellipsis: rowHeightEnabled,
    },
    ...metricIndexes.map((index) => ({
      title: `Metric ${index + 1}`,
      dataIndex: `metric_${index}` as const,
      width: index % 5 === 0 ? 150 : 120,
      align: 'right' as const,
      ellipsis: rowHeightEnabled,
      filterRender:
        index === 0 || index === metricCount - 1
          ? () => (
              <Form.Item name={`metric_${index}` as keyof FilterValues} noStyle>
                <Input allowClear placeholder={`Metric ${index + 1}`} />
              </Form.Item>
            )
          : undefined,
    })),
    {
      title: 'Action',
      fixed: 'end',
      key: 'action',
      width: 140,
      ellipsis: rowHeightEnabled,
      render: (_, record) => <a>Invite {record.name}</a>,
    },
  ];

  const [dataSource, setDataSource] = useState(() =>
    Array.from({ length: 10000 }).map<DataType>((_, index) => {
      const record: DataType = {
        key: `${index}`,
        name: `User ${index}`,
        age: 20 + (index % 30),
        department: ['Operations', 'Support', 'Finance', 'Product'][index % 4],
        status: ['Active', 'Pending', 'Disabled'][index % 3] as Status,
        address: `No. ${index} Lake Park, Dublin`,
        note:
          index % 7 === 0
            ? 'This row has a longer paragraph so the virtual list can collect real height and keep the scrollbar size accurate while scrolling quickly.'
            : 'Compact row.',
      };

      metricIndexes.forEach((metricIndex) => {
        record[`metric_${metricIndex}`] =
          (index * 13 + metricIndex * 17) % 10000;
      });

      return record;
    }),
  );

  const filteredData = useMemo(
    () =>
      dataSource.filter(
        (record) =>
          includesText(record.name, filters.name) &&
          includesText(record.department, filters.department) &&
          includesText(record.metric_0, filters.metric_0) &&
          includesText(record.metric_29, filters.metric_29),
      ),
    [dataSource, filters],
  );

  const { baseProps, state, onChange } = useConfigActions({
    bordered: true,
    stripe: true,
  });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Space style={{ marginBottom: 12 }} wrap>
        <Button onClick={() => tableRef.current?.scrollToTop()}>
          Scroll top
        </Button>
        <Button
          onClick={() =>
            tableRef.current?.scrollTo({ index: 1500, align: 'top' })
          }
        >
          Scroll to 1500
        </Button>
        <Button
          onClick={() =>
            tableRef.current?.scrollTo({ key: '9999', align: 'bottom' })
          }
        >
          Scroll bottom
        </Button>
        <Switch
          checked={rowHeightEnabled}
          checkedChildren="Fixed Row Height"
          unCheckedChildren="Dynamic Row Height"
          onChange={setRowHeightEnabled}
        />
      </Space>
      <Table
        {...baseProps}
        ref={tableRef}
        columns={columns}
        dataSource={filteredData}
        scrollY={420}
        sticky={{ offsetHeader: 76 }}
        virtual={{
          rowOverscan: 6,
          columnOverscan: 640,
          ...(rowHeightEnabled && {
            rowHeight: 56,
            expandedRowHeight: 80,
          }),
        }}
        components={components}
        rowSortable={{
          fixed: 'start',
          onChange: setDataSource,
        }}
        expandable={{
          fixed: 'start',
          expandedRowRender: (record) => record.note,
          rowExpandable: (record) => Number(record.key) % 11 === 0,
        }}
        summary={(pageData, flattenColumns) => [
          [
            { children: 'Total rows', colSpan: 2 },
            { children: pageData.length },
            {
              colSpan: Math.max((flattenColumns?.length || 1) - 2, 1),
              children:
                'Rows and non-fixed columns are virtualized by default.',
            },
          ],
        ]}
      />
    </>
  );
};

export default App;
