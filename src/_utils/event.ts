import {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';

export const preventDefaultIfCancelable = (
  event: Event | ReactMouseEvent | ReactTouchEvent,
) => {
  if (event.cancelable) {
    event.preventDefault();
    return true;
  }

  return false;
};

export type DragEventLike =
  | MouseEvent
  | TouchEvent
  | ReactMouseEvent
  | ReactTouchEvent;

export const getPageY = (event: DragEventLike) => {
  if ('touches' in event) {
    return event.touches[0]?.pageY ?? event.changedTouches[0]?.pageY ?? 0;
  }

  return event.pageY;
};

export const getPageX = (event: DragEventLike) => {
  if ('touches' in event) {
    return event.touches[0]?.pageX ?? event.changedTouches[0]?.pageX ?? 0;
  }

  return event.pageX;
};
