import { UIEventHandler, useMemo, useState } from 'react';
import warning from '@rc-component/util/lib/warning';

import { useTableContext } from '../context';

const useVirtual = () => {
  const { 
    dataSource, 
    scrollY,
    virtual, 
    itemHeight = 40,
  } = useTableContext();

  const [scrollTop, setScrollTop] = useState(0);

  const tbodyScrollY = useMemo(() => {
    if(!virtual || !dataSource?.length) return scrollY

    if(virtual) {
      warning(!!scrollY, 'virtual table should prop `scrollY`')

      return {
        fullHeight: true,
        y: typeof scrollY === 'number' ? scrollY : scrollY?.y
      }
    }
  }, [virtual, scrollY, dataSource])

  const tbodyHeight = useMemo(() => {
    let prop = 'height'
    let y: number | string = 'auto'
    
    if(typeof tbodyScrollY === 'number') {
      y = tbodyScrollY || 'auto'
      prop = 'height'
    } else if(typeof tbodyScrollY === 'object') {
      y = tbodyScrollY.y || 'auto'
      prop = tbodyScrollY.fullHeight ? 'height' : 'max-height'
    }

    return {[prop]: y}
  }, [tbodyScrollY])

  const len = dataSource?.length || 0
  const virtualHeight = itemHeight * len
  const visibleCount = Math.ceil(virtualHeight / itemHeight) + 2
  const visibleHeight = itemHeight * visibleCount
  const startIdx = Math.ceil(scrollTop / visibleHeight)
  const endIdx = Math.min(startIdx + visibleCount, len - 1)

  const tbodyDataSource = useMemo(() => {
    return dataSource?.slice(startIdx * visibleCount, endIdx * visibleCount + visibleCount)
  }, [dataSource, itemHeight])

  const enableVirtual = useMemo(() => {
    return virtual && dataSource?.length
  }, [virtual, dataSource?.length])

  return {
    tbodyHeight,
    tbodyDataSource: enableVirtual ? tbodyDataSource : dataSource,
    ...enableVirtual && {
      onScrol: ((e) => {
        setScrollTop(e.currentTarget.scrollTop)
      }) as UIEventHandler<HTMLDivElement>,
    }
  }
}



// const containerRef = useRef(null);
//   const [scrollTop, setScrollTop] = useState(0);

//   // 计算可见区域参数
//   const visibleCount = Math.ceil(containerHeight / itemHeight);
//   const totalHeight = data.length * itemHeight;
  
//   // 虚拟渲染逻辑
//   const virtualRender = useMemo(() => {
//     if (!enableVirtual) return {
//       startIdx: 0,
//       endIdx: data.length - 1,
//       offsetY: 0
//     };

//     const startIdx = Math.floor(scrollTop / itemHeight);
//     const endIdx = Math.min(startIdx + visibleCount + 5, data.length - 1); // 增加缓冲项
//     return {
//       startIdx,
//       endIdx,
//       offsetY: startIdx * itemHeight
//     };
//   }, [scrollTop, data.length, enableVirtual]);

//   // 获取可见数据
//   const visibleData = useMemo(() => {
//     return data.slice(virtualRender.startIdx, virtualRender.endIdx + 1);
//   }, [data, virtualRender.startIdx, virtualRender.endIdx]);

//   // 滚动事件处理
//   const handleScroll = useCallback((e) => {
//     setScrollTop(e.target.scrollTop);
//   }, []);