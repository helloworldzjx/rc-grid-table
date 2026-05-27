import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
  company: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  gender: string;
}

export default () => {
  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      width: 120,
      fixed: 'start',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      width: 100,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      width: 260,
    },
    {
      title: 'Company',
      dataIndex: 'company',
      width: 220,
    },
    {
      title: 'Position',
      dataIndex: 'position',
      width: 200,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      width: 180,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 240,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      width: 160,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      width: 80,
      fixed: 'end',
    },
  ];

  const dataSource = Array.from({ length: 30 }).map<DataType>((_, i) => ({
    key: i,
    name: 'John Brown',
    age: i + 1,
    address: `Lake Street ${i + 1}`,
    company: 'SoftLake Co',
    position: 'Frontend Engineer',
    department: 'Product',
    email: `john.brown${i + 1}@softlake.test`,
    phone: `138-0000-${String(i + 1).padStart(4, '0')}`,
    gender: 'M',
  }));

  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Table
        {...baseProps}
        columns={columns}
        dataSource={dataSource}
        sticky={{ offsetHeader: 76 }}
        scrollY={1000}
      />
    </>
  );
};
