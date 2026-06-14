import warning from '@rc-component/util/lib/warning';
import classNames from 'classnames';
import React, { Key, useMemo } from 'react';

import { useExpandableContext } from '../contexts/ExpandableContext';
import { useTableContext } from '../contexts/TableContext';
import { warningInvalidRecordKey } from '../utils/warning';
import BodyRow from './BodyRow';
import ExpandedRow from './ExpandedRow';
import type { BodyItem as BodyItemData, BodyNodeRenderInfo } from './interface';

interface BodyItemRowSort<T = any> {
  activeKey: Key | null;
  getDragDisabled: (record: T, key?: Key) => boolean;
  getDropDisabled: (key?: Key) => boolean;
}

interface BodyItemProps<T = any> {
  item: BodyItemData<T>;
  renderInfo: BodyNodeRenderInfo<T>;
  rowHeight?: number;
  expandedRowHeight?: number;
  hasTreeData: boolean;
  rowSort: BodyItemRowSort<T>;
}

function BodyItem<T = any>({
  item,
  renderInfo,
  rowHeight,
  expandedRowHeight,
  hasTreeData,
  rowSort,
}: BodyItemProps<T>) {
  const {
    rowKey,
    rowClassName,
    flattenColumns = [],
    fixedOffset,
  } = useTableContext();
  const { expandable } = useExpandableContext<T>();

  const expandedNode = useMemo(
    () =>
      expandable?.expandedRowRender?.(
        item.record,
        item.rowIndex,
        item.indent,
        item.expanded,
      ),
    [item.record, item.rowIndex, item.indent, item.expanded],
  );

  if (item.type === 'expanded') {
    return (
      <ExpandedRow
        className={item.className}
        indent={1}
        style={renderInfo.style}
        rowHeight={expandedRowHeight}
        rowRef={renderInfo.rowRef}
        onRowResize={renderInfo.onRowResize}
        renderMode={renderInfo.renderMode}
      >
        {expandedNode}
      </ExpandedRow>
    );
  }

  const {
    record: rowData,
    rowIndex,
    indent,
    rowKeyValue: key,
    expanded,
    treeExpandable,
    rowExpandable,
    invalidRowKey,
  } = item;

  warning(
    !invalidRowKey,
    'Each record in table should have a unique row key, or set `rowKey` to a string field name or a function that returns a string or finite number.',
  );
  if (invalidRowKey) {
    warningInvalidRecordKey(rowKey, 'row rendering', key);
  }

  const dragDisabled = rowSort.getDragDisabled(rowData, key);
  const dropDisabled = rowSort.getDropDisabled(key);

  return (
    <BodyRow
      flattenColumns={renderInfo.columns?.flattenColumns ?? flattenColumns}
      fixedOffset={renderInfo.columns?.fixedOffset ?? fixedOffset}
      rowData={rowData}
      rowIndex={rowIndex}
      rowKeyValue={key}
      indent={indent}
      expanded={expanded}
      expandable={hasTreeData || treeExpandable}
      rowSupportExpand={rowExpandable}
      className={classNames(
        rowClassName?.(rowData, rowIndex),
        renderInfo.className,
      )}
      style={renderInfo.style}
      rowHeight={rowHeight}
      rowRef={renderInfo.rowRef}
      onRowResize={renderInfo.onRowResize}
      rowSortOverlay={renderInfo.rowSort?.overlay}
      renderMode={renderInfo.renderMode}
      getRowSpanHeight={renderInfo.rowSpan?.getHeight}
      rowSortDragDisabled={dragDisabled}
      rowSortDropDisabled={dropDisabled}
      rowSortDragging={rowSort.activeKey === key}
    />
  );
}

export default BodyItem;
