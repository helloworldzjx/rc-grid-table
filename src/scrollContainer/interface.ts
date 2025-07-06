import { CSSProperties, HTMLAttributes, ReactNode, RefAttributes } from "react";

export interface ScrollBarContainerProps
  extends RefAttributes<HTMLDivElement>,
    HTMLAttributes<HTMLDivElement> {
  classNames: {
    inner?: string;
    hasXScrollbarCls?: string
    hasYScrollbarCls?: string
  };
  styles?: {
    content?: CSSProperties;
  };
  childrenNextSibling?: ReactNode
  contentController?: HTMLDivElement
  horizontalThumbController?: HTMLDivElement
  stickyHorizontalController?: HTMLDivElement
  shouldHorizontalUpdate?: any[];
  shouldVerticalUpdate?: any[];
  showHorizontal?: boolean | { offsetTop?: number | string, offsetBottom?: number | string };
  showVertical?: boolean | { offsetLeft?: number | string, offsetRight?: number | string };
  showStickyHorizontal?: boolean | { offsetStickyScroller?: number, getContainer?: () => HTMLElement };
}

export interface ScrollBarContainerRef {
  nativeElement: HTMLDivElement
  nativeScrollElement: HTMLDivElement
  nativeHorizontalTrackElement: HTMLDivElement
  nativeHorizontalThumbElement: HTMLDivElement
  nativeStickyHorizontalElement: HTMLDivElement
  nativeVeverticalTrackElement: HTMLDivElement
  nativeVeverticalThumbElement: HTMLDivElement
  scrollTo: (options?: ScrollToOptions) => void
  scrollToTop: () => void
  scrollToBottom: () => void
  scrollToLeft: () => void
  scrollToRight: () => void
}