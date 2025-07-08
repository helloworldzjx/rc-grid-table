import { Table, Theme } from 'rc-grid-table';
import { ColumnState, ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useState } from 'react';
import useConfigActions from './_utils/hooks/useConfigActions';
import ConfigActions from './_utils/components/ConfigActions';

interface DataType {
  key: string;
  name: string;
  age: number;
  tel: string;
  phone: number;
  address: string;
  'test0-0-0': any;
  'test0-0-1': any;
  'test0-0-2': any;
  'test0-1': any;
  'test0-2': any;
  test1: any;
  test2: any;
  test3: any;
}

// In the fifth row, other columns are merged into first column
// by setting it's colSpan to be 0
const sharedOnCell = (_: DataType, index?: number) => {
  if (index === 1) {
    return { colSpan: 0 };
  }

  return {};
};

export default () => {
  const columns: ColumnsType<DataType> = [
    {
      title: 'test0',
      key: 'test0',
      fixed: 'start',
      children: [
        {
          title: 'test0-0',
          dataIndex: 'test0-0',
          fixed: 'start',
          children: [
            {
              title: 'test0-0-0',
              dataIndex: 'test0-0-0',
              fixed: 'start',
              width: 150,
              colSpan: 2,
            },
            {
              title: 'test0-0-1',
              dataIndex: 'test0-0-1',
              fixed: 'start',
              colSpan: 0,
            },
            {
              title: 'test0-0-2',
              dataIndex: 'test0-0-2',
              fixed: 'start',
            },
          ]
        },
        {
          title: 'test0-1',
          dataIndex: 'test0-1',
          fixed: 'start',
          width: '20%',
        },
        {
          title: 'test0-2',
          dataIndex: 'test0-2',
          fixed: 'start',
        },
      ],
    },
    {
      title: 'test1',
      dataIndex: 'test1',
    },
    {
      title: 'RowHead',
      dataIndex: 'key',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (text) => <a>{text}</a>,
      onCell: (_, index) => ({
        colSpan: index === 1 ? 5 : 1,
      }),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      onCell: sharedOnCell,
    },
    {
      title: 'Home phone',
      colSpan: 2,
      dataIndex: 'tel',
      onCell: (_, index) => {
        if (index === 3) {
          return { rowSpan: 2 };
        }
        // These two are merged into above cell
        if (index === 4) {
          return { rowSpan: 0 };
        }
        if (index === 1) {
          return { colSpan: 0 };
        }

        return {};
      },
    },
    {
      title: 'Phone',
      colSpan: 0,
      dataIndex: 'phone',
      onCell: sharedOnCell,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      onCell: sharedOnCell,
    },
    {
      title: 'test2',
      dataIndex: 'test2',
      fixed: 'end',
    },
    {
      title: 'test3',
      key: 'test3',
      fixed: 'end',
      children: [{dataIndex: 'test3', key: 'test3-0', fixed: 'end', title: 'test3-0'}]
    },
  ];

  const dataSource: DataType[] = Array.from({length: 10}).map((_, i) => ({
    key: `${i}`,
    name: 'Jake White',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Dublin No. 2 Lake Park',
    'test0-0-0': 'test0-0-0',
    'test0-0-1': 'test0-0-1',
    'test0-0-2': 'test0-0-2',
    'test0-1': 'test0-1',
    'test0-2': 'test0-2',
    test1: 'test1',
    test2: 'test2',
    test3: 'test3'
  }))

  const bigDataSource: DataType[] = Array.from({length: 1000}).map((_, i) => ({
    key: `${i}`,
    name: 'Jake White',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Dublin No. 2 Lake Park',
    'test0-0-0': 'test0-0',
    'test0-0-1': 'test0-2',
    'test0-0-2': 'test0-2',
    'test0-1': 'test0-1',
    'test0-2': 'test0-2',
    test1: 'test1',
    test2: 'test2',
    test3: 'test3'
  }))

  const { token } = Theme.useToken()
  // 动态控制 bordered、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({bordered: true})
  const tableKey = 'testTable'
  const storageKey = `${tableKey}-columnsState`
  const [columnsState, setColumnsState] = useState<ColumnState[]>(JSON.parse(localStorage.getItem(storageKey) || '[]'))

  return (
    <>
      <ConfigActions value={state} onChange={onChange} />
      <Table 
        {...baseProps}
        columns={columns} 
        dataSource={dataSource} 
        // style={{height: 360}}
        sticky
        scrollY={400}
        columnsConfig={{
          // useStorage: true,
          // columnsState: columnsState,
          // onChange(columnsState) {
          //   localStorage.setItem(storageKey, JSON.stringify(columnsState))
          // },
        }}
        // summary={(_, columnsLength) => ([
        //   [
        //     { children: '123213' },
        //     { children: 'a?."{&aaa' },
        //     { colSpan: columnsLength - 3, children: 'a?."{&aaa' },
        //     { children: '123213' },
        //   ],
        //   [
        //     { children: '123213' },
        //     { colSpan: columnsLength - 2, children: '123213' },
        //     { children: 'a?."{&aaa' },
        //   ],
        // ])}
      />
    </>
  );
};
