import { Radio as AntdRadio, RadioChangeEvent } from 'antd';
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
  disabled = false,
  onKeyDown,
  onPointerDown,
  ...rest
}) => {
  const prefixCls = usePrefixClsContext();

  const { selectionControlCls, selectionControlDisabledCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    if (disabled) return;
    onKeyDown?.(event);
  };

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    onPointerDown?.(event);
  };

  return (
    <span
      className={classNames(selectionControlCls, {
        [selectionControlDisabledCls]: disabled,
      })}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      <AntdRadio
        prefixCls={`${prefixCls}-radio`}
        checked={checked}
        disabled={disabled}
        {...rest}
      />
    </span>
  );
};

export default Radio;
