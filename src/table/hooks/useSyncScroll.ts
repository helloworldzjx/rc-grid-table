import { useEffect } from 'react';

export const useSyncScroll = (...scrollElements: (HTMLDivElement | undefined)[]) => {

  const handleScroll = (sourceElement: HTMLDivElement, ...targerElements: HTMLDivElement[]) => {
    if (!sourceElement || !targerElements.length) return;
    
    targerElements.forEach((el) => {
      el.scrollLeft = sourceElement.scrollLeft
    })
  };

  useEffect(() => {
    const elements = (scrollElements || []).filter(Boolean) as HTMLDivElement[]
    const scrollFns = elements.map((sourceElement, index) => {
      const targerElements = elements.filter((_, idx) => idx !== index)
      return () => handleScroll(sourceElement, ...targerElements)
    })
    elements.forEach((el, index) => {
      el.addEventListener('scroll', scrollFns[index]);
    })

    return () => {
      elements.forEach((el, index) => {
        el.removeEventListener('scroll', () => scrollFns[index]);
      })
    };
  }, [...scrollElements]);
}
