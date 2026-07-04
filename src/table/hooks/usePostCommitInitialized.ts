import { useCallback, useEffect, useRef, useState } from 'react';

const usePostCommitInitialized = () => {
  const [initialized, setInitialized] = useState(false);
  const [initializeCommitVersion, setInitializeCommitVersion] = useState(0);
  const initializedRef = useRef(initialized);

  initializedRef.current = initialized;

  const requestInitialized = useCallback(() => {
    if (initializedRef.current) return;

    setInitializeCommitVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (initializedRef.current || initializeCommitVersion <= 0) return;

    initializedRef.current = true;
    setInitialized(true);
  }, [initializeCommitVersion]);

  return [initialized, requestInitialized] as const;
};

export default usePostCommitInitialized;
