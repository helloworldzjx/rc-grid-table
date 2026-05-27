import { Form, Input, InputNumber, Popconfirm, Space, Typography } from 'antd';
import { Table } from 'rc-grid-table';
import type { ColumnType, TableProps } from 'rc-grid-table/es/table/interface';
import React, { forwardRef, useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
}

type EditableInputType = 'number' | 'text';

type EditableDataIndex = keyof Pick<DataType, 'name' | 'age' | 'address'>;

type EditableColumn = ColumnType<DataType> & {
  editable?: boolean;
  dataIndex?: keyof DataType | 'operation';
};

interface EditableCellProps extends React.HTMLAttributes<HTMLDivElement> {
  editing?: boolean;
  dataIndex?: EditableDataIndex;
  inputType?: EditableInputType;
}

const originData = Array.from({ length: 30 }).map<DataType>((_, index) => ({
  key: index.toString(),
  name: `Edward ${index}`,
  age: 32,
  address: `London Park no. ${index}`,
}));

const EditableCell = forwardRef<HTMLDivElement, EditableCellProps>(
  (
    { editing, dataIndex, title, inputType = 'text', children, ...restProps },
    ref,
  ) => {
    const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;

    return (
      <div {...restProps} ref={ref}>
        {editing && dataIndex ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `Please Input ${title}!`,
              },
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </div>
    );
  },
);

const App: React.FC = () => {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<DataType[]>(originData);
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record: DataType) => record.key === editingKey;

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({ name: '', age: '', address: '', ...record });
    setEditingKey(record.key as string);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as DataType;
      const newData = [...dataSource];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
      } else {
        newData.push(row);
      }

      setDataSource(newData);
      setEditingKey('');
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns: EditableColumn[] = [
    {
      title: 'name',
      dataIndex: 'name',
      key: 'name',
      editable: true,
    },
    {
      title: 'age',
      dataIndex: 'age',
      key: 'age',
      editable: true,
    },
    {
      title: 'address',
      dataIndex: 'address',
      key: 'address',
      editable: true,
    },
    {
      title: 'operation',
      key: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);

        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.key)}
              style={{ marginInlineEnd: 8 }}
            >
              Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
          >
            Edit
          </Typography.Link>
        );
      },
    },
  ];

  const mergedColumns: TableProps<DataType>['columns'] = columns.map(
    (column) => {
      if (!column.editable) {
        return column;
      }

      return {
        ...column,
        onCell: (record) =>
          ({
            record,
            inputType: column.dataIndex === 'age' ? 'number' : 'text',
            dataIndex: column.dataIndex,
            title: column.title,
            editing: isEditing(record),
          } as React.HTMLAttributes<any>),
      };
    },
  );

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />
      <Form form={form} component={false}>
        <Table
          {...baseProps}
          columns={mergedColumns}
          components={{
            body: { cell: EditableCell },
          }}
          dataSource={dataSource}
          rowClassName={() => 'editable-row'}
          rowSortable={{
            fixed: 'start',
            onChange: setDataSource,
          }}
        />
      </Form>
    </Space>
  );
};

export default App;
