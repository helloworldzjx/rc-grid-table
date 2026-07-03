import React, {
  FC,
  KeyboardEvent,
  PointerEvent,
  PropsWithChildren,
  ReactNode,
  useMemo,
} from 'react';

import { usePrefixClsContext } from '../contexts';
import { getComponentCls } from '../style/classNames';

interface DataSortControlProps {
  dataSortControl: ReactNode;
}

export const DataSortControl: FC<PropsWithChildren<DataSortControlProps>> = ({
  dataSortControl,
  children,
}) => {
  const prefixCls = usePrefixClsContext();

  const { dataSortContentCls, dataSortControlCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <>
      <div className={dataSortContentCls}>{children}</div>
      <div
        className={dataSortControlCls}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
      >
        {dataSortControl}
      </div>
    </>
  );
};
