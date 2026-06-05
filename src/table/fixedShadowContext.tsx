import { createContext, useContext, useMemo } from 'react';

import type { FixedInfo } from './utils/fixedColumns';

export interface FixedShadowContextProps {
  scrollLeft: number;
  maxScrollLeft: number;
  fixColumnsGapped?: boolean;
  activeFixedStartShadowOffset?: number;
  activeFixedEndShadowOffset?: number;
}

interface FixedShadowActive {
  start: boolean;
  end: boolean;
}

const FixedShadowContext = createContext<FixedShadowContextProps>({
  scrollLeft: 0,
  maxScrollLeft: 0,
  fixColumnsGapped: false,
});

const useFixedShadowContext = () => useContext(FixedShadowContext);

export const useFixedShadowActive = (
  fixedInfo: FixedInfo,
): FixedShadowActive => {
  const {
    activeFixedStartShadowOffset,
    activeFixedEndShadowOffset,
    fixColumnsGapped,
  } = useFixedShadowContext();

  return useMemo(
    () => ({
      start:
        !!fixColumnsGapped &&
        !!fixedInfo.fixedStartShadow &&
        activeFixedStartShadowOffset ===
          (fixedInfo.offsetFixedStartShadow ?? 0),
      end:
        !!fixColumnsGapped &&
        !!fixedInfo.fixedEndShadow &&
        activeFixedEndShadowOffset === (fixedInfo.offsetFixedEndShadow ?? 0),
    }),
    [
      activeFixedStartShadowOffset,
      activeFixedEndShadowOffset,
      fixColumnsGapped,
      fixedInfo.fixedStartShadow,
      fixedInfo.fixedEndShadow,
      fixedInfo.offsetFixedStartShadow,
      fixedInfo.offsetFixedEndShadow,
    ],
  );
};

export default FixedShadowContext;
