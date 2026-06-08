/** 滚动条thumb最小size */
export const MIN_THUMB_SIZE = 20;

/** 滚动条size */
export const SCROLLBAR_SIZE = 12;

/** 滚动条thumb size */
export const SCROLLBAR_THUMB_SIZE = 8;

/** 滚动条thumb相对定位top */
export const SCROLLBAR_THUMB_ABSOLUTE_LEFT_TOP =
  (SCROLLBAR_SIZE - SCROLLBAR_THUMB_SIZE) / 2;

/** 滚动条显隐容差，避免临界宽度下反复闪烁 */
export const SCROLLBAR_VISIBLE_TOLERANCE = 1;

export const COLUMNS_SORT_OVERLAY_POINTER_OFFSET_X = 16;

/** 列排序预览 motion layout 的动画时长，释放 motionKeys 和 drag end 收尾等待都要与它保持一致 */
export const COLUMNS_SORT_MOTION_DURATION = 150;
