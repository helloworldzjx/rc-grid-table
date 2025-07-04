import { Table } from 'rc-grid-table';
import { ColumnsType } from 'rc-grid-table/es/table/interface';
import React from 'react';

interface DataType {
  key: string;
  name: string;
  age: number;
  tel: string;
  phone: number;
  address: string;
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
  ];

  const dataSource: DataType[] = Array.from({length: 8}).map((_, i) => ({
    key: `${i}`,
    name: 'Jake White',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Dublin No. 2 Lake Park',
  }))

  const bigDataSource: DataType[] = Array.from({length: 1000}).map((_, i) => ({
    key: `${i}`,
    name: 'Jake White',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Dublin No. 2 Lake Park',
  }))

  return (
    <div>
      <Table 
        columns={columns} 
        dataSource={dataSource} 
        bordered
        // style={{height: 360}}
        resizableColumns
        sortableColumns
        sticky
        scrollY={400}
        summary={() => ([
          [
            { rowSpan: 2, children: 'aaaa' },
            { colSpan: columns.length - 3, children: 'a?."{&aaa' },
            { children: '123213' },
            { children: '123213' }
          ],
          [
            { children: 'a?."{&aaa' },
            { colSpan: columns.length - 3, children: '123213' },
            { children: '123213', rowSpan: 2 }
          ],
          [
            { children: 'aaaa' },
            { children: 'a?."{&aaa' },
            { colSpan: columns.length - 3, children: '123213' },
          ],
          [
            { children: 'aaaa' },
            { children: 'aaaa' },
            { colSpan: columns.length - 3, children: '123213' },
            { children: 'aaaa' },
          ],
          [
            { colSpan: columns.length - 2, children: '123213' },
            { children: 'aaaa' },
            { children: '123213' }
          ],
        ])}
      />
    </div>
  );
};
