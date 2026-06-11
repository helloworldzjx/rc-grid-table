import {
  Button,
  DatePicker,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useCallback, useMemo, useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

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

type FilterMode = 'on change' | 'on search';
type FilterField = keyof FilterValues;

interface FilterEntry {
  field: FilterField;
  label: string;
  value: string;
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

const getStatusLabel = (status?: Status) => {
  return statusOptions.find((item) => item.value === status)?.label || status;
};

const getFilterEntries = (filters: FilterValues) => {
  const entries: FilterEntry[] = [];
  const name = filters.name?.trim();
  const [createdStart, createdEnd] = filters.createdAtRange || [];

  if (name) {
    entries.push({ field: 'name', label: 'Name', value: name });
  }
  if (filters.role) {
    entries.push({ field: 'role', label: 'Role', value: filters.role });
  }
  if (filters.status) {
    entries.push({
      field: 'status',
      label: 'Status',
      value: getStatusLabel(filters.status) || '',
    });
  }
  if (filters.company) {
    entries.push({
      field: 'company',
      label: 'Company',
      value: filters.company,
    });
  }
  if (filters.joinedAt) {
    entries.push({
      field: 'joinedAt',
      label: 'Joined',
      value: filters.joinedAt.format('YYYY-MM-DD'),
    });
  }
  if (createdStart || createdEnd) {
    entries.push({
      field: 'createdAtRange',
      label: 'Created',
      value: `${createdStart?.format('YYYY-MM-DD') || 'Any'} ~ ${
        createdEnd?.format('YYYY-MM-DD') || 'Any'
      }`,
    });
  }

  return entries;
};

const removeFilterValue = (filters: FilterValues, field: FilterField) => {
  const nextFilters = { ...filters };
  delete nextFilters[field];
  return nextFilters;
};

const filterData = (filters: FilterValues) => {
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
};

export default () => {
  const [form] = Form.useForm<FilterValues>();
  const formFilters = Form.useWatch([], form) || {};
  const [filterMode, setFilterMode] = useState<FilterMode>('on change');
  const [committedFilters, setCommittedFilters] = useState<FilterValues>({});
  const activeFilters =
    filterMode === 'on change' ? formFilters : committedFilters;
  const filterEntries = useMemo(
    () => getFilterEntries(formFilters),
    [formFilters],
  );

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

  const handleModeChange = useCallback(
    (nextMode: FilterMode) => {
      if (nextMode === 'on search') {
        setCommittedFilters(form.getFieldsValue());
      }
      setFilterMode(nextMode);
    },
    [form],
  );

  const handleSearch = useCallback(() => {
    setCommittedFilters(form.getFieldsValue());
  }, [form]);

  const handleReset = useCallback(() => {
    form.resetFields();
    setCommittedFilters({});
  }, [form]);

  const handleRemoveFilter = useCallback(
    (field: FilterField) => {
      form.setFieldsValue({ [field]: undefined } as FilterValues);
      if (filterMode === 'on change') {
        setCommittedFilters((current) => removeFilterValue(current, field));
      }
    },
    [filterMode, form],
  );

  const columns: ColumnsType<DataType> = [
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
      filterRender: () => (
        <Input allowClear disabled style={{ width: '100%' }} />
      ),
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
      filterRender: () => (
        <Input allowClear disabled style={{ width: '100%' }} />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'end',
      render: () => <a>Detail</a>,
      filterRender: () => (
        <Input allowClear disabled style={{ width: '100%' }} />
      ),
    },
  ];

  const filteredData = useMemo(
    () => filterData(activeFilters),
    [activeFilters],
  );

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions();

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />
      <Space wrap>
        <Typography.Link>搜索模式：</Typography.Link>
        <Segmented<FilterMode>
          value={filterMode}
          options={[
            { label: 'on change', value: 'on change' },
            { label: 'on search', value: 'on search' },
          ]}
          onChange={handleModeChange}
        />
      </Space>
      <Space wrap>
        <Typography.Link>Filters：</Typography.Link>
        {filterEntries.length ? (
          filterEntries.map((item) => (
            <Space key={item.field} size={4}>
              <Typography.Text>{item.label}</Typography.Text>
              <Tag
                closable
                onClose={(event) => {
                  event.preventDefault();
                  handleRemoveFilter(item.field);
                }}
              >
                {item.value}
              </Tag>
            </Space>
          ))
        ) : (
          <Typography.Text type="secondary">None</Typography.Text>
        )}
      </Space>
      {filterMode === 'on search' && (
        <Space>
          <Button type="primary" onClick={handleSearch}>
            Search
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </Space>
      )}
      <Table
        {...baseProps}
        columns={columns}
        dataSource={filteredData}
        scrollY={360}
        sticky={{ offsetHeader: 0 }}
        components={components}
      />
    </Space>
  );
};
