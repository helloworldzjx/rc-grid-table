import { Table } from 'rc-grid-table';
import { ColumnState, ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { useState } from 'react';
import useConfigActions from './_utils/hooks/useConfigActions';
import ConfigActions from './_utils/components/ConfigActions';
import { Button, Checkbox, Flex, Tooltip } from 'antd';

interface DataType {
  key: React.Key;
  name: string;
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
      dataIndex: 'name',
      width: 100,
      fixed: 'start',
    },
    {
      title: 'Other',
      key: 'Other',
      children: [
        {
          title: 'Age',
          dataIndex: 'age',
          width: 100,
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
          width: 240,
        },
        {
          title: 'Company Name',
          dataIndex: 'companyName',
          key: 'companyName',
          width: 240,
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
    name: 'John Brown',
    age: i + 1,
    street: 'Lake Park',
    building: 'C',
    number: 2035,
    companyAddress: 'Lake Street 42',
    companyName: 'SoftLake Co',
    gender: 'M',
  }));

  // 持久化存储属性控制
  const storageKey = 'use-storage-demo'
  const [columnsState, setColumnsState] = useState<ColumnState[]>(JSON.parse(localStorage.getItem(storageKey) || '[]'))
  
  const [useStorage, setUseStorage] = useState(columnsState.length > 0)

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange: setState } = useConfigActions(useStorage ? {resizableColumns: true, sortableColumns: true} : {})

  const clear = () => {
    setColumnsState([])
    localStorage.removeItem(storageKey)
    setUseStorage(false)
  }

  return (
    <>
      <ConfigActions value={state} onChange={setState} />
      <Flex align="center" style={{marginBottom: 20}}>
        <Checkbox 
          checked={useStorage} 
          disabled={useStorage} 
          onChange={({target}) => {
            if(!useStorage) {
              setState((prevData) => Array.from(new Set([...prevData, 'resizableColumns', 'sortableColumns'])) as any[] )
              setUseStorage(target.checked)
            }
          }}
        >
          useStorage（配置持久化）
        </Checkbox>
        <Tooltip title="清除持久化数据">
          <Button size="small" onClick={clear}>清除</Button>
        </Tooltip>
      </Flex>
      <Table 
        {...baseProps}
        // 持久化存储
        columnsConfig={{
          useStorage,
          columnsState,
          onChange(value) {
            localStorage.setItem(storageKey, JSON.stringify(value))
          },
        }}
        columns={columns} 
        dataSource={dataSource} 
        sticky
        scrollY={1000}
        size='middle'
      />
    </>
  );
};
