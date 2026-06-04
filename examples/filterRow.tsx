import { DatePicker, Form, Input, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useCallback, useMemo } from 'react';

const { RangePicker } = DatePicker;

type Status = 'active' | 'paused' | 'archived';
type Role = 'Frontend' | 'Backend' | 'Designer' | 'Manager';

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  role: Role;
  status: Status;
  address: string;
  company: string;
  joinedAt: string;
  createdAt: string;
}

interface FilterValues {
  name?: string;
  role?: Role;
  status?: Status;
  company?: string;
  joinedAt?: Dayjs;
  createdAtRange?: [Dayjs, Dayjs];
}

const roleOptions: Role[] = ['Frontend', 'Backend', 'Designer', 'Manager'];
const statusOptions: Array<{ value: Status; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];
const companyOptions = ['SoftLake Co', 'Northwind Labs', 'BluePeak Studio'];

const dataSource: DataType[] = Array.from({ length: 36 }).map((_, index) => ({
  key: index,
  name: `John Brown ${index + 1}`,
  age: 22 + (index % 12),
  role: roleOptions[index % roleOptions.length],
  status: statusOptions[index % statusOptions.length].value,
  address: `Lake Street ${index + 1}`,
  company: companyOptions[index % companyOptions.length],
  joinedAt: dayjs('2024-01-05')
    .add(index * 9, 'day')
    .format('YYYY-MM-DD'),
  createdAt: dayjs('2024-02-01')
    .add(index * 5, 'day')
    .format('YYYY-MM-DD'),
}));

const includesText = (source: string, target?: string) => {
  const text = target?.trim().toLowerCase();
  return !text || source.toLowerCase().includes(text);
};

export default () => {
  const [form] = Form.useForm<FilterValues>();
  const filters = Form.useWatch([], form) || {};

  const FilterRow = useCallback(
    ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => {
      return (
        <div {...rest}>
          <Form form={form} component={false}>
            {children}
          </Form>
        </div>
      );
    },
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

  const columns = useMemo<ColumnsType<DataType>>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 180,
        fixed: 'start',
        filterRender: () => (
          <Form.Item name="name" noStyle>
            <Input
              allowClear
              placeholder="Search name"
              style={{ width: '100%' }}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Role',
        dataIndex: 'role',
        width: 150,
        filterRender: () => (
          <Form.Item name="role" noStyle>
            <Select
              allowClear
              placeholder="Role"
              style={{ width: '100%' }}
              options={roleOptions.map((role) => ({
                value: role,
                label: role,
              }))}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 140,
        filterRender: () => (
          <Form.Item name="status" noStyle>
            <Select
              allowClear
              placeholder="Status"
              options={statusOptions}
              style={{ width: '100%' }}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Age',
        dataIndex: 'age',
        width: 100,
        align: 'center',
      },
      {
        title: 'Company',
        dataIndex: 'company',
        width: 190,
        filterRender: () => (
          <Form.Item name="company" noStyle>
            <Select
              allowClear
              showSearch
              placeholder="Company"
              style={{ width: '100%' }}
              options={companyOptions.map((company) => ({
                value: company,
                label: company,
              }))}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Joined',
        dataIndex: 'joinedAt',
        width: 170,
        filterRender: () => (
          <Form.Item name="joinedAt" noStyle>
            <DatePicker
              allowClear
              placeholder="Joined date"
              style={{ width: '100%' }}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        width: 260,
        filterRender: () => (
          <Form.Item name="createdAtRange" noStyle>
            <RangePicker allowClear style={{ width: '100%' }} />
          </Form.Item>
        ),
      },
      {
        title: 'Address',
        dataIndex: 'address',
        width: 220,
      },
      {
        title: 'Action',
        key: 'action',
        width: 120,
        fixed: 'end',
        render: () => <a>Detail</a>,
      },
    ],
    [],
  );

  const filteredData = useMemo(() => {
    return dataSource.filter((record) => {
      const joinedAt = filters.joinedAt?.format('YYYY-MM-DD');
      const [createdStart, createdEnd] = filters.createdAtRange || [];

      return (
        includesText(record.name, filters.name) &&
        (!filters.role || record.role === filters.role) &&
        (!filters.status || record.status === filters.status) &&
        (!filters.company || record.company === filters.company) &&
        (!joinedAt || record.joinedAt === joinedAt) &&
        (!createdStart ||
          dayjs(record.createdAt).isSame(createdStart, 'day') ||
          dayjs(record.createdAt).isAfter(createdStart, 'day')) &&
        (!createdEnd ||
          dayjs(record.createdAt).isSame(createdEnd, 'day') ||
          dayjs(record.createdAt).isBefore(createdEnd, 'day'))
      );
    });
  }, [filters]);

  return (
    <Table
      bordered
      columns={columns}
      dataSource={filteredData}
      scrollY={360}
      sticky={{ offsetHeader: 0 }}
      components={components}
    />
  );
};
