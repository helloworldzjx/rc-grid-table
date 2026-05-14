import React, { FC, HTMLAttributes, MouseEvent } from "react";
import classNames from "classnames";

import { useStyles } from "../style";

interface RadioProps extends HTMLAttributes<HTMLSpanElement> {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (event: MouseEvent<HTMLElement>) => void;
}

const Radio: FC<RadioProps> = ({
  checked = false,
  disabled = false,
  className,
  onChange,
  ...rest
}) => {
  const {
    selectionControlCls,
    selectionRadioCls,
    selectionControlCheckedCls,
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
      role="radio"
      tabIndex={disabled ? -1 : 0}
      aria-checked={checked}
      aria-disabled={disabled}
      {...rest}
      className={classNames(
        selectionControlCls,
        selectionRadioCls,
        {
          [selectionControlCheckedCls]: checked,
          [selectionControlDisabledCls]: disabled,
        },
        className,
      )}
      onClick={handleClick}
    />
  );
};

export default Radio;
