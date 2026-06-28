import React, {
  FC,
  KeyboardEvent,
  MouseEvent,
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

  const handleClick = (
    event: MouseEvent<HTMLElement, globalThis.MouseEvent>,
  ) => {
    event.stopPropagation();
  };

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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
      >
        {dataSortControl}
      </div>
    </>
  );
};
