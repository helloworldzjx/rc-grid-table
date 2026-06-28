import { Checkbox as AntdCheckbox, CheckboxChangeEvent } from 'antd';
import classNames from 'classnames';
import React, {
  FC,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  PointerEventHandler,
  useMemo,
} from 'react';

import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import type { SelectionCheckboxControlProps } from '../interface';
import { getComponentCls } from '../style/classNames';

type CheckboxProps = SelectionCheckboxControlProps & {
  onChange?: (event: CheckboxChangeEvent) => void;
  onPointerDown?: PointerEventHandler<HTMLElement>;
};

const Checkbox: FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  onClick,
  onKeyDown,
  onPointerDown,
  ...rest
}) => {
  const prefixCls = usePrefixClsContext();

  const { selectionControlCls, selectionControlDisabledCls } = useMemo(
    () => getComponentCls(prefixCls),
    [prefixCls],
  );

  const handleClick = (
    event: MouseEvent<HTMLElement, globalThis.MouseEvent>,
  ) => {
    event.stopPropagation();
    if (disabled) return;
    onClick?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    if (disabled) return;
    onKeyDown?.(event);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    onPointerDown?.(event);
  };

  return (
    // 当antd checkbox的父元素有事件行为时，antd checkbox在disabled时存在事件会冒泡(?)到父元素的现象，使用span包裹避免问题
    <span
      className={classNames(selectionControlCls, {
        [selectionControlDisabledCls]: disabled,
      })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      <AntdCheckbox
        prefixCls={`${prefixCls}-checkbox`}
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        {...rest}
      />
    </span>
  );
};

export default Checkbox;
