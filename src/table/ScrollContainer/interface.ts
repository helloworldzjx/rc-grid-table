import {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  RefAttributes,
} from 'react';

export interface ScrollBarContainerProps
  extends RefAttributes<HTMLDivElement>,
    HTMLAttributes<HTMLDivElement> {
  classNames?: {
    inner?: string;
    hasYScrollbarCls?: string;
  };
  styles?: {
    content?: CSSProperties;
  };
  contentComponent?: ElementType;
  showVertical?:
    | boolean
    | { offsetLeft?: number | string; offsetRight?: number | string };
  updateDeps?: unknown[];
  onVerticalVisibleChange?: (visible: boolean) => void;
  onVerticalScroll?: (scrollTop: number) => boolean | void;
}

export interface ScrollBarContainerRef {
  nativeElement: HTMLDivElement;
  nativeScrollElement: HTMLDivElement;
  nativeVerticalTrackElement: HTMLDivElement;
  nativeVerticalThumbElement: HTMLDivElement;
  scrollTo: (options?: ScrollToOptions) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToLeft: () => void;
  scrollToRight: () => void;
}
