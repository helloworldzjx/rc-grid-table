import { useCallback, useState } from 'react';

export const useElementRef = <T extends HTMLElement>() => {
  const [element, setElement] = useState<T | null>(null);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  return [ref, element] as const;
};
