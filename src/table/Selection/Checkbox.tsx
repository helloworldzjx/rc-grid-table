import classNames from 'classnames';
import React, {
  FC,
  LabelHTMLAttributes,
  MouseEvent,
  PointerEvent,
  useMemo,
} from 'react';

import { usePrefixClsContext } from '../contexts/PrefixClsContext';
import { getComponentCls } from '../style/classNames';

type CheckboxProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> & {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (event: MouseEvent<HTMLElement>) => void;
};

const Checkbox: FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  className,
  children,
  onChange,
  onPointerDown,
  onMouseDown,
  ...rest
}) => {
  const prefixCls = usePrefixClsContext();

  const {
    selectionControlCls,
    selectionControlInputCls,
    selectionControlContentCls,
    selectionCheckboxCls,
    selectionControlCheckedCls,
    selectionControlIndeterminateCls,
    selectionControlDisabledCls,
  } = useMemo(() => getComponentCls(prefixCls), [prefixCls]);

  const handleClick = (event: MouseEvent<HTMLLabelElement>) => {
    event.stopPropagation();
    if (!disabled) {
      onChange?.(event);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLLabelElement>) => {
    event.stopPropagation();
    onPointerDown?.(event);
  };

  const handleMouseDown = (event: MouseEvent<HTMLLabelElement>) => {
    event.stopPropagation();
    onMouseDown?.(event);
  };

  const handleInputClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  return (
    <label
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      {...rest}
      className={classNames(
        selectionControlCls,
        selectionCheckboxCls,
        {
          [selectionControlCheckedCls]: checked,
          [selectionControlIndeterminateCls]: indeterminate,
          [selectionControlDisabledCls]: disabled,
        },
        className,
      )}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
    >
      <div className={selectionControlInputCls}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          readOnly
          tabIndex={-1}
          onClick={handleInputClick}
        />
      </div>
      {children && <div className={selectionControlContentCls}>{children}</div>}
    </label>
  );
};

export default Checkbox;
