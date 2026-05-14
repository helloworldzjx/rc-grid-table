import React, { FC, HTMLAttributes, MouseEvent } from "react";
import classNames from "classnames";

import { useStyles } from "../style";

interface CheckboxProps extends HTMLAttributes<HTMLSpanElement> {
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
  onChange,
  ...rest
}) => {
  const {
    selectionControlCls,
    selectionCheckboxCls,
    selectionControlCheckedCls,
    selectionControlIndeterminateCls,
    selectionControlDisabledCls,
  } = useStyles();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!disabled) {
      onChange?.(event);
    }
  };

  return (
    <span
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
    />
  );
};

export default Checkbox;
