import { Form, Input, Space } from 'antd';
import { Table } from 'rc-grid-table';
import { ColumnType, ColumnsType } from 'rc-grid-table/es/table/interface';
import React, { forwardRef, useState } from 'react';
import ConfigActions from './_utils/components/ConfigActions';
import useConfigActions from './_utils/hooks/useConfigActions';

interface DataType {
  key: React.Key;
  name: string;
  role: string;
  department: string;
  address: string;
}

type EditableDataIndex = keyof Pick<DataType, 'name' | 'role' | 'department'>;

type EditableColumn = ColumnType<DataType> & {
  editable?: boolean;
  dataIndex?: keyof DataType;
};

type EditableCellProps = React.HTMLAttributes<HTMLDivElement> & {
  editable?: boolean;
  dataIndex?: EditableDataIndex;
  record?: DataType;
  title?: React.ReactNode;
  onSave?: (record: DataType) => void;
};

const EditableCell = forwardRef<HTMLDivElement, EditableCellProps>(
  (
    { children, editable, dataIndex, record, title, onSave, ...restProps },
    ref,
  ) => {
    const [form] = Form.useForm();
    const [editing, setEditing] = useState(false);

    const startEdit = () => {
      if (!editable || !dataIndex || !record) return;

      form.setFieldsValue({
        [dataIndex]: record[dataIndex],
      });
      setEditing(true);
    };

    const save = async () => {
      if (!record) return;

      try {
        const values = await form.validateFields();
        setEditing(false);
        onSave?.({
          ...record,
          ...values,
        });
      } catch {
        // Keep editing when validation fails.
      }
    };

    let childNode = children;

    if (editable && dataIndex && record) {
      childNode = editing ? (
        <Form form={form} component={false}>
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `${title || dataIndex} is required.`,
              },
            ]}
          >
            <Input autoFocus onBlur={save} onPressEnter={save} />
          </Form.Item>
        </Form>
      ) : (
        <div
          role="button"
          tabIndex={0}
          style={{ minHeight: 22, cursor: 'text' }}
          onClick={startEdit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              startEdit();
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
    key: '1',
    name: 'John Brown',
    role: 'Manager',
    department: 'Operations',
    address: 'New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Jim Green',
    role: 'Specialist',
    department: 'Product',
    address: 'London No. 1 Lake Park',
  },
  {
    key: '3',
    name: 'Joe Black',
    role: 'Designer',
    department: 'Design',
    address: 'Sydney No. 1 Lake Park',
  },
];

const App: React.FC = () => {
  const [dataSource, setDataSource] = useState(initialData);

  const handleSave = (record: DataType) => {
    setDataSource((current) =>
      current.map((item) => (item.key === record.key ? record : item)),
    );
  };

  const columns: EditableColumn[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      editable: true,
      fixed: 'start',
      width: 180,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      editable: true,
      width: 160,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      editable: true,
      width: 180,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 260,
    },
  ];

  const mergedColumns: ColumnsType<DataType> = columns.map((column) => {
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
          onSave: handleSave,
        } as React.HTMLAttributes<any>),
    };
  });

  // 动态控制 bordered、stripe、resizableColumns、sortableColumns 属性
  const { baseProps, state, onChange } = useConfigActions({ bordered: true });

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <ConfigActions value={state} onChange={onChange} />
      <Table
        {...baseProps}
        columns={mergedColumns}
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        dataSource={dataSource}
        rowSortable={{
          fixed: 'start',
          onChange: setDataSource,
        }}
      />
    </Space>
  );
};

export default App;
