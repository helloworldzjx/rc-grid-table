import React, { useMemo } from 'react';

import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { useTableContext } from '../contexts/TableContext';
import { getComponentCls } from '../style/classNames';

interface UseLayoutExtraProps<T = any> {
  dataSource: T[];
}

const useLayoutExtra = <T = any,>({ dataSource }: UseLayoutExtraProps<T>) => {
  const { title, footer, pagination } = useTableContext();
  const prefixCls = usePrefixClsContext();
  const { containerCls, titleCls, footerCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const hasTitle = typeof title === 'function';
  const hasFooter = typeof footer === 'function';
  const hasPagination =
    pagination !== undefined && pagination !== null && pagination !== false;
  const showContainer = hasTitle || hasFooter;

  const TableContentWrapper = useMemo<React.ElementType>(
    () => (showContainer ? 'div' : React.Fragment),
    [showContainer],
  );
  const tableContentWrapperProps = useMemo<
    React.HTMLAttributes<HTMLDivElement>
  >(
    () => (showContainer ? { className: containerCls } : {}),
    [containerCls, showContainer],
  );

  const titleNode = useMemo(
    () =>
      hasTitle ? <div className={titleCls}>{title(dataSource)}</div> : null,
    [hasTitle, titleCls, title, dataSource],
  );

  const footerNode = useMemo(
    () =>
      hasFooter ? <div className={footerCls}>{footer(dataSource)}</div> : null,
    [hasFooter, footerCls, footer, dataSource],
  );

  const paginationNode = useMemo(
    () => (hasPagination ? pagination : null),
    [hasPagination, pagination],
  );

  return {
    hasTitle,
    hasFooter,
    titleNode,
    footerNode,
    paginationNode,
    TableContentWrapper,
    tableContentWrapperProps,
  };
};

export default useLayoutExtra;
