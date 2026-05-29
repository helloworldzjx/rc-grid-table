import classNames from 'classnames';
import React, {
  FC,
  LabelHTMLAttributes,
  MouseEvent,
  PointerEvent,
} from 'react';

import { useStyles } from '../style';

type RadioProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> & {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (event: MouseEvent<HTMLElement>) => void;
};

const Radio: FC<RadioProps> = ({
  checked = false,
  disabled = false,
  className,
  children,
  onChange,
  onPointerDown,
  onMouseDown,
  ...rest
}) => {
  const {
    selectionControlCls,
    selectionControlInputCls,
    selectionControlContentCls,
    selectionRadioCls,
    selectionControlCheckedCls,
    selectionControlDisabledCls,
  } = useStyles();

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
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
    >
      <div className={selectionControlInputCls}>
        <input
          type="radio"
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

export default Radio;
