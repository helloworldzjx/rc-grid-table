import {
  ConfigProvider as AntdConfigProvider,
  Radio as AntdRadio,
  RadioChangeEvent,
} from 'antd';
import classNames from 'classnames';
import React, {
  FC,
  KeyboardEvent,
  PointerEvent,
  PointerEventHandler,
  useMemo,
} from 'react';

import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import type { SelectionRadioControlProps } from '../interface';
import { getComponentCls } from '../style/classNames';

type RadioProps = SelectionRadioControlProps & {
  onChange?: (event: RadioChangeEvent) => void;
  onPointerDown?: PointerEventHandler<HTMLElement>;
};

const Radio: FC<RadioProps> = ({
  checked = false,
  disabled,
  onKeyDown,
  onPointerDown,
  ...rest
}) => {
  const prefixCls = usePrefixClsContext();
  const { componentDisabled } = AntdConfigProvider.useConfig();
  const mergedDisabled = disabled ?? componentDisabled;

  const { selectionControlCls, selectionControlDisabledCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    if (mergedDisabled) return;
    onKeyDown?.(event);
  };

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    onPointerDown?.(event);
  };

  return (
    <span
      className={classNames(selectionControlCls, {
        [selectionControlDisabledCls]: mergedDisabled,
      })}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      <AntdRadio
        prefixCls={`${prefixCls}-radio`}
        checked={checked}
        disabled={mergedDisabled}
        {...rest}
      />
    </span>
  );
};

export default Radio;
