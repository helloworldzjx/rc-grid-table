import classNames from 'classnames';
import React, { MouseEventHandler, RefCallback } from 'react';

import { isNum, isObject } from '../_utils/validate';
import { useStyles as useScrollStyles } from '../scrollContainer/style';
import type { TableSticky } from './interface';

interface HorizontalScrollbarProps {
  prefixCls: string;
  visible: boolean;
  sticky?: boolean | TableSticky;
  trackRef: RefCallback<HTMLDivElement>;
  thumbRef: RefCallback<HTMLDivElement>;
  thumbWidth: number;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
}

const getStickyOffset = (sticky?: boolean | TableSticky) => {
  if (!isObject(sticky)) return 0;

  const offset = sticky.offsetStickyScroller;
  return isNum(offset) ? offset : 0;
};

const HorizontalScrollbar: React.FC<HorizontalScrollbarProps> = ({
  prefixCls,
  visible,
  sticky,
  trackRef,
  thumbRef,
  thumbWidth,
  onMouseDown,
}) => {
  const {
    hashId,
    xScrollBarCls,
    xScrollBarStickyCls,
    xScrollBarThumbCls,
    xScrollBarShowCls,
  } = useScrollStyles(prefixCls);
  const stickyOffset = getStickyOffset(sticky);

  return (
    <div
      className={classNames(xScrollBarCls, hashId, {
        [xScrollBarStickyCls]: sticky,
        [xScrollBarShowCls]: visible,
      })}
      ref={trackRef}
      onMouseDown={onMouseDown}
      style={{
        bottom: sticky ? stickyOffset : 0,
      }}
    >
      <div
        className={xScrollBarThumbCls}
        ref={thumbRef}
        style={{ width: thumbWidth }}
      />
    </div>
  );
};

export default HorizontalScrollbar;
