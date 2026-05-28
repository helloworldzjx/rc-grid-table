import {
  Key,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { isValidKey } from '../../_utils/validate';
import type {
  RowKey,
  TableProps,
  TableSelectionContextProps,
} from '../interface';
import { getRecordChildren, getRecordKey } from '../utils/expand';
import { warningInvalidRecordKey } from '../utils/warning';

interface UseSelectionProps<T = any> {
  rowKey: RowKey<T>;
  dataSource: T[];
  rowSelection?: TableProps<T>['rowSelection'];
  childrenColumnName?: string;
}

const uniqKeys = (keys: Key[]) => Array.from(new Set(keys));

function useSelection<T = any>({
  rowKey,
  dataSource,
  rowSelection,
  childrenColumnName = 'children',
}: UseSelectionProps<T>): TableSelectionContextProps<T> | undefined {
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>(
    () => {
      const initialKeys =
        rowSelection?.selectedRowKeys ??
        rowSelection?.defaultSelectedRowKeys ??
        [];
      return rowSelection?.type === 'radio'
        ? initialKeys.slice(0, 1)
        : initialKeys;
    },
  );

  useEffect(() => {
    if (!rowSelection) {
      setInnerSelectedRowKeys([]);
    }
  }, [rowSelection]);

  const type = rowSelection?.type ?? 'checkbox';
  const checkStrictly = rowSelection?.checkStrictly ?? true;
  const selectAllMode = rowSelection?.selectAllMode ?? 'all';
  const controlled = !!rowSelection && 'selectedRowKeys' in rowSelection;
  const selectedRowKeys = useMemo(() => {
    const keys = controlled
      ? rowSelection?.selectedRowKeys ?? []
      : innerSelectedRowKeys;
    return type === 'radio' ? keys.slice(0, 1) : keys;
  }, [controlled, innerSelectedRowKeys, rowSelection?.selectedRowKeys, type]);

  const recordEntities = useMemo(() => {
    const keyRecordMap = new Map<Key, T>();
    const keyChildrenMap = new Map<Key, Key[]>();
    const keyParentMap = new Map<Key, Key>();
    const keyDisabledMap = new Map<Key, boolean>();
    const allKeys: Key[] = [];

    const traverse = (records: T[], parentKey?: Key) => {
      records.forEach((record) => {
        const key = getRecordKey(record, rowKey);
        if (!isValidKey(key)) {
          warningInvalidRecordKey(rowKey, 'row selection', key);
          return;
        }
        const children = getRecordChildren(record, childrenColumnName);
        allKeys.push(key);
        keyRecordMap.set(key, record);
        if (parentKey !== undefined) {
          keyParentMap.set(key, parentKey);
        }
        keyDisabledMap.set(
          key,
          !!rowSelection?.getCheckboxProps?.(record)?.disabled,
        );
        keyChildrenMap.set(
          key,
          children
            .map((child) => getRecordKey(child, rowKey))
            .filter(isValidKey),
        );
        if (children.length) {
          traverse(children, key);
        }
      });
    };

    traverse(dataSource);

    return {
      allKeys,
      keyRecordMap,
      keyChildrenMap,
      keyParentMap,
      keyDisabledMap,
    };
  }, [childrenColumnName, dataSource, rowKey, rowSelection]);

  const getSelectedRows = useCallback(
    (keys: Key[]) => {
      const keySet = new Set(keys);
      return recordEntities.allKeys.reduce((rows: T[], key) => {
        const record = recordEntities.keyRecordMap.get(key);
        if (keySet.has(key) && record) {
          rows.push(record);
        }
        return rows;
      }, []);
    },
    [recordEntities],
  );

  const updateSelectedKeys = useCallback(
    (keys: Key[], infoType: 'single' | 'all' | 'none') => {
      const nextKeys = type === 'radio' ? keys.slice(0, 1) : uniqKeys(keys);
      if (!controlled) {
        setInnerSelectedRowKeys(nextKeys);
      }
      rowSelection?.onChange?.(nextKeys, getSelectedRows(nextKeys), {
        type: infoType,
      });
      return nextKeys;
    },
    [controlled, getSelectedRows, rowSelection, type],
  );

  const collectDescendantKeys = useCallback(
    (key: Key): Key[] => {
      const children = recordEntities.keyChildrenMap.get(key) || [];
      return children.reduce((keys: Key[], childKey) => {
        keys.push(childKey, ...collectDescendantKeys(childKey));
        return keys;
      }, []);
    },
    [recordEntities.keyChildrenMap],
  );

  const selectedKeySet = useMemo(() => {
    if (type !== 'checkbox' || checkStrictly) {
      return new Set(selectedRowKeys);
    }

    const nextKeySet = new Set(selectedRowKeys);
    selectedRowKeys.forEach((key) => {
      collectDescendantKeys(key).forEach((descendantKey) =>
        nextKeySet.add(descendantKey),
      );
    });
    return nextKeySet;
  }, [checkStrictly, collectDescendantKeys, selectedRowKeys, type]);

  const conductSelect = useCallback(
    (record: T, selected: boolean) => {
      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row selection', key);
        return selectedRowKeys;
      }
      const targetKeys = checkStrictly
        ? [key]
        : [key, ...collectDescendantKeys(key)];
      const nextKeySet = new Set(selectedRowKeys);

      targetKeys.forEach((targetKey) => {
        if (selected) {
          nextKeySet.add(targetKey);
        } else {
          nextKeySet.delete(targetKey);
        }
      });

      if (!checkStrictly) {
        let parentKey = recordEntities.keyParentMap.get(key);
        while (parentKey !== undefined) {
          const descendantKeys = collectDescendantKeys(parentKey);
          if (
            descendantKeys.length &&
            descendantKeys.every((descendantKey) =>
              nextKeySet.has(descendantKey),
            )
          ) {
            nextKeySet.add(parentKey);
          } else {
            nextKeySet.delete(parentKey);
          }
          parentKey = recordEntities.keyParentMap.get(parentKey);
        }
      }

      return Array.from(nextKeySet);
    },
    [
      checkStrictly,
      collectDescendantKeys,
      recordEntities.keyParentMap,
      rowKey,
      selectedRowKeys,
    ],
  );

  const isSelected = useCallback(
    (record: T) => {
      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row selection', key);
        return false;
      }
      if (selectedKeySet.has(key)) {
        return true;
      }
      if (type === 'checkbox' && !checkStrictly) {
        const descendantKeys = collectDescendantKeys(key);
        return (
          descendantKeys.length > 0 &&
          descendantKeys.every((descendantKey) =>
            selectedKeySet.has(descendantKey),
          )
        );
      }
      return false;
    },
    [checkStrictly, collectDescendantKeys, rowKey, selectedKeySet, type],
  );

  const isHalfSelected = useCallback(
    (record: T): boolean => {
      if (type === 'radio' || checkStrictly) {
        return false;
      }

      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row selection', key);
        return false;
      }
      const descendantKeys = collectDescendantKeys(key);
      if (!descendantKeys.length) {
        return false;
      }

      if (isSelected(record)) {
        return false;
      }

      return descendantKeys.some((descendantKey) =>
        selectedKeySet.has(descendantKey),
      );
    },
    [
      checkStrictly,
      collectDescendantKeys,
      isSelected,
      rowKey,
      selectedKeySet,
      type,
    ],
  );

  const enabledKeys = useMemo(() => {
    if (type === 'radio') {
      return [];
    }

    return recordEntities.allKeys.filter((key) => {
      return selectAllMode === 'all' || !recordEntities.keyDisabledMap.get(key);
    });
  }, [
    recordEntities.allKeys,
    recordEntities.keyDisabledMap,
    selectAllMode,
    type,
  ]);

  const isAllSelected = useMemo(() => {
    return (
      type === 'checkbox' &&
      enabledKeys.length > 0 &&
      enabledKeys.every((key) => selectedKeySet.has(key))
    );
  }, [enabledKeys, selectedKeySet, type]);

  const isPartiallySelected = useMemo(() => {
    return (
      type === 'checkbox' &&
      !isAllSelected &&
      enabledKeys.some((key) => selectedKeySet.has(key))
    );
  }, [enabledKeys, isAllSelected, selectedKeySet, type]);

  const onSelectRecord = useCallback(
    (record: T, rowIndex: number, nativeEvent: MouseEvent<HTMLElement>) => {
      const key = getRecordKey(record, rowKey);
      if (!isValidKey(key)) {
        warningInvalidRecordKey(rowKey, 'row selection', key);
        return;
      }
      const disabled =
        type === 'radio'
          ? !!rowSelection?.getRadioProps?.(record)?.disabled
          : !!rowSelection?.getCheckboxProps?.(record)?.disabled;

      if (disabled) {
        return;
      }

      if (type === 'radio' && selectedKeySet.has(key)) {
        return;
      }

      const selected = !selectedKeySet.has(key);
      const nextKeys =
        type === 'radio'
          ? selected
            ? [key]
            : selectedRowKeys
          : conductSelect(record, selected);
      const mergedKeys = updateSelectedKeys(nextKeys, 'single');
      rowSelection?.onSelect?.(
        record,
        selected,
        getSelectedRows(mergedKeys),
        nativeEvent,
      );
    },
    [
      conductSelect,
      getSelectedRows,
      rowKey,
      rowSelection,
      selectedKeySet,
      selectedRowKeys,
      type,
      updateSelectedKeys,
    ],
  );

  const onSelectAll = useCallback(
    (nativeEvent: MouseEvent<HTMLElement>) => {
      nativeEvent.stopPropagation();
      if (type !== 'checkbox') {
        return;
      }
      if (!enabledKeys.length) {
        return;
      }

      if (isAllSelected) {
        const targetKeySet = new Set(enabledKeys);
        const nextKeys =
          selectAllMode === 'enabled'
            ? selectedRowKeys.filter((key) => !targetKeySet.has(key))
            : [];
        updateSelectedKeys(nextKeys, 'none');
      } else {
        const nextKeys =
          selectAllMode === 'enabled'
            ? uniqKeys([...selectedRowKeys, ...enabledKeys])
            : enabledKeys;
        updateSelectedKeys(nextKeys, 'all');
      }
    },
    [
      enabledKeys,
      isAllSelected,
      selectedRowKeys,
      selectAllMode,
      type,
      updateSelectedKeys,
    ],
  );

  if (!rowSelection) {
    return undefined;
  }

  return {
    selectedRowKeys,
    isSelected,
    isHalfSelected,
    isAllSelected,
    isPartiallySelected,
    onSelectRecord,
    onSelectAll,
  };
}

export default useSelection;
