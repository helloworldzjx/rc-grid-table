import { Button, Checkbox, Flex, Segmented, Tooltip, Typography } from 'antd';
import { Table } from 'rc-grid-table';
import {
  ColumnState,
  ColumnsType,
  SizeType,
} from 'rc-grid-table/es/table/interface';
import React, { useState } from 'react';
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
      fixed: 'start',
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

  const [size, setSize] = useState<SizeType>('large');
  const storageKey = 'use-storage-demo';
  const [columnsState, setColumnsState] = useState<ColumnState[]>(
    JSON.parse(localStorage.getItem(storageKey) || '[]'),
  );
  const [storageEnabled, setStorageEnabled] = useState(columnsState.length > 0);
  const [columnsStateKey, setColumnsStateKey] = useState(0);

  const {
    baseProps,
    state,
    onChange: setState,
  } = useConfigActions(
    storageEnabled ? { resizableColumns: true, sortableColumns: true } : {},
  );

  const clear = () => {
    setColumnsState([]);
    localStorage.removeItem(storageKey);
    setStorageEnabled(false);
    setColumnsStateKey((key) => key + 1);
  };

  return (
    <>
      <ConfigActions value={state} onChange={setState} />
      <Flex align="center" style={{ marginBottom: 20 }}>
        <Checkbox
          checked={storageEnabled}
          disabled={storageEnabled}
          onChange={({ target }) => {
            if (!storageEnabled) {
              setState((prevData) =>
                Array.from(
                  new Set([
                    ...prevData,
                    'resizableColumns' as const,
                    'sortableColumns' as const,
                  ]),
                ),
              );
              setStorageEnabled(target.checked);
            }
          }}
        >
          使用持久化存储
        </Checkbox>
        <Tooltip title="清除持久化存储">
          <Button size="small" onClick={clear}>
            清除
          </Button>
        </Tooltip>

        <Typography.Text style={{ marginLeft: 50, marginRight: 10 }}>
          Size
        </Typography.Text>
        <Segmented<SizeType>
          options={['small', 'middle', 'large']}
          value={size}
          onChange={setSize}
        />
      </Flex>
      <Table
        {...baseProps}
        columnsConfig={{
          storageColumnsState: columnsState,
          columnsStateKey,
          onColumnsStateChange(value) {
            if (!storageEnabled) return;
            setColumnsState(value);
            localStorage.setItem(storageKey, JSON.stringify(value));
          },
        }}
        columns={columns}
        dataSource={dataSource}
        rowSelection={{ fixed: 'start' }}
        sticky={{ offsetHeader: 76 }}
        scrollY={500}
        size={size}
      />
    </>
  );
};
