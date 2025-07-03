import { useEffect, useRef } from "react";

const useHorizontalWheelScroll = (container: HTMLDivElement) => {
  const isAnimating = useRef(false)
  const currentScrollX = useRef(0)
  const targetScrollX = useRef(0)

  function animateScroll() {
    // 计算剩余滚动距离（带缓动系数）
    const diff = (targetScrollX.current - currentScrollX.current) * 0.3;
    currentScrollX.current += diff;
    container.scrollLeft = currentScrollX.current;

    // 持续滚动判定（距离>0.5px继续动画）
    if (Math.abs(diff) > 0.5) {
      requestAnimationFrame(animateScroll);
      const event = new Event('scroll');
      container.dispatchEvent(event);
    } else {
      container.scrollLeft = targetScrollX.current;  // 最终位置校准
      isAnimating.current = false;
    }
  }

  const handleWheel = (e: WheelEvent) => {
    const deltaX = e.shiftKey ? e.deltaY : e.deltaX
    if (deltaX && container) {
      e.preventDefault();
      
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      const maxScrollLeft = scrollWidth - clientWidth
      const next = targetScrollX.current + deltaX;
      
      targetScrollX.current = Math.max(0, Math.min(next, maxScrollLeft));
  
      // 首次触发时启动动画循环
      if (!isAnimating.current) {
        isAnimating.current = true;
        requestAnimationFrame(animateScroll);
      }
    }
  }

  useEffect(() => {
    container?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container?.removeEventListener('wheel', handleWheel);
    }
  }, [container]);
};

export default useHorizontalWheelScroll