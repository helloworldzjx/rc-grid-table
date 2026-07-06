import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  firstName: string;
  lastName: string;
  age: number;
  street: string;
  building: string;
  number: number;
  companyAddress: string;
  companyName: string;
  gender: string;
}

export default () => {
  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      key: 'name',
      children: [
        {
          fixed: 'start',
          title: 'firstName',
          dataIndex: 'firstName',
          width: 120,
        },
        {
          fixed: 'start',
          title: 'lastName',
          dataIndex: 'lastName',
          key: 'lastName',
          width: 120,
        },
      ],
    },
    {
      title: 'Other',
      key: 'Other',
      children: [
        {
          title: 'Age',
          dataIndex: 'age',
          width: 150,
        },
        {
          title: 'Address',
          key: 'Address',
          children: [
            {
              title: 'Street',
              dataIndex: 'street',
              width: 150,
            },
            {
              title: 'Block',
              key: 'Block',
              children: [
                {
                  title: 'Building',
                  dataIndex: 'building',
                  width: 100,
                },
                {
                  title: 'Door No.',
                  dataIndex: 'number',
                  width: 100,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: 'Company',
      key: 'Company',
      children: [
        {
          title: 'Company Address',
          dataIndex: 'companyAddress',
          width: 200,
        },
        {
          title: 'Company Name',
          dataIndex: 'companyName',
          key: 'companyName',
        },
      ],
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
    firstName: 'John',
    lastName: 'Brown',
    age: i + 1,
    street: 'Lake Park',
    building: 'C',
    number: 2035,
    companyAddress: 'Lake Street 42',
    companyName: 'SoftLake Co',
    gender: 'M',
  }));

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Table
        {...baseProps}
        columns={columns}
        dataSource={dataSource}
        scrollY={400}
        rowSelection={{ fixed: 'start' }}
      />
    </>
  );
};
