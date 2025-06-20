import { CSSProperties, HTMLAttributes, ReactNode, RefAttributes } from "react";

export interface ScrollBarContainerProps
  extends RefAttributes<HTMLDivElement>,
    HTMLAttributes<HTMLDivElement> {
  classNames: {
    inner?: string;
  };
  styles?: {
    content?: CSSProperties;
  };
  shouldUpdate?: any[];
  showHorizontal?: boolean | { offsetTop?: number, offsetBottom?: number };
  showVertical?: boolean | { offsetLeft?: number, offsetRight?: number };
  showStickyHorizontal?: boolean | { offsetTop?: number, offsetBottom?: number };
  footer?: ReactNode
}

export interface ScrollBarContainerRef {
  nativeElement: HTMLDivElement
  nativeScrollElement: HTMLDivElement
  nativeHorizontalTrackElement: HTMLDivElement
  natiVeverticalTrackElement: HTMLDivElement
  scrollTo: () => void
  scrollToTop: () => void
  scrollToBottom: () => void
  scrollToLeft: () => void
  scrollToRight: () => void
}