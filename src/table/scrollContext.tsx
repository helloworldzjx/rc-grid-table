import React, { createContext, FC, PropsWithChildren, SetStateAction, UIEventHandler, useContext, useRef, useState } from "react";

import { TableScrollContextProps, TableScrollProviderProps } from "./interface";
import { ScrollBarContainerRef } from "../scrollContainer/interface";
import { useTableContext } from "./context";

const ScrollContext = createContext<TableScrollContextProps>({} as TableScrollContextProps);

const ScrollProvider: FC<PropsWithChildren<TableScrollProviderProps>> = ({ children, onScroll }) => {
  const { fixColumnsGapped } = useTableContext()

  const scrollRef = useRef<ScrollBarContainerRef>(null);
  const [isStart, setIsStart] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

  const handleScroll: UIEventHandler<HTMLDivElement> = (e) => {
    onScroll?.(e)

    if(fixColumnsGapped) {
      setIsStart(false)
      setIsEnd(false)
      return
    }

    const scrollLeft = e.currentTarget.scrollLeft
    const scrollWidth = e.currentTarget.scrollWidth
    const clientWidth = e.currentTarget.clientWidth
    
    if(scrollLeft === 0) {
      setIsStart(true)
    } else if(scrollWidth - clientWidth - scrollLeft <= 1) {
      setIsEnd(true)
    } else {
      setIsStart(false)
      setIsEnd(false)
    }
  }
  
  const updateScrollLeft = (dispatch: SetStateAction<number>) => {
    if (scrollRef.current!.nativeScrollElement) {
      const scrollLeft = typeof dispatch === 'function' ? dispatch(scrollRef.current!.nativeScrollElement.scrollLeft) : dispatch
      scrollRef.current!.nativeScrollElement.scrollLeft = scrollLeft
    }
  };

  return (
    <ScrollContext.Provider value={{ scrollRef, updateScrollLeft, isStart, isEnd, onScroll: handleScroll }}>
      {children}
    </ScrollContext.Provider>
  );
};

const useScrollContext = () => useContext(ScrollContext);

export {
  ScrollProvider as default,
  useScrollContext,
}
