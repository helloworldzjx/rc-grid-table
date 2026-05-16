import React, { FC, LabelHTMLAttributes, MouseEvent } from "react";
import classNames from "classnames";

import { useStyles } from "../style";

type CheckboxProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> & {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (event: MouseEvent<HTMLElement>) => void;
}

const Checkbox: FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  className,
  children,
  onChange,
  ...rest
}) => {
  const {
    selectionControlCls,
    selectionControlInputCls,
    selectionControlContentCls,
    selectionCheckboxCls,
    selectionControlCheckedCls,
    selectionControlIndeterminateCls,
    selectionControlDisabledCls,
  } = useStyles();

  const handleClick = (event: MouseEvent<HTMLLabelElement>) => {
    event.stopPropagation();
    if (!disabled) {
      onChange?.(event);
    }
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
      {children && (
        <div className={selectionControlContentCls}>{children}</div>
      )}
    </label>
  );
};

export default Checkbox;
