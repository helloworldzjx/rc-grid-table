import React from 'react';
import { Divider, Space, Tag, Typography } from 'antd';
import { Table } from 'rc-grid-table';
import type { TableProps } from 'rc-grid-table/es/table/interface';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

const { Text } = Typography;

interface DataType {
  key: string;
  name: string;
  borrow: number;
  repayment: number;
}

interface FixedDataType {
  key: React.Key;
  name: string;
  description: string;
}

const App: React.FC = () => {
  // 列数组
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Borrow',
      dataIndex: 'borrow',
    },
    {
      title: 'Repayment',
      dataIndex: 'repayment',
    },
  ];

  // 数据源
  const data: DataType[] = [
    {
      key: '1',
      name: 'John Brown',
      borrow: 10,
      repayment: 33,
    },
    {
      key: '2',
      name: 'Jim Green',
      borrow: 100,
      repayment: 0,
    },
    {
      key: '3',
      name: 'Joe Black',
      borrow: 10,
      repayment: 10,
    },
    {
      key: '4',
      name: 'Jim Red',
      borrow: 75,
      repayment: 45,
    },
  ];

  const fixedColumns: TableProps<FixedDataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      fixed: 'start',
      width: 100,
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
  ];

  const fixedDataSource = Array.from({ length: 20 }).map<FixedDataType>((_, i) => ({
    key: i,
    name: ['Light', 'Bamboo', 'Little'][i % 3],
    description: 'Everything that has a beginning, has an end.',
  }));

  // 动态控制 两行总结栏 table 的 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps: mdBaseProps, state: mdState, onChange: mdOnChange } = useConfigActions({bordered: true})

  // 动态控制 一行总结栏 table 的 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps: smBaseProps, state: smState, onChange: smOnChange } = useConfigActions({bordered: true})

  return (
    <>
      <Divider>两行总结栏 table</Divider>
      <ConfigActions value={mdState} onChange={mdOnChange} />
      <Table 
        {...mdBaseProps} 
        columns={columns} 
        dataSource={data} 
        summary={(pageData) => {
          let totalBorrow = 0;
          let totalRepayment = 0;
          pageData.forEach(({ borrow, repayment }) => {
            totalBorrow += borrow;
            totalRepayment += repayment;
          });

          return [
            [
              {children: 'Total'},
              {children: <Text type="danger">{totalBorrow}</Text>},
              {children: <Text>{totalRepayment}</Text>},
            ],
            [
              {children: 'Balance'},
              {colSpan: 2, children: <Text type="danger">{totalBorrow - totalRepayment}</Text>},
            ],
          ]
        }}
      />

      <Divider>一行总结栏 table</Divider>
      <ConfigActions value={smState} onChange={smOnChange} />
      <Table 
        {...smBaseProps} 
        columns={fixedColumns} 
        dataSource={fixedDataSource} 
        summary={() => [
          [
            {children: 'Summary'},
            {children: 'This is a summary content'},
          ]
        ]}
      />
    </>
  )
};

export default App;