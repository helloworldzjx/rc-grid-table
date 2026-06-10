import type { GetRef, InputRef } from 'antd';
import { Button, Form, Input, Popconfirm, Space } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnType, ColumnsType } from 'rc-grid-table/es/table/interface';
import React, {
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface DataType {
  key: React.Key;
  name: string;
  age: string;
  address: string;
}

type EditableDataIndex = keyof Pick<DataType, 'name' | 'age' | 'address'>;

type EditableColumn = ColumnType<DataType> & {
  editable?: boolean;
  dataIndex?: EditableDataIndex | 'operation';
};

type EditableRowProps = React.HTMLAttributes<HTMLDivElement>;

const EditableRow = forwardRef<HTMLDivElement, EditableRowProps>(
  (props, ref) => {
    const [form] = Form.useForm();

    return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form}>
          <div {...props} ref={ref} />
        </EditableContext.Provider>
      </Form>
    );
  },
);

type EditableCellProps = React.HTMLAttributes<HTMLDivElement> & {
  editable?: boolean;
  dataIndex?: EditableDataIndex;
  record?: DataType;
  title?: React.ReactNode;
  handleSave?: (record: DataType) => void;
};

const EditableCell = forwardRef<HTMLDivElement, EditableCellProps>(
  (
    { children, editable, dataIndex, record, title, handleSave, ...restProps },
    ref,
  ) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const form = useContext(EditableContext)!;

    useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
      }
    }, [editing]);

    const toggleEdit = () => {
      if (!dataIndex || !record) return;

      setEditing(!editing);
      form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
      if (!record) return;

      try {
        const values = await form.validateFields();

        toggleEdit();
        handleSave?.({ ...record, ...values });
      } catch (errInfo) {
        console.log('Save failed:', errInfo);
      }
    };

    let childNode = children;

    if (editable && dataIndex && record) {
      childNode = editing ? (
        <Form.Item
          name={dataIndex}
          rules={[
            {
              required: true,
              message: `${title} is required.`,
            },
          ]}
          style={{ margin: 0 }}
        >
          <Input ref={inputRef} onBlur={save} onPressEnter={save} />
        </Form.Item>
      ) : (
        <div
          className="editable-cell-value-wrap"
          role="button"
          tabIndex={0}
          style={{ minHeight: 22, cursor: 'text', paddingInlineEnd: 24 }}
          onClick={toggleEdit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              toggleEdit();
            }
          }}
        >
          {children}
        </div>
      );
    }

    return (
      <div {...restProps} ref={ref}>
        {childNode}
      </div>
    );
  },
);

const initialData: DataType[] = [
  {
    key: '0',
    name: 'Edward King 0',
    age: '32',
    address: 'London, Park Lane no. 0',
  },
  {
    key: '1',
    name: 'Edward King 1',
    age: '32',
    address: 'London, Park Lane no. 1',
  },
];

const App: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>(initialData);
  const [count, setCount] = useState(2);

  const handleDelete = (key: React.Key) => {
    setDataSource((current) => current.filter((item) => item.key !== key));
  };

  const handleAdd = () => {
    const newData: DataType = {
      key: `${count}`,
      name: `Edward King ${count}`,
      age: '32',
      address: `London, Park Lane no. ${count}`,
    };

    setDataSource((current) => [...current, newData]);
    setCount(count + 1);
  };

  const handleSave = (row: DataType) => {
    setDataSource((current) => {
      const newData = [...current];
      const index = newData.findIndex((item) => row.key === item.key);
      const item = newData[index];

      newData.splice(index, 1, {
        ...item,
        ...row,
      });

      return newData;
    });
  };

  const defaultColumns: EditableColumn[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      editable: true,
      fixed: 'start',
      width: 180,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 120,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 260,
    },
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      width: 140,
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDelete(record.key)}
          >
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const mergedColumns: ColumnsType<DataType> = defaultColumns.map((column) => {
    if (!column.editable) {
      return column;
    }

    return {
      ...column,
      onCell: (record) =>
        ({
          record,
          editable: column.editable,
          dataIndex: column.dataIndex as EditableDataIndex,
          title: column.title,
          handleSave,
        } as React.HTMLAttributes<any>),
    };
  });

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />
      <Button onClick={handleAdd} type="primary">
        Add a row
      </Button>
      <Table
        {...baseProps}
        columns={mergedColumns}
        components={components}
        dataSource={dataSource}
        rowClassName={() => 'editable-row'}
        rowSortable={{
          fixed: 'start',
          onChange: (nextDataSource) => setDataSource(nextDataSource),
        }}
      />
    </Space>
  );
};

export default App;
