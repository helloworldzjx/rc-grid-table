import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  type Modifier,
} from '@dnd-kit/core';
import type { Key } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { isNum, isValidKey } from '../../_utils/validate';
import type { BodyItem, BodyNodeRenderInfo } from '../Body/interface';
import type { RowKey, RowSortableConfig } from '../interface';
import type { InternalColumnState, StickyOffsets } from '../internalInterface';
import { getColumnMotionStartPositions } from '../utils/columnMotion';
import { isInternalColumn, isRowSortColumn } from '../utils/const';
import { dispatchDndPopupCloseEvent, isRowSortableData } from '../utils/dnd';
import {
  getRowSortEntities,
  reorderDataSource,
  type RowSortEntities,
} from '../utils/rowSortable';

interface UseTableRowSortProps<T = any> {
  bodyItems: BodyItem<T>[];
  dataSource?: T[];
  rowKey: RowKey<T>;
  childrenColumnName: string;
  rowSortable?: RowSortableConfig<T>;
  flattenColumns: InternalColumnState<T>[];
  bodyScrollLeft: number;
}

const isValidRowSortId = (key: Key | undefined): key is UniqueIdentifier =>
  isValidKey(key);

const isDescendantOrSelfPath = (
  parentPath: number[],
  maybeDescendantPath: number[],
) =>
  parentPath.length <= maybeDescendantPath.length &&
  parentPath.every((value, index) => value === maybeDescendantPath[index]);

const getColumnMatchKeys = (column: InternalColumnState) =>
  [column.key, column.dataIndex].filter(isValidKey);

const getRowSortOverlayColumns = <T>(
  columns: InternalColumnState<T>[],
  overlayColumnKeys?: readonly Key[],
) => {
  const rowSortColumn = columns.find(isRowSortColumn);
  const overlayBusinessColumns = overlayColumnKeys?.length
    ? columns.filter(
        (column) =>
          !isInternalColumn(column) &&
          getColumnMatchKeys(column).some((key) =>
            overlayColumnKeys.includes(key),
          ),
      )
    : columns.filter((column) => !isInternalColumn(column)).slice(0, 1);

  return [rowSortColumn, ...overlayBusinessColumns].filter(
    (column): column is InternalColumnState<T> => !!column,
  );
};

const getStaticOffset = (widths: readonly number[]): StickyOffsets => ({
  start: widths.map(() => 0),
  end: widths.map(() => 0),
  widths,
  hasFixColumns: false,
  hasFixStartColumns: false,
  hasFixEndColumns: false,
  fixColumnsGapped: false,
});

const emptyRowSortEntities: RowSortEntities<never> = new Map();

export default function useTableRowSort<T = any>({
  bodyItems,
  dataSource,
  rowKey,
  childrenColumnName,
  rowSortable,
  flattenColumns,
  bodyScrollLeft,
}: UseTableRowSortProps<T>) {
  const rowSortableEnabled = !!rowSortable;
  const allowCrossLevelSort = !!rowSortable?.allowCrossLevelSort;
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const activeDataRef = useRef<{
    key: Key;
    rowIndex: number;
  } | null>(null);
  const scrollLeftRef = useRef(0);

  if (activeDataRef.current === null) {
    scrollLeftRef.current = bodyScrollLeft;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  );

  const entities = useMemo(
    () =>
      rowSortableEnabled
        ? getRowSortEntities(dataSource, rowKey, childrenColumnName)
        : (emptyRowSortEntities as RowSortEntities<T>),
    [childrenColumnName, dataSource, rowKey, rowSortableEnabled],
  );

  const items = useMemo(() => {
    if (!rowSortableEnabled) {
      return [];
    }

    return bodyItems.reduce<UniqueIdentifier[]>((keys, item) => {
      if (item.type === 'row' && isValidRowSortId(item.rowKeyValue)) {
        keys.push(item.rowKeyValue);
      }
      return keys;
    }, []);
  }, [bodyItems, rowSortableEnabled]);

  const activeBodyItem = useMemo(() => {
    if (!isValidKey(activeKey)) {
      return null;
    }

    return (
      bodyItems.find(
        (item) => item.type === 'row' && item.rowKeyValue === activeKey,
      ) ?? null
    );
  }, [activeKey, bodyItems]);

  const preserveItemKey = useMemo(
    () => (isValidKey(activeKey) ? `row-${activeKey}` : null),
    [activeKey],
  );

  const getDropDisabled = useCallback(
    (key: Key | undefined) => {
      if (!rowSortable || !isValidKey(key)) {
        return true;
      }
      if (!isValidKey(activeKey) || key === activeKey) {
        return false;
      }
      const activeEntity = entities.get(activeKey);
      const overEntity = entities.get(key);
      if (!activeEntity || !overEntity) {
        return true;
      }

      if (allowCrossLevelSort) {
        return isDescendantOrSelfPath(
          [...activeEntity.parentPath, activeEntity.siblingIndex],
          overEntity.parentPath,
        );
      }

      return activeEntity.parentKey !== overEntity.parentKey;
    },
    [activeKey, allowCrossLevelSort, entities, rowSortable],
  );

  const getDragDisabled = useCallback(
    (record: T, key: Key | undefined) => {
      if (!rowSortable || !isValidKey(key)) {
        return true;
      }
      return rowSortable?.rowDraggable?.(record) === false;
    },
    [rowSortable],
  );

  const cleanup = useCallback(() => {
    document.documentElement.style.cursor = '';
    activeDataRef.current = null;
    scrollLeftRef.current = 0;
    setActiveKey(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (!isRowSortableData<T>(activeData) || !isValidKey(activeData.key)) {
      return;
    }

    activeDataRef.current = {
      key: activeData.key,
      rowIndex: activeData.rowIndex,
    };
    dispatchDndPopupCloseEvent(event.activatorEvent);
    document.documentElement.style.cursor = 'grabbing';
    setActiveKey(activeData.key);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeEventData = event.active.data.current;
      const activeDragData = isRowSortableData<T>(activeEventData)
        ? activeEventData
        : activeDataRef.current;
      const isRowSortEvent =
        isRowSortableData<T>(activeEventData) || activeDataRef.current !== null;

      if (!isRowSortEvent) {
        return;
      }

      try {
        if (!activeDragData || !isValidKey(activeDragData.key)) {
          return;
        }

        const overEventData = event.over?.data.current;
        const overDragData = isRowSortableData<T>(overEventData)
          ? overEventData
          : null;

        if (!overDragData || !isValidKey(overDragData.key)) {
          return;
        }

        const activeRowKey = activeDragData.key;
        const overKey = overDragData.key;
        if (activeRowKey !== overKey) {
          const placement =
            activeDragData.rowIndex > overDragData.rowIndex
              ? 'before'
              : 'after';
          const result = reorderDataSource({
            dataSource: dataSource || [],
            rowKey,
            childrenColumnName,
            activeKey: activeRowKey,
            overKey,
            placement,
            allowCrossLevelSort,
            entities,
          });

          if (result) {
            rowSortable?.onChange?.(result.dataSource, result.info);
          }
        }
      } finally {
        cleanup();
      }
    },
    [
      allowCrossLevelSort,
      childrenColumnName,
      cleanup,
      dataSource,
      entities,
      rowKey,
      rowSortable,
    ],
  );

  const overlayColumns = useMemo(
    () =>
      getRowSortOverlayColumns(
        flattenColumns,
        rowSortable?.overlayColumnKeys,
      ).map((column) => ({
        ...column,
        fixed: undefined,
      })),
    [flattenColumns, rowSortable?.overlayColumnKeys],
  );

  const overlayColumnsWidths = useMemo(
    () =>
      overlayColumns.map((column) => (isNum(column.width) ? column.width : 0)),
    [overlayColumns],
  );

  const overlayColumnsWidthTotal = useMemo(
    () => overlayColumnsWidths.reduce((total, width) => total + width, 0),
    [overlayColumnsWidths],
  );
  const overlayColumnMotionPositions = useMemo(
    () => getColumnMotionStartPositions(overlayColumnsWidths),
    [overlayColumnsWidths],
  );

  const overlayFixedOffset = useMemo(
    () => getStaticOffset(overlayColumnsWidths),
    [overlayColumnsWidths],
  );

  const scrollLeftOffsetModifiers = useMemo<Modifier[]>(
    () => [
      ({ transform }) => {
        const startScrollLeft = scrollLeftRef.current;

        if (!startScrollLeft) {
          return transform;
        }

        return {
          ...transform,
          x: transform.x + startScrollLeft,
        };
      },
    ],
    [],
  );

  const rowSortColumnFixed = useMemo(
    () => flattenColumns.find(isRowSortColumn)?.fixed,
    [flattenColumns],
  );

  const getOverlayModifiers = useCallback(
    (inVirtual: boolean) => {
      if (!inVirtual && rowSortColumnFixed) {
        return undefined;
      }

      return scrollLeftOffsetModifiers;
    },
    [rowSortColumnFixed, scrollLeftOffsetModifiers],
  );

  const getOverlayRenderInfo = useCallback(
    (inVirtual: boolean): BodyNodeRenderInfo<T> | undefined => {
      if (!activeBodyItem) {
        return undefined;
      }

      return {
        kind: 'rowSortOverlay',
        renderMode: inVirtual ? 'virtual' : 'normal',
        columns: {
          flattenColumns: overlayColumns,
          columnMotionPositions: overlayColumnMotionPositions,
          fixedOffset: overlayFixedOffset,
        },
        renderKey: `row-sort-overlay-${activeBodyItem.reactKey}`,
        style: {
          display: 'grid',
          gridTemplateColumns: overlayColumnsWidths
            .map((width) => `${width}px`)
            .join(' '),
          width: overlayColumnsWidthTotal,
        },
        rowSort: {
          overlay: true,
        },
      };
    },
    [
      activeBodyItem,
      overlayColumns,
      overlayColumnMotionPositions,
      overlayColumnsWidthTotal,
      overlayColumnsWidths,
      overlayFixedOffset,
    ],
  );

  const getRuntime = useCallback(
    (inVirtual: boolean) => ({
      overlayModifiers: getOverlayModifiers(inVirtual),
      overlayRenderInfo: getOverlayRenderInfo(inVirtual),
    }),
    [getOverlayModifiers, getOverlayRenderInfo],
  );

  return useMemo(
    () => ({
      activeKey,
      activeBodyItem,
      preserveItemKey,
      sensors,
      items,
      getDragDisabled,
      getDropDisabled,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragCancel: cleanup,
      getRuntime,
    }),
    [
      activeBodyItem,
      activeKey,
      cleanup,
      getDragDisabled,
      getDropDisabled,
      getRuntime,
      handleDragEnd,
      handleDragStart,
      items,
      preserveItemKey,
      sensors,
    ],
  );
}
