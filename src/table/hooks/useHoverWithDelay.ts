
import { useState, useEffect, useRef } from 'react';

type Callback = () => void;

export function useHoverWithDelay(options: {
  onEnter?: Callback,
  onLeave?: Callback,
  delay?: number
}) {
  const {
    onEnter,
    onLeave,
    delay = 3000,
  } = options
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const handleMouseIn = () => {
    clearTimeout(timerRef.current);
    setIsHovered(true);
    onEnter?.();
  };

  const handleMouseOut = () => {
    timerRef.current = setTimeout(() => {
      setIsHovered(false);
      onLeave?.();
    }, delay);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return {
    isHovered,
    handleMouseIn,
    bind: {
      onMouseEnter: handleMouseIn,
      onMouseLeave: handleMouseOut
    }
  };
}
