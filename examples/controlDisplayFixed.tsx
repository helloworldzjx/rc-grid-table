import type { MenuProps } from 'antd';
import {
  Button,
  Checkbox,
  Dropdown,
  Flex,
  Segmented,
  Tooltip,
  Typography,
} from 'antd';
import { Table } from 'rc-grid-table';
import type {
  ColumnFixedInsertPosition,
  ColumnInfo,
  ColumnState,
  ColumnType,
  FixedType,
  SizeType,
  TableRef,
} from 'rc-grid-table/es/table/interface';
import type { Key } from 'react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

type BusinessColumn = Omit<ColumnType<DataType>, 'children' | 'key'> & {
  key: Key;
  children?: BusinessColumn[];
};

const storageKey = 'use-local-column-storage-demo';

type ColumnMapItem = {
  key: Key;
  title: string;
  dataIndex?: keyof DataType;
};

const columnMap = {
  name: { key: 'name', title: 'Name' },
  firstName: {
    key: 'firstName',
    dataIndex: 'firstName',
    title: 'firstName',
  },
  lastName: {
    key: 'lastName',
    dataIndex: 'lastName',
    title: 'lastName',
  },
  other: { key: 'other', title: 'Other' },
  age: { key: 'age', dataIndex: 'age', title: 'Age' },
  address: { key: 'address', title: 'Address' },
  street: { key: 'street', dataIndex: 'street', title: 'Street' },
  block: { key: 'block', title: 'Block' },
  building: {
    key: 'building',
    dataIndex: 'building',
    title: 'Building',
  },
  number: { key: 'number', dataIndex: 'number', title: 'Door No.' },
  company: { key: 'company', title: 'Company' },
  companyAddress: {
    key: 'companyAddress',
    dataIndex: 'companyAddress',
    title: 'Company Address',
  },
  companyName: {
    key: 'companyName',
    dataIndex: 'companyName',
    title: 'Company Name',
  },
  gender: { key: 'gender', dataIndex: 'gender', title: 'Gender' },
} satisfies Record<string, ColumnMapItem>;

const parseStorageColumnsState = () => {
  const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
  return Array.isArray(value) ? (value as ColumnState<DataType>[]) : [];
};

const columns: BusinessColumn[] = [
  {
    ...columnMap.name,
    fixed: 'start',
    children: [
      {
        ...columnMap.firstName,
        fixed: 'start',
        width: 120,
      },
      {
        ...columnMap.lastName,
        fixed: 'start',
        width: 120,
      },
    ],
  },
  {
    ...columnMap.other,
    children: [
      {
        ...columnMap.age,
        width: 100,
      },
      {
        ...columnMap.address,
        children: [
          {
            ...columnMap.street,
            width: 150,
          },
          {
            ...columnMap.block,
            children: [
              {
                ...columnMap.building,
                width: 100,
              },
              {
                ...columnMap.number,
                width: 100,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    ...columnMap.company,
    children: [
      {
        ...columnMap.companyAddress,
        width: 240,
      },
      {
        ...columnMap.companyName,
        width: 240,
      },
    ],
  },
  {
    ...columnMap.gender,
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

const persistColumnsState = (value: ColumnState<DataType>[]) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
};

const getStorageColumnsState = () => parseStorageColumnsState();

const collectLeafKeys = (tree: ColumnState<DataType>[], result: Key[] = []) => {
  tree.forEach((column) => {
    if (column.children?.length) {
      collectLeafKeys(column.children, result);
      return;
    }

    result.push(column.key);
  });

  return result;
};

const flattenColumnStates = (
  tree: ColumnState<DataType>[],
  result: ColumnState<DataType>[] = [],
) => {
  tree.forEach((column) => {
    result.push(column);

    if (column.children?.length) {
      flattenColumnStates(column.children, result);
    }
  });

  return result;
};

const getCheckedLeafKeys = (tree: ColumnState<DataType>[]) => {
  const checkedKeys: Key[] = [];

  const traverse = (columnsState: ColumnState<DataType>[]) => {
    columnsState.forEach((column) => {
      if (column.children?.length) {
        traverse(column.children);
        return;
      }

      if (column.visible !== false) checkedKeys.push(column.key);
    });
  };

  traverse(tree);
  return checkedKeys;
};

const getColumnTitle = (column: ColumnInfo<DataType>) => {
  return column.columnOverlayTitle || column.title || String(column.key);
};

const getColumnFixedTargetKey = (column: ColumnInfo<DataType>) => {
  return column.ancestorKeys[0] ?? column.key;
};

const collectColumnLeafKeys = (column: ColumnInfo<DataType>): Key[] => {
  if (!column.children?.length) return [column.key];

  return column.children.flatMap((child) => collectColumnLeafKeys(child));
};

export default () => {
  const tableRef = useRef<TableRef>(null);
  const [size, setSize] = useState<SizeType>('large');
  const [previewing, setPreviewing] = useState(false);
  const [columnsStateKey, setColumnsStateKey] = useState(0);
  const [storageColumnsState, setStorageColumnsState] = useState<
    ColumnState<DataType>[]
  >(getStorageColumnsState);
  const [storageEnabled, setStorageEnabled] = useState(
    () => getStorageColumnsState().length > 0,
  );
  const [contextColumn, setContextColumn] = useState<ColumnInfo<DataType>>();
  const [columnsState, setColumnsState] = useState<ColumnState<DataType>[]>([]);
  const {
    baseProps,
    state,
    onChange: setState,
  } = useConfigActions(
    storageEnabled
      ? {
          resizableColumns: true,
          sortableColumns: true,
        }
      : {},
  );

  const leafKeys = useMemo(() => collectLeafKeys(columnsState), [columnsState]);
  const checkedLeafKeys = useMemo(
    () => getCheckedLeafKeys(columnsState),
    [columnsState],
  );
  const checkedKeySet = useMemo(
    () => new Set(checkedLeafKeys),
    [checkedLeafKeys],
  );
  const columnsStateMap = useMemo(() => {
    return new Map(
      flattenColumnStates(columnsState).map((column) => [column.key, column]),
    );
  }, [columnsState]);
  const contextColumnTitle = contextColumn
    ? getColumnTitle(contextColumn)
    : undefined;
  const contextColumnLeafKeys = useMemo(
    () => (contextColumn ? collectColumnLeafKeys(contextColumn) : []),
    [contextColumn],
  );
  const contextColumnFixedTargetKey = contextColumn
    ? getColumnFixedTargetKey(contextColumn)
    : undefined;
  const contextFixedTargetState =
    contextColumnFixedTargetKey !== undefined
      ? columnsStateMap.get(contextColumnFixedTargetKey)
      : undefined;
  const contextColumnSavedVisibleCount = contextColumnLeafKeys.filter((key) =>
    checkedKeySet.has(key),
  ).length;
  const contextColumnRuntimeVisible =
    contextColumn?.visible ?? contextColumnSavedVisibleCount > 0;
  const contextColumnVisible = previewing
    ? contextColumnRuntimeVisible
    : contextColumnSavedVisibleCount > 0;
  const contextColumnFixed = previewing
    ? contextColumn?.fixed
    : contextFixedTargetState?.fixed || contextColumn?.fixed || undefined;
  const contextColumnInPreviewHotZone = !!(
    contextColumn?.previewHidden || contextColumn?.previewRestored
  );
  const contextColumnHideDisabled =
    (previewing && !contextColumnInPreviewHotZone) ||
    (contextColumnVisible &&
      checkedLeafKeys.length <= contextColumnSavedVisibleCount);

  const updateColumnsState = (value: ColumnState<DataType>[]) => {
    setColumnsState(value);
    setStorageColumnsState(value);
    if (storageEnabled) {
      persistColumnsState(value);
    }
  };

  const clear = () => {
    setColumnsState([]);
    setStorageColumnsState([]);
    tableRef.current?.cancelColumnsStatePreview();
    setPreviewing(false);
    setStorageEnabled(false);
    setColumnsStateKey((key) => key + 1);
    localStorage.removeItem(storageKey);
  };

  const openContextMenu = useCallback((column: ColumnInfo<DataType>) => {
    setContextColumn(column);
  }, []);

  const clearContextColumn = useCallback(() => {
    setContextColumn(undefined);
  }, []);

  useEffect(() => {
    return () => {
      tableRef.current?.cancelColumnsStatePreview();
    };
  }, []);

  const setContextColumnVisible = (visible: boolean) => {
    if (!contextColumn) return;
    if (!visible && contextColumnHideDisabled) return;

    tableRef.current?.setColumnVisible(contextColumn.key, visible);
    clearContextColumn();
  };

  const setColumnFixed = (
    fixed: FixedType | false,
    insertPosition: ColumnFixedInsertPosition = 'last',
  ) => {
    if (contextColumnFixedTargetKey === undefined) return;

    tableRef.current?.setColumnFixed(contextColumnFixedTargetKey, fixed, {
      insertPosition,
    });
    clearContextColumn();
  };

  const contextMenuItems = useMemo<MenuProps['items']>(() => {
    if (!contextColumn) return [];

    const items: NonNullable<MenuProps['items']> = [
      {
        key: 'column-title',
        disabled: true,
        style: {
          cursor: 'text',
        },
        label: <Typography.Text strong>{contextColumnTitle}</Typography.Text>,
      },
    ];

    items.push(
      { type: 'divider' },
      {
        key: 'fix-start',
        label: `固定到左侧`,
        disabled: previewing,
        children: [
          {
            key: 'fix-start-first',
            label: '左固定列第一个',
          },
          {
            key: 'fix-start-last',
            label: '左固定列最后一个',
          },
        ],
      },
      {
        key: 'fix-end',
        label: `固定到右侧`,
        disabled: previewing,
        children: [
          {
            key: 'fix-end-first',
            label: '右固定列第一个',
          },
          {
            key: 'fix-end-last',
            label: '右固定列最后一个',
          },
        ],
      },
      {
        key: 'unfix',
        label: '取消固定',
        disabled: previewing || !contextColumnFixed,
        children: [
          {
            key: 'unfix-first',
            label: '非固定列第一个',
          },
          {
            key: 'unfix-last',
            label: '非固定列最后一个',
          },
        ],
      },
      { type: 'divider' },
      {
        key: contextColumnVisible ? 'hide-current' : 'show-current',
        label: contextColumnVisible ? '隐藏当前列' : '显示当前列',
        disabled: contextColumnHideDisabled,
      },
      {
        key: 'preview-hidden',
        label: previewing ? '保存隐藏列' : '查看隐藏列',
        disabled: previewing
          ? false
          : checkedLeafKeys.length >= leafKeys.length,
      },
      {
        key: 'cancel-preview-hidden',
        label: '取消预览',
        disabled: !previewing,
      },
      { type: 'divider' },
      {
        key: 'visible-count',
        disabled: true,
        style: {
          cursor: 'text',
        },
        label: (
          <Typography.Text type="secondary">
            已显示 {checkedLeafKeys.length}/{leafKeys.length}
          </Typography.Text>
        ),
      },
    );

    return items;
  }, [
    checkedLeafKeys.length,
    contextColumnHideDisabled,
    contextColumn,
    contextColumnFixed,
    contextColumnTitle,
    contextColumnVisible,
    leafKeys.length,
    previewing,
  ]);

  const onContextMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!contextColumn) return;

    if (key === 'fix-start-first') {
      setColumnFixed('start', 'first');
      return;
    }
    if (key === 'fix-start-last') {
      setColumnFixed('start', 'last');
      return;
    }
    if (key === 'fix-end-first') {
      setColumnFixed('end', 'first');
      return;
    }
    if (key === 'fix-end-last') {
      setColumnFixed('end', 'last');
      return;
    }
    if (key === 'unfix-first') {
      setColumnFixed(false, 'first');
      return;
    }
    if (key === 'unfix-last') {
      setColumnFixed(false, 'last');
      return;
    }
    if (key === 'hide-current') {
      setContextColumnVisible(false);
      return;
    }
    if (key === 'show-current') {
      setContextColumnVisible(true);
      return;
    }
    if (key === 'preview-hidden') {
      if (previewing) {
        tableRef.current?.saveColumnsStatePreview();
        setPreviewing(false);
      } else if (
        tableRef.current?.startColumnsStatePreview({
          mode: 'visibleHotOnly',
        })
      ) {
        setPreviewing(true);
      }
      clearContextColumn();
      return;
    }
    if (key === 'cancel-preview-hidden') {
      tableRef.current?.cancelColumnsStatePreview();
      setPreviewing(false);
      clearContextColumn();
      return;
    }
  };

  const headerDropdownPropsRef = useRef<{
    items: MenuProps['items'];
    onClick: MenuProps['onClick'];
  }>({
    items: [],
    onClick: undefined,
  });

  headerDropdownPropsRef.current = {
    items: contextMenuItems,
    onClick: onContextMenuClick,
  };

  const HeaderWrapper = useMemo(() => {
    const Component = React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >(({ children, ...restProps }, ref) => {
      const dropdownProps = headerDropdownPropsRef.current;

      return (
        <Dropdown
          menu={{
            items: dropdownProps.items,
            onClick: dropdownProps.onClick,
          }}
          trigger={['contextMenu']}
        >
          <div {...restProps} ref={ref}>
            {children}
          </div>
        </Dropdown>
      );
    });

    return Component;
  }, []);

  const HeaderFilterRow = useMemo(() => {
    const Component = React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >(({ children, onContextMenu, ...restProps }, ref) => (
      <div
        {...restProps}
        ref={ref}
        onContextMenu={(event) => {
          event.stopPropagation();
          onContextMenu?.(event);
        }}
      >
        {children}
      </div>
    ));

    return Component;
  }, []);

  const components = useMemo(
    () => ({
      header: {
        wrapper: HeaderWrapper,
        filterRow: HeaderFilterRow,
      },
    }),
    [HeaderFilterRow, HeaderWrapper],
  );

  return (
    <>
      <ConfigActions value={state} onChange={setState} />
      <Flex align="center" gap={8} wrap="wrap" style={{ marginBottom: 20 }}>
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
              setStorageColumnsState(columnsState);
              tableRef.current?.cancelColumnsStatePreview();
              setPreviewing(false);
              setColumnsStateKey((key) => key + 1);
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
        <Typography.Text style={{ marginLeft: 16 }}>Size</Typography.Text>
        <Segmented<SizeType>
          options={['small', 'middle', 'large']}
          value={size}
          onChange={setSize}
        />
      </Flex>
      <Table
        ref={tableRef}
        {...baseProps}
        fixableColumns
        visibleColumns
        columnsConfig={{
          storageColumnsState: storageEnabled ? storageColumnsState : [],
          columnsStateKey,
          onColumnsStateReady({ columnsState }) {
            setColumnsState(columnsState);
          },
          onColumnsStateChange(value) {
            updateColumnsState(value);
          },
        }}
        columns={columns}
        onHeaderCell={(column) => ({
          onContextMenu: () => openContextMenu(column),
        })}
        dataSource={dataSource}
        rowSelection={{ fixed: 'start', columnOverlayTitle: '选择列' }}
        sticky={{ offsetHeader: 76 }}
        scrollY={500}
        size={size}
        components={components}
      />
    </>
  );
};
