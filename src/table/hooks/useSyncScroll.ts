
import { useEffect } from 'react';

export const useSyncScroll = (sourceElement?: HTMLDivElement, targerElement?: HTMLDivElement) => {

  const handleScroll = (source?: HTMLDivElement, target?: HTMLDivElement) => {
    if (!source || !target) return;
    
    target.scrollTo({left: source.scrollLeft});
  };

  useEffect(() => {
    const onDiv1Scroll = () => handleScroll(sourceElement, targerElement);
    const onDiv2Scroll = () => handleScroll(targerElement, sourceElement);

    sourceElement?.addEventListener('scroll', onDiv1Scroll);
    targerElement?.addEventListener('scroll', onDiv2Scroll);

    return () => {
      sourceElement?.removeEventListener('scroll', onDiv1Scroll);
      targerElement?.removeEventListener('scroll', onDiv2Scroll);
    };
  }, [sourceElement, targerElement]);
}
